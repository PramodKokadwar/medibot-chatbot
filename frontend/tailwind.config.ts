import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          blue: "#1565C0",
          teal: "#00897B",
          lightblue: "#E3F2FD",
          lightgreen: "#E8F5E9",
          lightteal: "#E0F2F1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
