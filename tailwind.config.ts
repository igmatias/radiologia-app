import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
    "./src/**/*.{ts,tsx}", // Esto le dice que busque en TODO lo que esté dentro de src
	"./app/**/*.{ts,tsx}",
	"./components/**/*.{ts,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			border: "hsl(var(--border))",
  			input: "hsl(var(--input))",
  			ring: "hsl(var(--ring))",
  			background: "hsl(var(--background))",
  			foreground: "hsl(var(--foreground))",
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;