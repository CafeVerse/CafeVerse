import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Titlebar from '@/components/titlebar'
import { MediaItem } from '@/types'
import { Progress } from '@/components/ui/progress'
import { ArrowUpCircle, RefreshCw, X, Download } from 'lucide-react'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'https://api.movies.voidart.us'

const cleanReleaseNotes = (rawNotes?: string): string => {
  if (!rawNotes) return ''

  let cleaned = rawNotes

  // 1. Remove the center-aligned badge paragraph (e.g., <p align="center">...</p>)
  cleaned = cleaned.replace(/<p\s+align="center">[\s\S]*?<\/p>/gi, '')

  // 2. Remove redundant <h2> or <h1> release note titles (e.g. <h2>🚀 Release Notes...</h2>)
  cleaned = cleaned.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, '')

  // 3. Remove HR dividers and automated build footers
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, '')
  cleaned = cleaned.replace(/<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/gi, '')

  return cleaned.trim()
}

export interface AppContextType {
  watchlist: MediaItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<MediaItem[]>>
  getImageUrl: (path?: string) => string
  getSlug: (title?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  API_BASE_URL: string
}

export default function RootLayout(): React.JSX.Element {
  // Watchlist State (Persisted locally in localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('cafeverse_watchlist')
    return saved ? JSON.parse(saved) : []
  })

  // Auto Updater State
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string } | null>(
    null
  )
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const [updaterError, setUpdaterError] = useState<string | null>(null)
  const [toastDismissed, setToastDismissed] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('')

  // Format Helper for TMDB Images
  const getImageUrl = useCallback((path?: string): string => {
    if (!path) return ''
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${TMDB_IMAGE_BASE}${cleanPath}`
  }, [])

  // Helper to generate a clean, URL-friendly slug from title or name
  const getSlug = useCallback((title?: string): string => {
    if (!title) return ''
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/--+/g, '-') // replace multiple hyphens
      .trim()
  }, [])

  // Sync Watchlist with localStorage
  useEffect(() => {
    localStorage.setItem('cafeverse_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Bind Auto Updater IPC Events
  useEffect(() => {
    if (window.api?.getAppVersion) {
      window.api.getAppVersion().then((ver) => setCurrentVersion(ver))
    }

    if (!window.api?.autoUpdater) return

    const unsubscribeAvailable = window.api.autoUpdater.onUpdateAvailable((info) => {
      setUpdateInfo(info as { version: string; releaseNotes?: string })
      setToastDismissed(false)
      setUpdaterError(null)
    })

    const unsubscribeProgress = window.api.autoUpdater.onDownloadProgress((progress) => {
      setDownloading(true)
      setDownloadProgress(Math.round((progress as { percent?: number }).percent || 0))
    })

    const unsubscribeDownloaded = window.api.autoUpdater.onUpdateDownloaded(() => {
      setDownloading(false)
      setDownloaded(true)
    })

    const unsubscribeError = window.api.autoUpdater.onError((err) => {
      setUpdaterError(typeof err === 'string' ? err : 'Update failed')
      setDownloading(false)
      setTimeout(() => setUpdaterError(null), 5000)
    })

    return () => {
      unsubscribeAvailable()
      unsubscribeProgress()
      unsubscribeDownloaded()
      unsubscribeError()
    }
  }, [])

  // Watchlist Actions
  const toggleWatchlist = (item: MediaItem): void => {
    const exists = watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
    if (exists) {
      setWatchlist(
        watchlist.filter((w) => !(w.id === item.id && w.contentType === item.contentType))
      )
    } else {
      setWatchlist([...watchlist, item])
    }
  }

  const isItemInWatchlist = (item: MediaItem): boolean => {
    return watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Titlebar />
      <Navbar watchlistCount={watchlist.length} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        <div className="absolute top-0 right-1/4 h-75 w-125 rounded-full bg-primary/5 blur-[120px]" />
        <div className="flex-1 overflow-y-auto">
          <Outlet
            context={{
              watchlist,
              setWatchlist,
              getImageUrl,
              getSlug,
              toggleWatchlist,
              isItemInWatchlist,
              API_BASE_URL
            }}
          />
        </div>
      </main>

      {/* Premium Glassmorphic Update Toast */}
      {updateInfo && !toastDismissed && (
        <div className="fixed bottom-6 right-6 w-96 z-50 overflow-hidden rounded-2xl bg-[#0c0a09]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 fade-in duration-500 select-none">
          {/* Architectural Glow Effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/[0.03] blur-[40px] pointer-events-none" />

          <div className="p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/[0.04] shadow-md">
                  <ArrowUpCircle className="size-5.5 text-primary animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white/50 tracking-[0.2em] uppercase leading-none mb-1">
                    Update Available
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-white leading-tight tracking-wide">
                    {currentVersion ? `v${currentVersion} → ` : ''}v{updateInfo.version}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setToastDismissed(true)}
                className="text-muted-foreground/40 hover:text-white transition-colors cursor-pointer p-1 hover:bg-white/5 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Release Notes / Description */}
            {updateInfo.releaseNotes ? (
              <div
                className="text-xs text-muted-foreground/75 leading-relaxed bg-white/[0.01] border border-white/[0.02] rounded-xl p-3 max-h-32 overflow-y-auto scrollbar-none font-medium [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-1 [&_h3]:font-black [&_h3]:text-white [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mt-3 [&_h3]:first:mt-0"
                dangerouslySetInnerHTML={{ __html: cleanReleaseNotes(updateInfo.releaseNotes) }}
              />
            ) : (
              <div className="text-xs text-muted-foreground/75 leading-relaxed bg-white/[0.01] border border-white/[0.02] rounded-xl p-3 max-h-24 overflow-y-auto scrollbar-none font-medium">
                This version includes exciting performance enhancements, library fixes, and visual
                UI optimizations to elevate your streaming experience.
              </div>
            )}

            {/* Error Message */}
            {updaterError && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 font-semibold">
                Error: {updaterError}
              </div>
            )}

            {/* Downloading State Progress */}
            {downloading && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-primary animate-pulse">Downloading update...</span>
                  <span className="text-muted-foreground">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-1.5 bg-white/5" />
              </div>
            )}

            {/* Action Button */}
            {!downloaded ? (
              <button
                disabled={downloading}
                onClick={() => window.api?.autoUpdater?.downloadUpdate()}
                className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md select-none border border-transparent ${
                  downloading
                    ? 'bg-white/5 text-muted-foreground/40 cursor-not-allowed border-white/[0.02]'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {downloading ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    Download & Install
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => window.api?.autoUpdater?.quitAndInstall()}
                className="w-full h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-md select-none border border-transparent"
              >
                <RefreshCw className="size-3.5 animate-spin-slow" />
                Restart & Apply Update
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
