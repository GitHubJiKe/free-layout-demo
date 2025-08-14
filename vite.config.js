import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    base: process.env.NODE_ENV === 'production' ? '/free-layout-demo/' : '/',
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue']
                }
            }
        }
    },
    optimizeDeps: {
        exclude: ['crypto']
    },
    define: {
        global: 'globalThis'
    }
});
