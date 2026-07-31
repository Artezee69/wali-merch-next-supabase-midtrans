import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // --- Cinematic additions ---
        "morph-glow": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)", boxShadow: "0 0 20px rgba(215,255,83,0.1)" },
          "25%": { transform: "rotate(90deg) scale(1.05)" },
          "50%": { transform: "rotate(180deg) scale(1)", boxShadow: "0 0 40px rgba(215,255,83,0.2)" },
          "75%": { transform: "rotate(270deg) scale(1.05)" },
          "100%": { transform: "rotate(360deg) scale(1)", boxShadow: "0 0 20px rgba(215,255,83,0.1)" },
        },
        "shimmer-3d": {
          "0%": { backgroundPosition: "-200% -200%" },
          "100%": { backgroundPosition: "200% 200%" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(16px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(16px) rotate(-360deg)" },
        },
        "wave-line": {
          "0%, 100%": { strokeDashoffset: "0" },
          "50%": { strokeDashoffset: "12" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        "spotlight-sweep": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "0.6" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "holo-sweep": {
          "0%": { backgroundPosition: "-200% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "counter-reveal": {
          "0%": { clipPath: "circle(0% at 50% 50%)" },
          "100%": { clipPath: "circle(100% at 50% 50%)" },
        },
        "ring-pulse-expand": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        // --- Existing ---
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-right": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          "0%": { opacity: "0", backdropFilter: "blur(0)", transform: "scale(0.98)" },
          "100%": { opacity: "1", backdropFilter: "blur(12px)", transform: "scale(1)" },
        },
        "aurora-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(8%, -6%) scale(1.1)" },
          "66%": { transform: "translate(-6%, 4%) scale(0.95)" },
        },
        "aurora-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-10%, 6%) scale(1.05)" },
          "66%": { transform: "translate(6%, -4%) scale(0.95)" },
        },
        "aurora-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(4%, 8%) scale(1.08)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "reveal": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-out": {
          "0%": { opacity: "1", transform: "translateX(0)", maxHeight: "300px" },
          "100%": { opacity: "0", transform: "translateX(100%)", maxHeight: "0", padding: "0", margin: "0" },
        },
      },
      animation: {
        // --- Cinematic additions ---
        "morph-glow": "morph-glow 12s ease-in-out infinite",
        "shimmer-3d": "shimmer-3d 4s linear infinite",
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        orbit: "orbit 8s linear infinite",
        "wave-line": "wave-line 3s ease-in-out infinite",
        "draw-line": "draw-line 2s ease-out forwards",
        "spotlight-sweep": "spotlight-sweep 3s ease-in-out infinite",
        "holo-sweep": "holo-sweep 3s linear infinite",
        "counter-reveal": "counter-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ring-pulse-expand": "ring-pulse-expand 3s ease-out infinite",
        // --- Existing ---
        marquee: "marquee 30s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blur-in": "blur-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "aurora-1": "aurora-1 18s ease-in-out infinite",
        "aurora-2": "aurora-2 22s ease-in-out infinite",
        "aurora-3": "aurora-3 26s ease-in-out infinite",
        "spin-slow": "spin-slow 30s linear infinite",
        "spin-slower": "spin-slow 60s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "float-y": "float-y 6s ease-in-out infinite",
        reveal: "reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gradient-x": "gradient-x 8s ease infinite",
        "slide-in": "slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-out": "slide-out 0.4s cubic-bezier(0.4, 0, 1, 1) forwards",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      fontFamily: {
        display: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
