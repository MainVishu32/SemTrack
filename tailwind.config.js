/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080A0E",
        smoked: {
          900: "#080A0E",
          800: "#11151C",
          700: "#171C24",
          600: "#171C24",
          500: "#29313C",
          border: "rgba(255, 255, 255, 0.09)",
          "border-hover": "rgba(255, 255, 255, 0.14)",
          specular: "rgba(255, 255, 255, 0.16)",
        },
        facet: {
          emerald: "#16C784",
          dark: "#080A0E",
          card: "#11151C",
        },
        brand: {
          DEFAULT: "#16C784",
          hover: "#16C784",
          light: "#16C784",
          glow: "rgba(22, 199, 132, 0.16)",
          subtle: "rgba(22, 199, 132, 0.08)",
          border: "rgba(22, 199, 132, 0.24)",
          contrast: "#080A0E",
        },
        glass: {
          surface: "#11151C",
          "surface-hover": "#171C24",
          border: "rgba(255, 255, 255, 0.09)",
          "border-bright": "rgba(255, 255, 255, 0.14)",
          highlight: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Source Code Pro'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "smoked-glass": "0 12px 32px rgba(0, 0, 0, 0.20)",
        "smoked-hover": "0 16px 36px rgba(0, 0, 0, 0.24)",
        "smoked-deep": "0 24px 64px rgba(0, 0, 0, 0.42)",
        "facet-glow": "0 0 14px rgba(22, 199, 132, 0.12)",
        "emerald-glow": "0 0 14px rgba(22, 199, 132, 0.12)",
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
