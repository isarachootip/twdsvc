/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C8102E',
          'red-dark': '#9C0C22',
          'red-tint': '#FBE7E9',
          blue: '#185FA5',
          'blue-tint': '#E6F1FB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F3EEE6',
          bg: '#FAF7F2',
        },
        border: {
          DEFAULT: '#E4DED2',
          strong: '#D2C9B8',
        },
        text: {
          DEFAULT: '#2B2723',
          2: '#6B6459',
          mute: '#9A9384',
        },
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
