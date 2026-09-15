import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
    ],
    server: {
        watch: {
            // Evita bloqueos EBUSY en Windows por fotos y caché de VS
            ignored: ['**/.vs/**', '**/public/imagenes/**'],
        },
    },
})