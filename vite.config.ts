import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // Custom SSR entry with catastrophic-error HTML wrapper (src/server.ts).
      server: { entry: "server" },
    }),
    // Nitro auto-detects Vercel on deploy; local builds use node-server.
    nitro(),
    viteReact(),
  ],
});
