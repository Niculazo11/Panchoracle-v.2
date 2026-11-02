import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/ instead of the domain root.
  base: process.env.VERCEL ? "/" : "/Panchoracle/",
  plugins: [react()],
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});
