import { EventEmitter } from "node:events";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backend = "http://localhost:8090";
const darkKnightApi = "http://localhost:8080";

function apiProxy() {
  return {
    target: backend,
    changeOrigin: true,
    configure: (proxy: EventEmitter) => {
      proxy.on("error", () => {
        console.log(
          `\n[vite] API proxy: nothing listening at ${backend}. Start Spring Boot (./gradlew bootRun or IDE) — server.port=8090.\n`,
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": apiProxy(),
      "/dark-knight": {
        target: darkKnightApi,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dark-knight/, "") || "/",
        configure: (proxy: EventEmitter) => {
          proxy.on("error", () => {
            console.log(
              `\n[vite] Dark Knight proxy: nothing listening at ${darkKnightApi}. Run Dark Knight (./gradlew run) or set VITE_DARKKNIGHT_API_BASE.\n`,
            );
          });
        },
      },
      "/ws": {
        target: "ws://localhost:8090",
        ws: true,
        configure: (proxy: EventEmitter) => {
          proxy.on("error", () => {
            console.log(`\n[vite] WebSocket proxy: backend not running at ${backend}\n`);
          });
        },
      },
    },
  },
  preview: {
    port: 5174,
    proxy: {
      "/api": apiProxy(),
      "/dark-knight": {
        target: darkKnightApi,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dark-knight/, "") || "/",
        configure: (proxy: EventEmitter) => {
          proxy.on("error", () => {
            console.log(
              `\n[vite] Dark Knight proxy: nothing listening at ${darkKnightApi}. Run Dark Knight (./gradlew run) or set VITE_DARKKNIGHT_API_BASE.\n`,
            );
          });
        },
      },
      "/ws": {
        target: "ws://localhost:8090",
        ws: true,
      },
    },
  },
});
