import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    ssr: {
      external: ["cloudflare:workers"],
    },
    build: {
      rollupOptions: {
        external: ["cloudflare:workers"],
      },
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
