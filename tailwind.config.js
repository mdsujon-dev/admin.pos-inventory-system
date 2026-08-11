import tailwindScrollbar from "tailwind-scrollbar";
import scrollbarHide from "tailwind-scrollbar-hide";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        primary: "0 4px 6px -1px rgba(40, 95, 20, 0.5)",
        // Soft, layered elevation for cards — subtle at rest, richer on hover.
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px -2px rgba(16, 24, 40, 0.08)",
        "card-hover": "0 2px 4px rgba(16, 24, 40, 0.05), 0 12px 28px -4px rgba(40, 95, 20, 0.18)",
      },
      maxWidth: {
        "8xl": "96rem", // 1536px
        "9xl": "104rem", // 1664px
        "10xl": "112rem", // 1792px
      },
      animation: {
        marquee: "marquee 80s linear infinite",
        dotBounce: "dotBounce 1.2s infinite",
        "marquee-reverse": "marquee 130s linear infinite reverse",
        fadeIn: "fadeIn 0.3s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "spin-slow": "spin 22s linear infinite",
        slideDown: "slideDown 0.3s ease-out forwards",
        slideUp: "slideUp 0.3s ease-in forwards",
      },
      keyframes: {
        dotBounce: {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(6px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "scaleY(0.95)" },
          "100%": { opacity: "1", transform: "scaleY(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },

      },
      fontFamily: {
        // Single typeface for the whole admin — everything inherits this.
        sans: ['"Outfit"', "sans-serif"],
        serif: ['"Outfit"', "sans-serif"],
      },
      display: ["group-hover"],
      colors: {
        // Brand primary — deep forest green (#285F14). Scale is built around it,
        // so `primary` / `primary-600` are both the exact brand colour.
        "web-primary": "#285F14",
        primary: {
          DEFAULT: "#285F14",
          50: "#f2fbef",
          100: "#d8f2cf",
          200: "#b5e5a4",
          300: "#8ad270",
          400: "#5bbe37",
          500: "#3c8820",
          600: "#285F14",
          700: "#225010",
          800: "#1a400d",
          900: "#15330a",
          950: "#0c1e05",
        },

        // Neutral surface shades — kept as dark grays for UI backgrounds/text.
        secondary: {
          DEFAULT: "#1a1a1a",
          50: "#f5f5f5",
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#4d4d4d",
          700: "#333333",
          800: "#1a1a1a",
          900: "#101010",
        },

        // Secondary brand color — lighter green gradient partner (#3c8820).
        // Use as `bg-accent`, `text-accent`, `border-accent`, etc.
        accent: {
          DEFAULT: "#3c8820",
          50: "#f2fbef",
          100: "#d8f2cf",
          200: "#b5e5a4",
          300: "#8ad270",
          400: "#5bbe37",
          500: "#3c8820",
          600: "#285F14",
          700: "#225010",
          800: "#1a400d",
          900: "#15330a",
          950: "#0c1e05",
        },
      },
    },
  },
  plugins: [tailwindScrollbar, scrollbarHide],
};
