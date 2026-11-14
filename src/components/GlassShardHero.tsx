import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ArrowLeft } from "lucide-react";

interface GlassShardHeroProps {
  onSignIn?: () => void;
  onOpenStudio?: () => void;
  onClose?: () => void;
  showBackToDashboard?: boolean;
}

export const GlassShardHero: React.FC<GlassShardHeroProps> = ({
  onSignIn,
  onOpenStudio,
  onClose,
  showBackToDashboard = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isDefinitionsActive, setIsDefinitionsActive] = useState(false);
  const [isBackHovered, setIsBackHovered] = useState(false);

  useEffect(() => {
    // Check WebGL availability
    function checkWebGL() {
      try {
        const c = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (c.getContext("webgl") || c.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    }

    if (!checkWebGL()) {
      setIsSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    const rawContainer = containerRef.current;
    if (!canvas || !rawContainer) return;
    const container: HTMLDivElement = rawContainer;

    let isDisposed = false;
    let reqAnimationId = 0;

    // State machine: assembled | shattering | shattered | reassembling
    const STATE_ASSEMBLED = "assembled";
    const STATE_SHATTERING = "shattering";
    const STATE_SHATTERED = "shattered";
    const STATE_REASSEMBLING = "reassembling";
    let currentState = STATE_ASSEMBLED;

    // Pointer state
    const pointer = {
      x: 0,
      y: 0,
      inside: false,
      world: new THREE.Vector3(0, 0, 0),
      panelNorm: { x: 0.5, y: 0.5 },
    };

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050507);

    // Camera: perspective, fov 30°, placed so 1 world unit = 1 CSS px at z = 0
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
    scene.add(camera);

    // Environment & PMREM
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTex = pmrem.fromScene(roomEnv).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.42;

    // Key light: soft white-blue light from top-left
    const keyLight = new THREE.DirectionalLight(0xd8e8ff, 2.2);
    keyLight.position.set(-800, 1100, 850);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38384a, 0.8);
    fillLight.position.set(600, -500, 400);
    scene.add(fillLight);

    // Groups
    const slabGroup = new THREE.Group();
    scene.add(slabGroup);

    const backGroup = new THREE.Group();
    scene.add(backGroup);

    // Lavender cursor glow uniforms
    const cursorGlowUniforms = {
      uPointerWorld: { value: new THREE.Vector3(0, 0, 0) },
      uPointerGlow: { value: 0 },
      uGlowScale: { value: 300 },
    };

    function createGlassMaterial(options: { iridescence?: number; noCursorGlow?: boolean } = {}) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x17171b),
        roughness: 0.36,
        metalness: 0.04,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        specularIntensity: 0.7,
        iridescence: options.iridescence !== undefined ? options.iridescence : 0.55,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [250, 650],
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
      });

      if (!options.noCursorGlow) {
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uPointerWorld = cursorGlowUniforms.uPointerWorld;
          shader.uniforms.uPointerGlow = cursorGlowUniforms.uPointerGlow;
          shader.uniforms.uGlowScale = cursorGlowUniforms.uGlowScale;

          shader.vertexShader = `
            varying vec3 vGlassWorldPos;
            ${shader.vertexShader}
          `.replace(
            "#include <worldpos_vertex>",
            `#include <worldpos_vertex>
            vGlassWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );

          shader.fragmentShader = `
            uniform vec3 uPointerWorld;
            uniform float uPointerGlow;
            uniform float uGlowScale;
            varying vec3 vGlassWorldPos;
            ${shader.fragmentShader}
          `.replace(
            "#include <dithering_fragment>",
            `
            float d = length(vGlassWorldPos.xy - uPointerWorld.xy);
            float glowExp = exp(-1.6 * pow(d / max(uGlowScale, 1.0), 2.0));
            vec3 lavenderGlow = vec3(0.42, 0.37, 0.62) * 0.16 * glowExp * uPointerGlow;
            gl_FragColor.rgb += lavenderGlow;
            #include <dithering_fragment>
            `
          );
        };
      }
      return mat;
    }

    const glassMaterial = createGlassMaterial();
    const backShardMaterial = createGlassMaterial({ iridescence: 0.35, noCursorGlow: true });

    // Sizing & coordinates
    let W = window.innerWidth;
    let H = window.innerHeight;
    let isPortrait = H > W;
    let blockWidth = 0,
      blockHeight = 0,
      S = 1;
    let navHeight = 0,
      gap = 0,
      panelWidth = 0,
      panelHeight = 0;
    let navY = 0,
      panelY = 0;

    // 2D Canvas Textures
    const pageCanvas = document.createElement("canvas");
    const pageCtx = pageCanvas.getContext("2d")!;
    const pageTexture = new THREE.CanvasTexture(pageCanvas);
    pageTexture.minFilter = THREE.LinearFilter;
    pageTexture.magFilter = THREE.LinearFilter;
    pageTexture.generateMipmaps = false;

    const navCanvas = document.createElement("canvas");
    const navCtx = navCanvas.getContext("2d")!;
    const navTexture = new THREE.CanvasTexture(navCanvas);
    navTexture.minFilter = THREE.LinearFilter;
    navTexture.magFilter = THREE.LinearFilter;
    navTexture.generateMipmaps = false;

    let isHoveringOpenStudio = false;
    let isHoveringReadPaper = false;

    function updateCanvasTextures() {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);

      // Panel Canvas
      pageCanvas.width = Math.round(panelWidth * dpr);
      pageCanvas.height = Math.round(panelHeight * dpr);
      pageCtx.save();
      pageCtx.scale(dpr, dpr);
      pageCtx.clearRect(0, 0, panelWidth, panelHeight);

      // Eyebrow
      const eyebrowY = panelHeight * 0.135;
      const eyebrowSize = Math.max(10, 11 * S);
      pageCtx.font = `500 ${eyebrowSize}px 'Inter', sans-serif`;
      pageCtx.fillStyle = "rgba(167, 139, 250, 0.75)";
      pageCtx.letterSpacing = "0.2em";
      pageCtx.fillText("ACADEMIC PRODUCTIVITY OS · 5 CORE COURSES", panelWidth * 0.08, eyebrowY);

      // Headline
      const headlineSize = Math.max(28, Math.min(panelWidth * 0.078, panelHeight * 0.2));
      pageCtx.font = `600 ${headlineSize}px 'Inter', sans-serif`;
      pageCtx.letterSpacing = "-0.045em";
      const lineH = headlineSize * 0.97;
      const headlineY = eyebrowY + eyebrowSize + 22 * S + lineH;

      const grad = pageCtx.createLinearGradient(0, headlineY - lineH, 0, headlineY + lineH);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#c4b5fd");
      pageCtx.fillStyle = grad;
      pageCtx.fillText("Master your", panelWidth * 0.08, headlineY);
      pageCtx.fillText("semester in glass.", panelWidth * 0.08, headlineY + lineH);

      // Subtitle
      const subSize = Math.max(12, 16 * S);
      pageCtx.font = `400 ${subSize}px 'Inter', sans-serif`;
      pageCtx.letterSpacing = "normal";
      pageCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
      const subY = headlineY + lineH + 34 * S;
      pageCtx.fillText(
        "Distraction-free preparation for your end-semesters. Track all 24",
        panelWidth * 0.08,
        subY
      );
      pageCtx.fillText("syllabus units with real-time countdowns.", panelWidth * 0.08, subY + subSize * 1.5);

      // Button: "Sign in" / "Open dashboard"
      const btnW = Math.max(110, 128 * S);
      const btnH = Math.max(34, 40 * S);
      const btnX = panelWidth * 0.08;
      const btnY = subY + subSize * 1.5 + 32 * S;
      const btnR = 6 * S;

      pageCtx.beginPath();
      pageCtx.roundRect(btnX, btnY, btnW, btnH, btnR);
      if (isHoveringOpenStudio) {
        pageCtx.fillStyle = "#10B96F";
        pageCtx.fill();
        pageCtx.fillStyle = "#FAFCFB";
        pageCtx.font = `600 ${Math.max(12, 13 * S)}px 'Inter', sans-serif`;
      } else {
        pageCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
        pageCtx.fill();
        pageCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        pageCtx.lineWidth = 1;
        pageCtx.stroke();
        pageCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
        pageCtx.font = `500 ${Math.max(12, 13 * S)}px 'Inter', sans-serif`;
      }
      pageCtx.textAlign = "center";
      pageCtx.textBaseline = "middle";
      pageCtx.fillText("Sign in", btnX + btnW / 2, btnY + btnH / 2);

      // Link: "Explore syllabus →"
      const linkX = btnX + btnW + 24 * S;
      const linkY = btnY + btnH / 2;
      pageCtx.textAlign = "left";
      pageCtx.textBaseline = "middle";
      pageCtx.font = `500 ${Math.max(12, 13 * S)}px 'Inter', sans-serif`;
      pageCtx.fillStyle = "rgba(167, 139, 250, 0.9)";
      pageCtx.fillText("Explore syllabus →", linkX, linkY);
      if (isHoveringReadPaper) {
        const m = pageCtx.measureText("Explore syllabus →");
        pageCtx.strokeStyle = "rgba(167, 139, 250, 1)";
        pageCtx.lineWidth = 1;
        pageCtx.beginPath();
        pageCtx.moveTo(linkX, linkY + 9 * S);
        pageCtx.lineTo(linkX + m.width, linkY + 9 * S);
        pageCtx.stroke();
      }

      // Footer
      const footerSize = Math.max(10, 11 * S);
      const footerY = panelHeight - 26 * S;
      pageCtx.font = `400 ${footerSize}px 'Inter', sans-serif`;
      pageCtx.fillStyle = "rgba(255, 255, 255, 0.35)";
      pageCtx.textAlign = "left";
      pageCtx.textBaseline = "alphabetic";
      pageCtx.fillText("© SEMTRACK Academic OS", panelWidth * 0.08, footerY);

      pageCtx.textAlign = "right";
      pageCtx.fillText("Protected by Supabase RLS", panelWidth * 0.92, footerY);

      pageCtx.restore();
      pageTexture.needsUpdate = true;

      // Nav Canvas
      navCanvas.width = Math.round(blockWidth * dpr);
      navCanvas.height = Math.round(navHeight * dpr);
      navCtx.save();
      navCtx.scale(dpr, dpr);
      navCtx.clearRect(0, 0, blockWidth, navHeight);

      const navPad = Math.max(18, 36 * S);
      const navCenterY = navHeight / 2;

      // Mark + "SEMTRACK"
      const markSize = Math.max(12, 14 * S);
      navCtx.strokeStyle = "rgba(16, 185, 111, 0.8)";
      navCtx.lineWidth = 1.5;
      navCtx.beginPath();
      navCtx.roundRect(navPad, navCenterY - markSize / 2, markSize, markSize, 3);
      navCtx.stroke();
      navCtx.fillStyle = "rgba(16, 185, 111, 0.2)";
      navCtx.fill();

      navCtx.font = `700 ${Math.max(13, 15 * S)}px 'Inter', sans-serif`;
      navCtx.fillStyle = "#ffffff";
      navCtx.textAlign = "left";
      navCtx.textBaseline = "middle";
      navCtx.fillText("SEMTRACK", navPad + markSize + 10 * S, navCenterY);

      // Nav Links
      navCtx.textAlign = "center";
      navCtx.font = `450 ${Math.max(12, 13 * S)}px 'Inter', sans-serif`;
      navCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
      navCtx.fillText("Dashboard  ·  Subjects  ·  Timetable  ·  Analytics", blockWidth / 2, navCenterY);

      // Sign in
      navCtx.textAlign = "right";
      navCtx.font = `500 ${Math.max(12, 13 * S)}px 'Inter', sans-serif`;
      navCtx.fillStyle = "rgba(167, 139, 250, 0.95)";
      navCtx.fillText("Sign In", blockWidth - navPad, navCenterY);

      navCtx.restore();
      navTexture.needsUpdate = true;
    }

    function updateLayoutDimensions() {
      W = window.innerWidth;
      H = window.innerHeight;
      isPortrait = H > W;

      const isMobile = W < 600;
      const sideMargin = isMobile ? 16 : W * 0.055;
      const topBottomMargin = isMobile ? 16 : H * 0.085;

      blockWidth = W - sideMargin * 2;
      blockHeight = H - topBottomMargin * 2;
      S = blockWidth / 1730;

      navHeight = blockHeight * 0.108;
      gap = 14 * S;
      panelHeight = blockHeight - navHeight - gap;
      panelWidth = blockWidth;

      navY = blockHeight / 2 - navHeight / 2;
      panelY = -blockHeight / 2 + panelHeight / 2;

      const fovRad = (camera.fov * Math.PI) / 180;
      const cameraZ = H / 2 / Math.tan(fovRad / 2);
      camera.position.set(0, 0, cameraZ);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      renderer.setSize(W, H);
      cursorGlowUniforms.uGlowScale.value = 300 * S;

      updateCanvasTextures();
      syncDomLayout();
    }

    function syncDomLayout() {
      const domNav = container.querySelector("#dom-nav") as HTMLElement | null;
      const domPanel = container.querySelector("#dom-panel") as HTMLElement | null;
      if (!domNav || !domPanel) return;

      const navPad = Math.max(18, 36 * S);
      domNav.style.height = `${navHeight}px`;
      domNav.style.paddingLeft = `${navPad}px`;
      domNav.style.paddingRight = `${navPad}px`;

      const markSize = Math.max(12, 14 * S);
      const navMark = container.querySelector("#nav-mark") as HTMLElement | null;
      if (navMark) {
        navMark.style.width = `${markSize}px`;
        navMark.style.height = `${markSize}px`;
      }

      const brandText = container.querySelector("#nav-brand-text") as HTMLElement | null;
      if (brandText) brandText.style.fontSize = `${Math.max(13, 15 * S)}px`;

      const navLinks = container.querySelector("#nav-links") as HTMLElement | null;
      if (navLinks) navLinks.style.fontSize = `${Math.max(12, 13 * S)}px`;

      const navSignin = container.querySelector("#nav-signin") as HTMLElement | null;
      if (navSignin) navSignin.style.fontSize = `${Math.max(12, 13 * S)}px`;

      domPanel.style.top = `${navHeight + gap}px`;
      domPanel.style.height = `${panelHeight}px`;

      const eyebrow = container.querySelector("#dom-eyebrow") as HTMLElement | null;
      const eyebrowY = panelHeight * 0.135;
      const eyebrowSize = Math.max(10, 11 * S);
      if (eyebrow) {
        eyebrow.style.left = `${panelWidth * 0.08}px`;
        eyebrow.style.top = `${eyebrowY}px`;
        eyebrow.style.fontSize = `${eyebrowSize}px`;
      }

      const headline = container.querySelector("#dom-headline") as HTMLElement | null;
      const headlineSize = Math.max(28, Math.min(panelWidth * 0.078, panelHeight * 0.2));
      const lineH = headlineSize * 0.97;
      const headlineY = eyebrowY + eyebrowSize + 22 * S;
      if (headline) {
        headline.style.left = `${panelWidth * 0.08}px`;
        headline.style.top = `${headlineY}px`;
        headline.style.fontSize = `${headlineSize}px`;
      }

      const sub = container.querySelector("#dom-sub") as HTMLElement | null;
      const subSize = Math.max(12, 16 * S);
      const subY = headlineY + lineH * 2 + 16 * S;
      if (sub) {
        sub.style.left = `${panelWidth * 0.08}px`;
        sub.style.top = `${subY}px`;
        sub.style.fontSize = `${subSize}px`;
      }

      const actions = container.querySelector("#dom-actions") as HTMLElement | null;
      const actionsY = subY + subSize * 2.8 + 24 * S;
      if (actions) {
        actions.style.left = `${panelWidth * 0.08}px`;
        actions.style.top = `${actionsY}px`;
      }

      const btn = container.querySelector("#btn-open-studio") as HTMLElement | null;
      if (btn) {
        btn.style.width = `${Math.max(100, 116 * S)}px`;
        btn.style.height = `${Math.max(34, 40 * S)}px`;
        btn.style.fontSize = `${Math.max(12, 13 * S)}px`;
      }

      const link = container.querySelector("#link-read-paper") as HTMLElement | null;
      if (link) link.style.fontSize = `${Math.max(12, 13 * S)}px`;

      const fLeft = container.querySelector("#dom-footer-left") as HTMLElement | null;
      const fRight = container.querySelector("#dom-footer-right") as HTMLElement | null;
      const footerSize = Math.max(10, 11 * S);
      const footerY = panelHeight - 26 * S;

      if (fLeft) {
        fLeft.style.left = `${panelWidth * 0.08}px`;
        fLeft.style.top = `${footerY}px`;
        fLeft.style.fontSize = `${footerSize}px`;
      }
      if (fRight) {
        fRight.style.right = `${panelWidth * 0.08}px`;
        fRight.style.top = `${footerY}px`;
        fRight.style.fontSize = `${footerSize}px`;
      }

      const homographyBox = container.querySelector("#homography-container") as HTMLElement | null;
      if (homographyBox) {
        homographyBox.style.width = `${blockWidth}px`;
        homographyBox.style.height = `${blockHeight}px`;
      }
    }

    // Cut Pattern Definitions
    const BASE_POINTS: Record<string, [number, number]> = {
      TL: [0, 0],
      TR: [1, 0],
      BR: [1, 1],
      BL: [0, 1],
      tAB: [0.22, 0],
      tBC: [0.515, 0],
      tCE: [0.84, 0],
      bAD: [0.34, 1],
      bDE: [0.865, 1],
      J0: [0.385, 0.72],
      J1: [0.48, 0.62],
      J2: [0.716, 0.49],
    };

    const DRIFT_CONFIG: Record<string, { fx: number; px: number; fy: number; py: number }> = {
      tAB: { fx: 0.055, px: 0.4, fy: 0, py: 0 },
      tBC: { fx: 0.072, px: 1.8, fy: 0, py: 0 },
      tCE: { fx: 0.061, px: 3.2, fy: 0, py: 0 },
      bAD: { fx: 0.068, px: 0.9, fy: 0, py: 0 },
      bDE: { fx: 0.052, px: 2.5, fy: 0, py: 0 },
      J0: { fx: 0.081, px: 1.2, fy: 0.065, py: 2.1 },
      J1: { fx: 0.074, px: 2.9, fy: 0.058, py: 0.7 },
      J2: { fx: 0.063, px: 4.1, fy: 0.071, py: 3.5 },
    };

    const CELL_KEYS: Record<string, string[]> = {
      A: ["TL", "tAB", "J0", "bAD", "BL"],
      B: ["tAB", "tBC", "J1", "J0"],
      C: ["tBC", "tCE", "J2", "J1"],
      D: ["J0", "J1", "J2", "bDE", "bAD"],
      E: ["tCE", "TR", "BR", "bDE", "J2"],
    };

    class ShardPiece {
      id: number;
      name: string;
      isNav: boolean;
      group: THREE.Group;
      glassMesh: THREE.Mesh | null = null;
      textMesh: THREE.Mesh | null = null;
      assembledPos = new THREE.Vector3();
      assembledRot = new THREE.Euler();
      hoverTargetZ = 0;
      hoverTargetTipX = 0;
      hoverTargetTipY = 0;
      springZ = 0;
      springVelZ = 0;
      springTipX = 0;
      springVelTipX = 0;
      springTipY = 0;
      springVelTipY = 0;
      iridescence = 0.55;
      envMapIntensity = 1.0;
      shatterVelocity = new THREE.Vector3();
      shatterTumbleAxis = new THREE.Vector3();
      shatterTumbleAngle = 0;
      staggerDelay = 0;

      constructor(id: number, name: string, isNav = false) {
        this.id = id;
        this.name = name;
        this.isNav = isNav;
        this.group = new THREE.Group();
        slabGroup.add(this.group);
      }

      updateSpring(dt: number) {
        const k = 170;
        const c = 19;

        const fZ = -k * (this.springZ - this.hoverTargetZ) - c * this.springVelZ;
        this.springVelZ += fZ * dt;
        this.springZ += this.springVelZ * dt;

        const fTipX = -k * (this.springTipX - this.hoverTargetTipX) - c * this.springVelTipX;
        this.springVelTipX += fTipX * dt;
        this.springTipX += this.springVelTipX * dt;

        const fTipY = -k * (this.springTipY - this.hoverTargetTipY) - c * this.springVelTipY;
        this.springVelTipY += fTipY * dt;
        this.springTipY += this.springVelTipY * dt;

        const targetIri = this.hoverTargetZ > 0 ? 1.0 : 0.55;
        const targetEnv = this.hoverTargetZ > 0 ? 1.9 : 1.0;
        this.iridescence += (targetIri - this.iridescence) * Math.min(1, dt * 10);
        this.envMapIntensity += (targetEnv - this.envMapIntensity) * Math.min(1, dt * 10);

        if (this.glassMesh && this.glassMesh.material instanceof THREE.MeshPhysicalMaterial) {
          this.glassMesh.material.iridescence = this.iridescence;
          this.glassMesh.material.envMapIntensity = this.envMapIntensity;
        }
      }

      applyTransform(progress: number) {
        if (progress > 0.0001) {
          const disp = this.shatterVelocity.clone().multiplyScalar(progress);
          disp.y -= 1200 * S * (progress * progress);

          this.group.position.copy(this.assembledPos).add(disp);

          const qTumble = new THREE.Quaternion().setFromAxisAngle(
            this.shatterTumbleAxis,
            this.shatterTumbleAngle * progress
          );
          const qBase = new THREE.Quaternion().setFromEuler(this.assembledRot);
          qBase.multiply(qTumble);
          this.group.quaternion.copy(qBase);
        } else {
          this.group.position.set(
            this.assembledPos.x,
            this.assembledPos.y,
            this.assembledPos.z + this.springZ
          );
          this.group.rotation.set(
            this.assembledRot.x + this.springTipX,
            this.assembledRot.y + this.springTipY,
            this.assembledRot.z
          );
        }
      }
    }

    const shards: ShardPiece[] = [
      new ShardPiece(0, "nav", true),
      new ShardPiece(1, "A", false),
      new ShardPiece(2, "B", false),
      new ShardPiece(3, "C", false),
      new ShardPiece(4, "D", false),
      new ShardPiece(5, "E", false),
    ];

    shards[0].staggerDelay = 0.0;
    shards[1].staggerDelay = 0.03;
    shards[2].staggerDelay = 0.06;
    shards[3].staggerDelay = 0.09;
    shards[4].staggerDelay = 0.12;
    shards[5].staggerDelay = 0.15;

    function insetPolygon(poly: [number, number][], dist: number): [number, number][] {
      const n = poly.length;
      const lines = [];
      for (let i = 0; i < n; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % n];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const sx = p1[0] + nx * dist;
        const sy = p1[1] + ny * dist;
        lines.push({ p: [sx, sy], d: [dx / len, dy / len], n: [nx, ny] });
      }

      const inset: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const l1 = lines[(i - 1 + n) % n];
        const l2 = lines[i];
        const denom = l1.d[0] * l2.n[0] + l1.d[1] * l2.n[1];
        if (Math.abs(denom) < 1e-5) {
          inset.push([l2.p[0], l2.p[1]]);
        } else {
          const num = (l2.p[0] - l1.p[0]) * l2.n[0] + (l2.p[1] - l1.p[1]) * l2.n[1];
          const t = num / denom;
          inset.push([l1.p[0] + t * l1.d[0], l1.p[1] + t * l1.d[1]]);
        }
      }
      return inset;
    }

    function getSignedArea(poly: [number, number][]): number {
      let a = 0;
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i],
          p2 = poly[(i + 1) % poly.length];
        a += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return a / 2;
    }

    function createRoundedShape(insetPoly: [number, number][], cornerRadius: number): THREE.Shape {
      const n = insetPoly.length;
      const shape = new THREE.Shape();

      const fillets = [];
      for (let i = 0; i < n; i++) {
        const prev = insetPoly[(i - 1 + n) % n];
        const curr = insetPoly[i];
        const next = insetPoly[(i + 1) % n];

        const dxIn = prev[0] - curr[0],
          dyIn = prev[1] - curr[1];
        const lenIn = Math.hypot(dxIn, dyIn) || 1;
        const uIn = [dxIn / lenIn, dyIn / lenIn];

        const dxOut = next[0] - curr[0],
          dyOut = next[1] - curr[1];
        const lenOut = Math.hypot(dxOut, dyOut) || 1;
        const uOut = [dxOut / lenOut, dyOut / lenOut];

        const cosB = Math.max(-0.999, Math.min(0.999, uIn[0] * uOut[0] + uIn[1] * uOut[1]));
        const tanHalf = Math.sqrt((1 + cosB) / (1 - cosB));
        const tDist = Math.min(cornerRadius * tanHalf, lenIn * 0.42, lenOut * 0.42);

        const pStart: [number, number] = [curr[0] + uIn[0] * tDist, curr[1] + uIn[1] * tDist];
        const pEnd: [number, number] = [curr[0] + uOut[0] * tDist, curr[1] + uOut[1] * tDist];
        fillets.push({ start: pStart, end: pEnd, control: curr });
      }

      shape.moveTo(fillets[0].end[0], fillets[0].end[1]);
      for (let i = 0; i < n; i++) {
        const nextIdx = (i + 1) % n;
        shape.lineTo(fillets[nextIdx].start[0], fillets[nextIdx].start[1]);
        shape.quadraticCurveTo(
          fillets[nextIdx].control[0],
          fillets[nextIdx].control[1],
          fillets[nextIdx].end[0],
          fillets[nextIdx].end[1]
        );
      }
      return shape;
    }

    let lastRebuildTime = 0;

    function rebuildGeometries(time: number) {
      const currentPoints: Record<string, [number, number]> = {};
      for (const [key, base] of Object.entries(BASE_POINTS)) {
        let nx = base[0];
        let ny = base[1];

        const cfg = DRIFT_CONFIG[key];
        if (cfg) {
          nx += Math.sin(time * cfg.fx + cfg.px) * 0.03;
          if (cfg.fy > 0) {
            ny += Math.sin(time * cfg.fy + cfg.py) * 0.05;
          }
        }

        if (pointer.inside) {
          const dx = nx - pointer.panelNorm.x;
          const dy = ny - pointer.panelNorm.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.6 && dist > 0.001) {
            const pushFactor = (1.0 - dist / 0.6) * 0.05;
            nx += (dx / dist) * pushFactor;
            if (cfg && cfg.fy > 0) {
              ny += (dy / dist) * pushFactor;
            }
          }
        }
        currentPoints[key] = [nx, ny];
      }

      const cornerR = 20 * S;
      const extrudeDepth = 13 * S;
      const bevelThick = 2.6 * S;
      const extrudeSettings = {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelThickness: bevelThick,
        bevelSize: bevelThick,
        bevelSegments: 3,
      };

      // Nav slab
      const navShard = shards[0];
      const halfNavW = (blockWidth - 14 * S) / 2;
      const halfNavH = (navHeight - 14 * S) / 2;
      const navPoly: [number, number][] = [
        [-halfNavW, -halfNavH],
        [halfNavW, -halfNavH],
        [halfNavW, halfNavH],
        [-halfNavW, halfNavH],
      ];
      const navShape = createRoundedShape(navPoly, cornerR);
      const navGeo = new THREE.ExtrudeGeometry(navShape, extrudeSettings);

      if (navShard.glassMesh) {
        navShard.glassMesh.geometry.dispose();
        navShard.glassMesh.geometry = navGeo;
      } else {
        navShard.glassMesh = new THREE.Mesh(navGeo, glassMaterial.clone());
        navShard.group.add(navShard.glassMesh);
      }
      navShard.assembledPos.set(0, navY, 0);

      const navTextGeo = new THREE.ShapeGeometry(navShape);
      const navPosAttr = navTextGeo.attributes.position;
      const navUvs = [];
      for (let i = 0; i < navPosAttr.count; i++) {
        const vx = navPosAttr.getX(i);
        const vy = navPosAttr.getY(i);
        const u = (vx + halfNavW) / (halfNavW * 2);
        const v = (vy + halfNavH) / (halfNavH * 2);
        navUvs.push(u, v);
      }
      navTextGeo.setAttribute("uv", new THREE.Float32BufferAttribute(navUvs, 2));

      if (navShard.textMesh) {
        navShard.textMesh.geometry.dispose();
        navShard.textMesh.geometry = navTextGeo;
      } else {
        const textMat = new THREE.MeshBasicMaterial({
          map: navTexture,
          transparent: true,
          opacity: 1.0,
          depthWrite: false,
        });
        navShard.textMesh = new THREE.Mesh(navTextGeo, textMat);
        navShard.textMesh.position.z = extrudeDepth + bevelThick + 0.15 * S;
        navShard.group.add(navShard.textMesh);
      }

      // Shard Cells A, B, C, D, E
      const cellNames = ["A", "B", "C", "D", "E"];
      for (let idx = 0; idx < cellNames.length; idx++) {
        const cName = cellNames[idx];
        const shard = shards[idx + 1];
        const ptNames = CELL_KEYS[cName];

        let rawPoly: [number, number][] = ptNames.map((pName) => {
          let [nx, ny] = currentPoints[pName];
          if (isPortrait) {
            const tmp = nx;
            nx = ny;
            ny = tmp;
          }
          return [(nx - 0.5) * panelWidth, (0.5 - ny) * panelHeight];
        });

        if (getSignedArea(rawPoly) < 0) rawPoly.reverse();

        const insetPoly = insetPolygon(rawPoly, 7 * S);

        let cx = 0,
          cy = 0;
        for (const p of insetPoly) {
          cx += p[0];
          cy += p[1];
        }
        cx /= insetPoly.length;
        cy /= insetPoly.length;

        const localPoly: [number, number][] = insetPoly.map((p) => [p[0] - cx, p[1] - cy]);
        const roundedShape = createRoundedShape(localPoly, cornerR);
        const shardGeo = new THREE.ExtrudeGeometry(roundedShape, extrudeSettings);

        if (shard.glassMesh) {
          shard.glassMesh.geometry.dispose();
          shard.glassMesh.geometry = shardGeo;
        } else {
          shard.glassMesh = new THREE.Mesh(shardGeo, glassMaterial.clone());
          shard.group.add(shard.glassMesh);
        }

        shard.assembledPos.set(cx, panelY + cy, 0);

        const textGeo = new THREE.ShapeGeometry(roundedShape);
        const posAttr = textGeo.attributes.position;
        const uvs = [];
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i) + cx;
          const vy = posAttr.getY(i) + cy;
          const u = (vx + panelWidth / 2) / panelWidth;
          const v = (vy + panelHeight / 2) / panelHeight;
          uvs.push(u, v);
        }
        textGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

        if (shard.textMesh) {
          shard.textMesh.geometry.dispose();
          shard.textMesh.geometry = textGeo;
        } else {
          const textMat = new THREE.MeshBasicMaterial({
            map: pageTexture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
          });
          shard.textMesh = new THREE.Mesh(textGeo, textMat);
          shard.textMesh.position.z = extrudeDepth + bevelThick + 0.15 * S;
          shard.group.add(shard.textMesh);
        }
      }
    }

    function prepareShatterTrajectories() {
      for (const shard of shards) {
        const angle = Math.atan2(shard.assembledPos.y, shard.assembledPos.x);
        const outSpeed = (600 + Math.random() * 450) * S;
        const vx = Math.cos(angle) * outSpeed;
        const vy = Math.sin(angle) * outSpeed - (250 + Math.random() * 300) * S;
        const vz = (420 + Math.random() * 380) * S;

        shard.shatterVelocity.set(vx, vy, vz);
        shard.shatterTumbleAxis.set(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        shard.shatterTumbleAngle = 2.0 + Math.random() * 1.6;
      }
    }

    // Back sliver setup
    let backMesh: THREE.Mesh | null = null;
    function updateBackSliver() {
      const k = W / 1918;
      const rawCoords: [number, number][] = [
        [0.147, 0.243],
        [0.252, 0.169],
        [0.287, 0.277],
        [0.151, 0.258],
      ];

      const pts: [number, number][] = rawCoords.map(([nx, ny]) => [
        (nx - 0.5) * W,
        (0.5 - ny) * H,
      ]);
      if (getSignedArea(pts) < 0) pts.reverse();

      let cx = 0,
        cy = 0;
      for (const p of pts) {
        cx += p[0];
        cy += p[1];
      }
      cx /= pts.length;
      cy /= pts.length;

      const localPts: [number, number][] = pts.map((p) => [p[0] - cx, p[1] - cy]);
      const shape = createRoundedShape(localPts, 8 * k);
      const extrudeSettings = {
        depth: 11 * k,
        bevelEnabled: true,
        bevelThickness: 2.2 * k,
        bevelSize: 2.2 * k,
        bevelSegments: 3,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      if (backMesh) {
        backMesh.geometry.dispose();
        backMesh.geometry = geo;
      } else {
        backMesh = new THREE.Mesh(geo, backShardMaterial);
        backGroup.add(backMesh);
      }

      backGroup.position.set(cx, cy, 0);
      backGroup.rotation.set(0.08, -0.16, 0);

      const backHitArea = container.querySelector("#back-hit-area") as HTMLElement | null;
      if (backHitArea) {
        backHitArea.style.left = `${0.219 * W}px`;
        backHitArea.style.top = `${0.238 * H}px`;
        backHitArea.style.fontSize = `${0.66 * (W / 100)}px`;
      }
    }

    function computeHomographyMatrix(src: number[][], dst: number[][]): number[] {
      const A = [];
      const B = [];
      for (let i = 0; i < 4; i++) {
        const [sx, sy] = src[i];
        const [dx, dy] = dst[i];
        A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dy]);
        B.push(dx);
        A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
        B.push(dy);
      }
      const n = 8;
      for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
          if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        [B[i], B[maxRow]] = [B[maxRow], B[i]];

        for (let k = i + 1; k < n; k++) {
          const c = -A[k][i] / A[i][i];
          for (let j = i; j < n; j++) {
            A[k][j] = i === j ? 0 : A[k][j] + c * A[i][j];
          }
          B[k] += c * B[i];
        }
      }
      const h = new Array(8);
      for (let i = n - 1; i >= 0; i--) {
        let sum = B[i];
        for (let j = i + 1; j < n; j++) {
          sum -= A[i][j] * h[j];
        }
        h[i] = sum / A[i][i];
      }
      return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
    }

    function updateHomography() {
      const homographyBox = container.querySelector("#homography-container") as HTMLElement | null;
      if (!homographyBox) return;

      if (currentState === STATE_SHATTERED || currentState === STATE_SHATTERING) {
        homographyBox.style.opacity = "0";
        return;
      }
      homographyBox.style.opacity = "1";

      const halfW = blockWidth / 2;
      const halfH = blockHeight / 2;
      const corners = [
        new THREE.Vector3(-halfW, halfH, 0),
        new THREE.Vector3(halfW, halfH, 0),
        new THREE.Vector3(halfW, -halfH, 0),
        new THREE.Vector3(-halfW, -halfH, 0),
      ];

      slabGroup.updateMatrixWorld();
      const dstPoints = corners.map((c) => {
        const v = c.clone().applyMatrix4(slabGroup.matrixWorld).project(camera);
        return [(v.x * 0.5 + 0.5) * window.innerWidth, (-v.y * 0.5 + 0.5) * window.innerHeight];
      });

      const srcPoints = [
        [0, 0],
        [blockWidth, 0],
        [blockWidth, blockHeight],
        [0, blockHeight],
      ];

      const H_mat = computeHomographyMatrix(srcPoints, dstPoints);
      homographyBox.style.transform = `matrix3d(${H_mat[0]}, ${H_mat[3]}, 0, ${H_mat[6]}, ${H_mat[1]}, ${H_mat[4]}, 0, ${H_mat[7]}, 0, 0, 1, 0, ${H_mat[2]}, ${H_mat[5]}, 0, 1)`;
    }

    let transitionStartTime = 0;
    const shatterDuration = 0.72;

    function triggerShatter() {
      if (currentState !== STATE_ASSEMBLED) return;
      currentState = STATE_SHATTERING;
      transitionStartTime = performance.now() / 1000;
      prepareShatterTrajectories();

      const homographyBox = container.querySelector("#homography-container") as HTMLElement | null;
      if (homographyBox) homographyBox.style.opacity = "0";

      setTimeout(() => {
        if (!isDisposed && (currentState === STATE_SHATTERING || currentState === STATE_SHATTERED)) {
          setIsDefinitionsActive(true);
        }
      }, 280);
    }

    function triggerBack() {
      if (currentState !== STATE_SHATTERED) return;
      currentState = STATE_REASSEMBLING;
      transitionStartTime = performance.now() / 1000;
      setIsDefinitionsActive(false);
    }

    function easeInCubic(t: number) {
      return t * t * t;
    }

    function easeOutBack(t: number) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    const raycaster = new THREE.Raycaster();

    function updateRaycasting() {
      if (currentState === STATE_SHATTERED) {
        raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y), camera);
        const intersects = raycaster.intersectObject(backMesh || backGroup, true);
        setIsBackHovered(intersects.length > 0);
        return;
      }

      if (currentState !== STATE_ASSEMBLED) {
        for (const s of shards) {
          s.hoverTargetZ = 0;
          s.hoverTargetTipX = 0;
          s.hoverTargetTipY = 0;
        }
        return;
      }

      raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y), camera);
      const meshesToCheck: THREE.Object3D[] = [];
      for (const s of shards) {
        if (s.glassMesh) meshesToCheck.push(s.glassMesh);
      }

      const hits = raycaster.intersectObjects(meshesToCheck, false);
      let pickedShard: ShardPiece | null = null;
      let hitPoint: THREE.Vector3 | null = null;

      if (hits.length > 0) {
        const hitMesh = hits[0].object;
        hitPoint = hits[0].point;
        pickedShard = shards.find((s) => s.glassMesh === hitMesh) || null;
      }

      for (const s of shards) {
        if (s === pickedShard) {
          s.hoverTargetZ = s.isNav ? 32 * S : 50 * S;
          if (hitPoint) {
            const localHit = s.group.worldToLocal(hitPoint.clone());
            s.hoverTargetTipX = Math.max(-0.24, Math.min(0.24, -localHit.y * 0.0035));
            s.hoverTargetTipY = Math.max(-0.24, Math.min(0.24, localHit.x * 0.0035));
          }
        } else {
          s.hoverTargetZ = 0;
          s.hoverTargetTipX = 0;
          s.hoverTargetTipY = 0;
        }
      }
    }

    // Event handlers
    const handleResize = () => {
      if (isDisposed) return;
      updateLayoutDimensions();
      updateBackSliver();
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointer.inside = true;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const panelLeft = (W - panelWidth) / 2;
      const panelTop = (H - blockHeight) / 2 + navHeight + gap;
      pointer.panelNorm.x = (e.clientX - panelLeft) / panelWidth;
      pointer.panelNorm.y = (e.clientY - panelTop) / panelHeight;

      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      pointer.world.copy(camera.position).add(dir.multiplyScalar(dist));
      cursorGlowUniforms.uPointerWorld.value.copy(pointer.world);
    };

    const handlePointerLeave = () => {
      pointer.inside = false;
      pointer.panelNorm.x = 0.5;
      pointer.panelNorm.y = 0.5;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    // DOM actions bindings
    const btnOpenStudio = container.querySelector("#btn-open-studio");
    const linkReadPaper = container.querySelector("#link-read-paper");
    const navSignin = container.querySelector("#nav-signin");
    const backHitArea = container.querySelector("#back-hit-area");

    const onOpenStudioEnter = () => {
      isHoveringOpenStudio = true;
      updateCanvasTextures();
    };
    const onOpenStudioLeave = () => {
      isHoveringOpenStudio = false;
      updateCanvasTextures();
    };
    const onOpenStudioClick = (e: Event) => {
      e.preventDefault();
      if (onOpenStudio) onOpenStudio();
      else if (onSignIn) onSignIn();
    };

    const onReadPaperEnter = () => {
      isHoveringReadPaper = true;
      updateCanvasTextures();
    };
    const onReadPaperLeave = () => {
      isHoveringReadPaper = false;
      updateCanvasTextures();
    };
    const onReadPaperClick = (e: Event) => {
      e.preventDefault();
      triggerShatter();
    };

    const onSigninClick = (e: Event) => {
      e.preventDefault();
      if (onSignIn) onSignIn();
    };

    const onBackClick = () => {
      triggerBack();
    };

    btnOpenStudio?.addEventListener("pointerenter", onOpenStudioEnter);
    btnOpenStudio?.addEventListener("pointerleave", onOpenStudioLeave);
    btnOpenStudio?.addEventListener("click", onOpenStudioClick);

    linkReadPaper?.addEventListener("pointerenter", onReadPaperEnter);
    linkReadPaper?.addEventListener("pointerleave", onReadPaperLeave);
    linkReadPaper?.addEventListener("click", onReadPaperClick);

    navSignin?.addEventListener("click", onSigninClick);
    backHitArea?.addEventListener("click", onBackClick);

    // Initial setup
    updateLayoutDimensions();
    rebuildGeometries(0);
    prepareShatterTrajectories();
    updateBackSliver();

    let currentTiltX = 0.8 * (Math.PI / 180);
    let currentTiltY = -1.2 * (Math.PI / 180);
    const pageLoadStartTime = performance.now() / 1000;
    let isPageLoading = true;
    let lastTime = performance.now();

    for (const shard of shards) {
      shard.applyTransform(1.0);
    }

    function animate(now: number) {
      if (isDisposed) return;
      reqAnimationId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const timeSec = now / 1000;

      if (now - lastRebuildTime > 22 && currentState === STATE_ASSEMBLED) {
        rebuildGeometries(timeSec);
        lastRebuildTime = now;
      }

      let targetTiltX = 0.8 * (Math.PI / 180);
      let targetTiltY = -1.2 * (Math.PI / 180);

      if (pointer.inside && (currentState === STATE_ASSEMBLED || isPageLoading)) {
        targetTiltY = (pointer.x * 7.0 - 1.2) * (Math.PI / 180);
        targetTiltX = (-pointer.y * 5.5 + 0.8) * (Math.PI / 180);
      }

      const expAlpha = 1.0 - Math.exp(-dt / 0.3);
      currentTiltX += (targetTiltX - currentTiltX) * expAlpha;
      currentTiltY += (targetTiltY - currentTiltY) * expAlpha;

      if (currentState === STATE_ASSEMBLED || isPageLoading) {
        slabGroup.rotation.x = currentTiltX;
        slabGroup.rotation.y = currentTiltY;
      } else {
        slabGroup.rotation.x += (0 - slabGroup.rotation.x) * expAlpha;
        slabGroup.rotation.y += (0 - slabGroup.rotation.y) * expAlpha;
      }

      const targetGlow = pointer.inside && currentState === STATE_ASSEMBLED ? 1.0 : 0.0;
      cursorGlowUniforms.uPointerGlow.value +=
        (targetGlow - cursorGlowUniforms.uPointerGlow.value) * Math.min(1, dt * 6);

      updateRaycasting();

      if (isPageLoading) {
        const elapsed = timeSec - pageLoadStartTime;
        let allLanded = true;

        for (const shard of shards) {
          const shardTime = Math.max(0, elapsed - shard.staggerDelay);
          const u = Math.min(1, shardTime / shatterDuration);
          if (u < 1) allLanded = false;
          const progress = 1 - easeOutBack(u);
          shard.applyTransform(Math.max(0, progress));
        }

        if (allLanded) {
          isPageLoading = false;
          currentState = STATE_ASSEMBLED;
        }
      } else if (currentState === STATE_SHATTERING) {
        const elapsed = timeSec - transitionStartTime;
        let allFlown = true;

        for (const shard of shards) {
          const shardTime = Math.max(0, elapsed - shard.staggerDelay);
          const u = Math.min(1, shardTime / shatterDuration);
          if (u < 1) allFlown = false;
          const progress = easeInCubic(u);
          shard.applyTransform(progress);
        }

        if (allFlown) {
          currentState = STATE_SHATTERED;
        }
      } else if (currentState === STATE_REASSEMBLING) {
        const elapsed = timeSec - transitionStartTime;
        let allLanded = true;

        for (const shard of shards) {
          const shardTime = Math.max(0, elapsed - shard.staggerDelay);
          const u = Math.min(1, shardTime / shatterDuration);
          if (u < 1) allLanded = false;
          const progress = 1 - easeOutBack(u);
          shard.applyTransform(Math.max(0, progress));
        }

        if (allLanded) {
          currentState = STATE_ASSEMBLED;
        }
      } else if (currentState === STATE_ASSEMBLED) {
        for (const shard of shards) {
          shard.updateSpring(dt);
          shard.applyTransform(0);
        }
      }

      if (backMesh) {
        if (currentState === STATE_SHATTERED || currentState === STATE_SHATTERING) {
          const elapsed = timeSec - transitionStartTime;
          const sliverScale = Math.min(1, Math.max(0, (elapsed - 0.3) / 0.35));
          backGroup.scale.setScalar(easeOutBack(sliverScale));

          const wobble = Math.sin(timeSec * 6.28) * 0.035;
          const tipAngle = isBackHovered ? 0.14 : 0;
          backGroup.rotation.set(0.08 + tipAngle, -0.16 + wobble, 0);
        } else if (currentState === STATE_REASSEMBLING) {
          const elapsed = timeSec - transitionStartTime;
          const sliverScale = Math.max(0, 1 - elapsed / 0.25);
          backGroup.scale.setScalar(sliverScale);
        } else {
          backGroup.scale.setScalar(0.0001);
        }
      }

      updateHomography();
      renderer.render(scene, camera);
    }

    reqAnimationId = requestAnimationFrame(animate);

    // Component unmount cleanup to prevent memory leaks
    return () => {
      isDisposed = true;
      cancelAnimationFrame(reqAnimationId);

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);

      btnOpenStudio?.removeEventListener("pointerenter", onOpenStudioEnter);
      btnOpenStudio?.removeEventListener("pointerleave", onOpenStudioLeave);
      btnOpenStudio?.removeEventListener("click", onOpenStudioClick);

      linkReadPaper?.removeEventListener("pointerenter", onReadPaperEnter);
      linkReadPaper?.removeEventListener("pointerleave", onReadPaperLeave);
      linkReadPaper?.removeEventListener("click", onReadPaperClick);

      navSignin?.removeEventListener("click", onSigninClick);
      backHitArea?.removeEventListener("click", onBackClick);

      // Dispose three.js resources
      for (const shard of shards) {
        if (shard.glassMesh) {
          shard.glassMesh.geometry.dispose();
          if (shard.glassMesh.material instanceof THREE.Material) {
            shard.glassMesh.material.dispose();
          }
        }
        if (shard.textMesh) {
          shard.textMesh.geometry.dispose();
          if (shard.textMesh.material instanceof THREE.Material) {
            shard.textMesh.material.dispose();
          }
        }
      }

      if (backMesh) {
        backMesh.geometry.dispose();
        if (backMesh.material instanceof THREE.Material) {
          backMesh.material.dispose();
        }
      }

      pageTexture.dispose();
      navTexture.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [onOpenStudio, onSignIn]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#050507] text-[#ffffff] font-['Inter',sans-serif]"
    >
      {/* Return to Dashboard / Close button when in authenticated mode */}
      {showBackToDashboard && onClose && (
        <button
          onClick={onClose}
          className="fixed top-5 left-5 z-50 flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-[12px] font-medium text-white backdrop-blur-md transition shadow-lg active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Homography Interactive DOM Overlay */}
      <div
        id="homography-container"
        className="fixed top-0 left-0 z-20 pointer-events-none origin-top-left transition-opacity duration-300"
      >
        <nav
          id="dom-nav"
          className="absolute top-0 left-0 w-full flex items-center justify-between pointer-events-none"
        >
          <div className="flex items-center gap-2.5 text-white font-semibold cursor-pointer pointer-events-auto">
            <span
              id="nav-mark"
              className="inline-block border-[1.5px] border-white/70 rounded-[3px] bg-white/[0.08]"
            />
            <span id="nav-brand-text">Facet</span>
          </div>

          <div
            id="nav-links"
            className="flex items-center gap-2 text-white/60 font-[450] pointer-events-auto"
          >
            <span className="hover:text-white cursor-pointer transition">Studio</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer transition">Materials</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer transition">Pricing</span>
          </div>

          <button
            id="nav-signin"
            className="text-white/80 hover:text-white font-medium transition cursor-pointer pointer-events-auto bg-transparent border-0"
          >
            Sign in
          </button>
        </nav>

        <div id="dom-panel" className="absolute left-0 w-full pointer-events-none">
          <div
            id="dom-eyebrow"
            className="absolute text-[#A78BFA] font-medium tracking-[0.2em] uppercase select-text"
          >
            ACADEMIC PRODUCTIVITY OS · 5 CORE COURSES
          </div>

          <div
            id="dom-headline"
            className="absolute font-semibold tracking-[-0.045em] leading-[0.97] bg-gradient-to-b from-[#ffffff] to-[#c4b5fd] bg-clip-text text-transparent select-text"
          >
            Master your
            <br />
            semester in glass.
          </div>

          <div
            id="dom-sub"
            className="absolute text-white/65 font-normal leading-[1.5] select-text max-w-xl"
          >
            Distraction-free preparation for your end-semesters. Track all 24 syllabus units with real-time countdowns.
          </div>

          <div id="dom-actions" className="absolute flex items-center gap-6 pointer-events-auto">
            <button
              id="btn-open-studio"
              onClick={onOpenStudio || onSignIn}
              className="inline-flex items-center justify-center rounded-[8px] bg-white/[0.12] hover:!bg-[#10B96F] hover:!text-[#050507] hover:!border-[#10B96F] hover:!font-semibold hover:shadow-[0_0_28px_rgba(16,185,111,0.45)] text-white/95 border border-white/30 backdrop-blur-md transition-all active:scale-95"
            >
              Sign In
            </button>

            <button
              id="link-read-paper"
              className="group relative inline-flex items-center gap-1 text-[#A78BFA] hover:text-white font-medium bg-transparent border-0 cursor-pointer transition"
            >
              <span>Explore syllabus →</span>
              <span className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-[#A78BFA] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
          </div>

          <div
            id="dom-footer-left"
            className="absolute text-white/35 font-normal select-text"
          >
            © SEMTRACK Academic OS
          </div>

          <div
            id="dom-footer-right"
            className="absolute text-white/35 font-normal select-text text-right"
          >
            Protected by Supabase RLS
          </div>
        </div>
      </div>

      {/* Definitions Second View */}
      <div
        id="definitions-view"
        className={`fixed inset-0 z-30 transition-opacity duration-400 ${
          isDefinitionsActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute left-[30vw] w-[38vw] top-[28vh] max-w-2xl bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-smoked-deep">
          <h2 className="font-semibold text-[1.4vw] tracking-[-0.022em] text-white mb-[1.5vw] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10B96F] shadow-emerald-glow" />
            5 Core Engineering Courses · 24 Units
          </h2>

          <div className="flex flex-col gap-[0.9vw] text-[0.8vw] leading-[1.6] text-white/75">
            <p>
              <strong className="text-white font-semibold">TOC (CS601)</strong> — Automata theory, regular expressions, context-free grammars, Turing machines, and decidability (5 units).
            </p>
            <p>
              <strong className="text-white font-semibold">AI (CS602)</strong> — Informed search algorithms, adversarial games, Bayesian logic, and neural models (5 units).
            </p>
            <p>
              <strong className="text-white font-semibold">Computer Networks (CS603)</strong> — OSI architecture, routing protocols, TCP congestion flow, and socket programming (5 units).
            </p>
            <p>
              <strong className="text-white font-semibold">Cloud Computing (CS604)</strong> — Hypervisors, distributed clusters, S3/EC2 architecture, and DevOps workflows (5 units).
            </p>
            <p>
              <strong className="text-white font-semibold">IPR (HS601)</strong> — Patents, copyright protection, trademark filing, and engineering intellectual ethics (4 units).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-[#A78BFA] font-mono">Target: 9.0+ CGPA</span>
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-[#10B96F] text-black font-bold text-xs hover:bg-[#34D399] transition"
            >
              Start Studying Now
            </button>
          </div>
        </div>
      </div>

      {/* "← Back" DOM click target */}
      <button
        id="back-hit-area"
        className={`fixed z-40 -translate-x-1/2 -translate-y-1/2 cursor-pointer font-medium text-white transition-all duration-200 select-none bg-transparent border-0 ${
          isDefinitionsActive ? "flex" : "hidden"
        } ${isBackHovered ? "!text-[#b9abff] scale-105" : ""}`}
      >
        ← Back
      </button>

      {/* Accessible Static Fallback if WebGL is unavailable */}
      {!isSupported && (
        <div className="fixed inset-0 z-50 bg-[#050507] p-8 overflow-y-auto flex items-center justify-center">
          <div className="max-w-2xl w-full bg-[#131318] border border-white/15 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
              <span className="font-bold text-lg text-white">SEMTRACK</span>
              <span className="text-sm text-white/60">Dashboard · Subjects · Timetable</span>
              <button onClick={onSignIn} className="text-sm text-[#A78BFA] font-medium">
                Sign in
              </button>
            </div>
            <div className="text-xs text-[#A78BFA] tracking-widest uppercase mb-3">
              ACADEMIC PRODUCTIVITY OS
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white">Master your semester.</h1>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Distraction-free preparation for your end-semesters. 24 syllabus units with real-time countdowns.
            </p>
            <div className="flex gap-4 items-center">
              <button
                onClick={onOpenStudio || onSignIn}
                className="px-5 py-2.5 rounded-lg bg-[#10B96F] text-black font-semibold text-sm"
              >
                Sign In
              </button>
              <button onClick={onSignIn} className="text-sm text-white/80">View Courses →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassShardHero;
