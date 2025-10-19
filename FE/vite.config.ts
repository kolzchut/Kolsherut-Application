import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

const buildId = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'esnext',
        manifest: true,
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name]-${buildId}-[hash].js`,
                chunkFileNames: `assets/[name]-${buildId}-[hash].js`,
                assetFileNames: `assets/[name]-${buildId}-[hash][extname]`
            }
        }
    }
})
