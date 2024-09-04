import path from "path"
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
	server: {
		proxy: {
			// Proxy any request starting with /api to the target server
			"/api": {
				target: "http://localhost:5041", // Your API server
				changeOrigin: true, // Needed for virtual hosted sites
				rewrite: (path) => path.replace(/^\/api/, ""), // Remove /api prefix
			},
			"/socket.io": {
				target: "ws://localhost:5041",
				ws: true,
				rewriteWsOrigin: true,
			},
		},
	},
});
