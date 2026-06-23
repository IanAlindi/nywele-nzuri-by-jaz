/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        ink: "#141210",
        black2: "#0d0b09",
        cream: "#faf7f2",
        cream2: "#f4ecdd",
        line: "#e9dec9",
        muted: "#8a8278",
        gold: {
          DEFAULT: "#bb9540",
          light: "#d8bd7e",
          soft: "#e7cf91",
          deep: "#9d7c2f",
        },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Jost'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.32em",
        wider2: "0.2em",
      },
      maxWidth: {
        container: "1240px",
      },
      boxShadow: {
        luxe: "0 30px 70px -30px rgba(40, 30, 10, 0.45)",
        gold: "0 12px 30px -10px rgba(187, 149, 64, 0.45)",
      },
      transitionTimingFunction: {
        lux: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        bob: "bob 2s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};
