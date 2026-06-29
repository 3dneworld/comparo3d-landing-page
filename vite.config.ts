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
        // Fase B LCP: solo separamos react/react-dom/router (sí se importan estáticos
        // desde el entry → preload legítimo + mejor caching).
        //
        // OJO: NO meter framer-motion ni recharts acá. Al asignarlos a un manualChunk
        // nombrado, Vite los mete en el grafo de `modulepreload` del index.html y se
        // cargan eager (mata el LCP). Dejándolos fuera, Vite los split como chunks
        // async compartidos que cargan recién cuando monta la primera sección lazy que
        // los usa (después del FCP) — que es justo lo que queremos.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
}));
