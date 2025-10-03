import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/e-shop/",   // 👈 nécessaire pour un déploiement dans un sous-dossier
  plugins: [react()],
});
