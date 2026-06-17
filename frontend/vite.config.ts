import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react({ jsxRuntime: "classic" }), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },

  // strip console.* and debugger statements from production builds
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },

  server: {
    hmr: false,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/models": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
}));
