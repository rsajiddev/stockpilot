import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spGreen: {
          50: '#EEF8F2',
          100: '#D5EEDF',
          200: '#AEDDC1',
          400: '#6CC08B',
          500: '#52B073',
          600: '#3E9A60',
          700: '#2F7D4E',
          800: '#266340',
          900: '#1D4B31',
        },
      },
    },
  },
  plugins: [],
};
export default config;
