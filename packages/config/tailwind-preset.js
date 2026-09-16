/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: '#C8102E',
          dark: '#9C0C22',
          tint: '#FBE7E9',
        },
        brand: {
          red: '#C8102E',
          'red-dark': '#9C0C22',
          'red-tint': '#FBE7E9',
          blue: '#185FA5',
          'blue-tint': '#E6F1FB',
        },
        bg: '#FAF7F2',
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
        green: {
          DEFAULT: '#1D9E75',
          tint: '#E1F5EE',
        },
        amber: {
          DEFAULT: '#BA7517',
          tint: '#FAEEDA',
        },
        blue: {
          DEFAULT: '#185FA5',
          tint: '#E6F1FB',
        },
        coral: {
          DEFAULT: '#D85A30',
          tint: '#FAECE7',
        },
        teal: {
          DEFAULT: '#0F6E56',
        },
        navy: '#1B2430',
        gold: '#B7862E',
      },
      borderRadius: {
        card: '12px',
        input: '6px',
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
