import tailwindScrollbar from "tailwind-scrollbar";
import scrollbarHide from "tailwind-scrollbar-hide";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        // rgb(1, 149, 50) is the brand #019532.
        primary: "none",
        // Soft, layered elevation for cards — subtle at rest, richer on hover.
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px -2px rgba(16, 24, 40, 0.08)",
        "card-hover": "0 2px 4px rgba(16, 24, 40, 0.05), 0 12px 28px -4px rgba(1, 149, 50, 0.18)",
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
        // Brand primary — vivid emerald (#019532). `primary` and `primary-600`
        // are both the exact brand colour, so anything reaching for either gets
        // the hex on the brand sheet.
        //
        // This is the ONLY chromatic family in the app. Everything that used to
        // carry its own hue — danger red, status amber, log-level blue — points
        // here instead; `secondary` holds the neutrals and is not a colour.
        "web-primary": "#019532",
        primary: {
          DEFAULT: "#019532",
          50: "#edfdf2",
          100: "#d3f8df",
          200: "#a8f0c0",
          300: "#65e28e",
          400: "#21ca59",
          500: "#09ae40",
          600: "#019532",
          700: "#017527",
          800: "#015b1f",
          900: "#014117",
          950: "#01230c",
        },

        /**
         * The only non-brand colour in the system, and it is not decoration.
         *
         * Reserved for destroying something or reporting that something broke —
         * Logout, Delete, a failed save. Matches antd's `colorError` in
         * main.tsx and `--red` in styles/index.css, so the three agree.
         * Anything that is not destructive uses `primary`.
         */
        danger: {
          DEFAULT: "#d41142",
          600: "#d41142",
          700: "#b00d37",
        },

        // Neutral surface shades — kept as dark grays for UI backgrounds/text.
        // Not a colour: this is the text/border/surface ramp.
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

        // Gradient partner — the same hue one step lighter, so a gradient still
        // has somewhere to travel without introducing a second colour.
        // Use as `bg-accent`, `text-accent`, `border-accent`, etc.
        accent: {
          DEFAULT: "#09ae40",
          50: "#edfdf2",
          100: "#d3f8df",
          200: "#a8f0c0",
          300: "#65e28e",
          400: "#21ca59",
          500: "#09ae40",
          600: "#019532",
          700: "#017527",
          800: "#015b1f",
          900: "#014117",
          950: "#01230c",
        },
      },
    },
  },
  plugins: [tailwindScrollbar, scrollbarHide],
};
