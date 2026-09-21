import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tabby: {
          dark: "#1e242b",
          darker: "#161b22",
          nav: "#24292e",
          accent: "#3b82f6",
          sidebar: "#f8f9fa",
          border: "#e1e4e8",
          muted: "#6a737d",
          success: "#28a745",
          danger: "#d73a49",
          warning: "#ffd33d",
          info: "#0366d6",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
