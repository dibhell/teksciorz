import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path"; // ważne

export default defineConfig({
  plugins: [react()],
  base: "/teksciorz/", // albo nazwa Twojego repo
  resolve: {
    alias: { "@": resolve(__dirname, "src") }, // <-- alias @ -> src
  },
});
