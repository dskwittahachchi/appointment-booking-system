import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:5050",
    },
  },
});
