import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@electron-toolkit/utils',
          '@electron-toolkit/preload',
          '@ghostery/adblocker-electron',
          '@xhayper/discord-rpc',
          'cross-fetch',
          'electron-updater'
        ]
      })
    ]
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@electron-toolkit/utils', '@electron-toolkit/preload']
      })
    ]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
