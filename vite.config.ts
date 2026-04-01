import * as path from 'node:path'
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import zip from 'vite-plugin-zip-pack'
import manifest from './src/manifest'
import { name, version } from './package.json'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      emptyOutDir: true,
      outDir: 'build',
      rollupOptions: {
        input: {
          welcome: 'welcome.html',
        },
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
    plugins: [
      crx({ manifest }),
      zip({
        inDir: 'build',
        outDir: 'release',
        outFileName: `crx-${name}-${version}.zip`,
      }),
    ],
  }
})
