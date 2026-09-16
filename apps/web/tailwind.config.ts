import type { Config } from 'tailwindcss';
import tailwindPreset from '@svcm/config/tailwind-preset.js';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [tailwindPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
