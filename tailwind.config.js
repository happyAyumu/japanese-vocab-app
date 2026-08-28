/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        washi: {
          bg: "#faf7f2",
          bgDark: "#1c1a17",
          card: "#ffffff",
          cardDark: "#2a2723",
          border: "#e6ddd0",
          borderDark: "#3c3730",
        },
        sumi: {
          ink: "#2b2620",
          inkDark: "#eee8de",
          sub: "#7a7266",
          subDark: "#a69c8c",
        },
        vermillion: {
          DEFAULT: "#a8562f",
          soft: "#f1e3d6",
          softDark: "#3a2c22",
        },
        good: "#4c7a4f",
        weak: "#b5502e",
      },
      fontFamily: {
        sans: [
          '"Hiragino Sans"',
          '"Yu Gothic"',
          '"Noto Sans JP"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
