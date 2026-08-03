import {defineConfig} from 'vite'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const studioDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(studioDir, '..')

export default defineConfig({
  resolve: {
    alias: {
      react: path.join(rootDir, 'node_modules/react'),
      'react-dom': path.join(rootDir, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: {
      ignored: [
        path.join(rootDir, 'node_modules/**'),
        path.join(studioDir, 'node_modules/**'),
        path.join(studioDir, '.sanity/**'),
      ],
    },
  },
})
