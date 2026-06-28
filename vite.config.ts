import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Fase B LCP: separar librerías pesadas en chunks propios para mejor caching
        // y evitar que una sola lib bloquee el chunk principal. `recharts` solo lo
        // usa el dashboard (lazy) → su chunk no entra en el initial load de la home.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
}));
