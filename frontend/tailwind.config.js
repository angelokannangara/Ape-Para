/** Palette drawn from the Sri Lankan flag: maroon, saffron, green, orange. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { 50: '#fdf2f5', 100: '#fbe6ec', 600: '#a3194a', 700: '#8d153a', 800: '#721130', 900: '#560d25' },
        saffron: { 50: '#fff9e6', 100: '#fff0bf', 300: '#ffd35c', 400: '#ffbe29', 500: '#f0a800' },
        lanka: { 50: '#eef7f6', 100: '#d3ebe8', 600: '#00746d', 700: '#00534e', 800: '#003f3b' },
        cream: { 50: '#fffdf8', 100: '#fbf6ea', 200: '#f3ead4' },
        ink: { 700: '#3d3330', 900: '#241c1a' },
      },
      fontFamily: {
        sans: ['"Noto Sans Sinhala"', '"Iskoola Pota"', 'Nirmala UI', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
