/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050507",
        smoked: {
          900: "#050507",
          800: "#0D0D11",
          700: "#131318",
          600: "#17171C",
          500: "#22222A",
          border: "rgba(255, 255, 255, 0.08)",
          "border-hover": "rgba(255, 255, 255, 0.16)",
          specular: "rgba(255, 255, 255, 0.20)",
        },
        facet: {
          lavender: "#A78BFA",
          violet: "#C084FC",
          emerald: "#10B96F",
          mint: "#34D399",
          dark: "#050507",
          card: "rgba(23, 23, 28, 0.72)",
        },
        brand: {
          DEFAULT: "#10B96F",
          hover: "#0E7E4E",
          light: "#34D399",
          glow: "rgba(16, 185, 111, 0.35)",
          subtle: "rgba(16, 185, 111, 0.08)",
          border: "rgba(16, 185, 111, 0.25)",
          contrast: "#FAFCFB",
        },
        glass: {
          surface: "rgba(23, 23, 28, 0.72)",
          "surface-hover": "rgba(30, 30, 37, 0.85)",
          border: "rgba(255, 255, 255, 0.09)",
          "border-bright": "rgba(255, 255, 255, 0.18)",
          highlight: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Source Code Pro'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "smoked-glass": "0 12px 40px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
        "smoked-hover": "0 20px 50px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 24px -6px rgba(167, 139, 250, 0.15)",
        "smoked-deep": "0 24px 80px -12px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
        "facet-glow": "0 0 24px -4px rgba(167, 139, 250, 0.35), 0 0 10px -2px rgba(16, 185, 111, 0.25)",
        "emerald-glow": "0 0 24px -4px rgba(16, 185, 111, 0.40), 0 0 8px -2px rgba(16, 185, 111, 0.25)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      keyframes: {
        "check-pop": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.98)" },
        },
      },
      animation: {
        "check-pop": "check-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "rise-in": "rise-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-in": "float-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
