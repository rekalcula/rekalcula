import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#1a1915',
          'bg-secondary': '#2d2a24',
          card: '#3d3a34',
          text: '#ececec',
          'text-secondary': '#a8a8a8',
          accent: '#d97757',
          'accent-hover': '#e88c6e',
          border: '#4a4740',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;