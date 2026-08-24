/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: "#FDFBF7",
        surface: "#FFFFFF",
        muted: "#F4F1EA",
        primary: "#1A362B",
        secondary: "#C6A87C",
        ink: "#0A0A0A",
        subtle: "#5C5C5C",
        line: "#EAE5D9",
        success: "#2C4C3B",
        warning: "#C6A87C",
        danger: "#8C2A2A",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.04)",
        lifted: "0 20px 40px rgba(26,54,43,0.10)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
