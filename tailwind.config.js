/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {

      colors: {
        background: "#f8f5f2", 
        primary: "#ffc272",   
        primaryDark: "#814e18",
        secondary: "#fff",
        textPrimary: "#1a1a1a",
        accent: "#9c8f7a",
      },

    },
  },
  plugins: [],
};
