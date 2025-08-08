import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
    host: '0.0.0.0', // ← Permite conexiones externas
    port: 5173,
    allowedHosts: [
      'localhost',
      '.trycloudflare.com', // Permite todos los subdominios de trycloudflare.com
      'means-creations-spice-runtime.trycloudflare.com' // Tu host específico
    ],
    watch: {
      usePolling: true, // Para WSL/Docker
    },
  },
});
