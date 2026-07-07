import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Production build is served by Django from /static/, so asset URLs
  // need that prefix. The dev server keeps serving from the root so the
  // Vite proxy setup below still works unchanged.
  base: command === "build" ? "/static/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
}));
