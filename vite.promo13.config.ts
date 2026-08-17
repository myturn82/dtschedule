import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL':      JSON.stringify('https://promo-placeholder.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('promo-placeholder-anon-key'),
  },
  build: {
    outDir: 'dist-promo/reel-blog13',
    emptyOutDir: true,
    rollupOptions: { input: resolve(__dirname, 'promo-reel-blog13.html') },
    assetsInlineLimit: 100000000, cssCodeSplit: false, sourcemap: false, reportCompressedSize: false,
  },
})
