import { defineConfig } from "vite";

export default defineConfig({
  // no proxy needed when you use an absolute URL
  server: {
    // proxy: { … }   ← remove this
  },
});
