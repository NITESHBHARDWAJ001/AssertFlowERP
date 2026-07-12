import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary accent - "inspection stamp" teal. Named `brand` because
        // every existing component already references brand-*; changing the
        // ramp here re-themes the whole app without touching those files.
        brand: {
          50: "#EEF6F5",
          100: "#D6EBE9",
          200: "#AFD8D4",
          300: "#82C0BA",
          400: "#57A59D",
          500: "#35857E",
          600: "#1F6F78",
          700: "#175359",
          800: "#123F44",
          900: "#0E2F33",
        },
        // Secondary accent - "warehouse tag" brass. Used sparingly (CTAs,
        // highlights on the landing page), never as a competing primary.
        tag: {
          50: "#FBF3E9",
          100: "#F6E4CC",
          200: "#EDC896",
          300: "#E2AA60",
          400: "#D6913F",
          500: "#CD832F",
          600: "#C97A2B",
          700: "#A5611F",
          800: "#7D4A18",
          900: "#5C3712",
        },
        // Flat neutrals for bespoke surfaces (landing page, canvas
        // background) - warm-paper in light mode, navy-ink in dark.
        paper: "#FBF8F2",
        night: "#0F141D",
        ink: "#16233A",
        mist: "#E7E0D2",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["\"IBM Plex Sans\"", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        // Blueprint dot-grid - ambient texture, not decoration for its own
        // sake; echoes the schematic/manifest world the product lives in.
        "dot-grid": "radial-gradient(currentColor 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
