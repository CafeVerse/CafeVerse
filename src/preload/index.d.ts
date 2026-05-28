import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fetchMovies: (params: {
        page: number
        limit: number
        search?: string
        genres?: string[]
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }) => Promise<unknown>
      windowControls: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      getAppVersion: () => Promise<string>
      autoUpdater: {
        checkForUpdates: () => void
        downloadUpdate: () => void
        quitAndInstall: () => void
        onUpdateAvailable: (callback: (info: unknown) => void) => () => void
        onUpdateNotAvailable: (callback: () => void) => () => void
        onDownloadProgress: (callback: (progress: unknown) => void) => () => void
        onUpdateDownloaded: (callback: (info: unknown) => void) => () => void
        onError: (callback: (error: unknown) => void) => () => void
      }
    }
  }
}
