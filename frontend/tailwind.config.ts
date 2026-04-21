import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        carbon: "#090909",
        ember: "#DC2626",
        merlot: "#991B1B",
        mist: "#E5E7EB"
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        body: ["var(--font-space)", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(220, 38, 38, 0.28)"
      },
      backgroundImage: {
        "hero-lines": "radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.2), transparent 35%), radial-gradient(circle at 90% 20%, rgba(153, 27, 27, 0.25), transparent 40%), linear-gradient(135deg, #0b0203 0%, #000000 55%, #130607 100%)"
      }
    }
  },
  plugins: []
};

export default config;
