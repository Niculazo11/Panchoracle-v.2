import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/ instead of the domain root.
  base: "/Panchoracle-v.2/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@data": path.resolve(__dirname, "./src/data"),
    },
  },
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});
