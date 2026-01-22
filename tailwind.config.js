/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        pink: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9f1239",
          900: "#831843",
        },
        terracotta: {
          50: "#fef5e7",
          100: "#fde8d1",
          200: "#fbd0a3",
          300: "#f9b175",
          400: "#f79247",
          500: "#d2691e",
          600: "#b85a1a",
          700: "#9e4b16",
          800: "#843c12",
          900: "#6a2d0e",
        },
        warm: {
          beige: "#F5E6D3",
          cream: "#FFF8DC",
          white: "#FFFBF5",
          gray: "#F8F6F0",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
        "gradient-primary-hover":
          "linear-gradient(135deg, #ea580c 0%, #db2777 100%)",
        "gradient-subtle":
          "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.08)",
        "glass-lg":
          "0 10px 24px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slideInUp 0.4s cubic-bezier(0.19, 1, 0.22, 1)",
        "slide-down": "slideInDown 0.4s cubic-bezier(0.19, 1, 0.22, 1)",
        "fade-in": "fadeIn 0.25s ease-out",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInDown: {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "expo-out": "cubic-bezier(0.19, 1, 0.22, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};
