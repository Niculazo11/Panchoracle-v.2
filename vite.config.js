import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/ instead of the domain root.
  base: process.env.VERCEL ? "/" : "/Panchoracle/",
  plugins: [react()],

  // Treat .js files inside src/ as JSX, so they don't have to be renamed to .jsx.
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },

  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});