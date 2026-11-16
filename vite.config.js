import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // ADR 10 (Rev. 2): el sitio vive en la raíz del dominio de Vercel (ya no se usa GitHub Pages).
  base: "/",
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