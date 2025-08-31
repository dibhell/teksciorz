import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' działa na GitHub Pages bez konieczności wpisywania nazwy repozytorium
export default defineConfig({
  plugins: [react()],
  base: "./",
});
