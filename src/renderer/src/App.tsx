import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Import types
import { MediaItem } from '@/types'

// Import Navbar and Pages
import Navbar from '@/components/navbar'
import { Dashboard } from '@/pages/dashboard'
import { Movies } from '@/pages/movies'
import { TvShows } from '@/pages/tvshows'
import { Watchlist } from '@/pages/watchlist'
import { MovieDetail } from '@/pages/movieDetail'
import { TermsOfService } from '@/pages/terms'
import { PrivacyPolicy } from '@/pages/privacy'
import { DmcaPolicy } from '@/pages/dmca'
import { ContactUs } from '@/pages/contact'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'http://localhost:8080'

function App(): React.JSX.Element {
  // API Data States
  const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null)
  const [recentTrending, setRecentTrending] = useState<MediaItem[]>([])

  // Watchlist State (Persisted locally in localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('cineverse_watchlist')
    return saved ? JSON.parse(saved) : []
  })

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
    localStorage.setItem('cineverse_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Fetch Featured Hero item & trending items when landing on dashboard
  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        const resMovies = await fetch(
          `${API_BASE_URL}/api/movies?limit=5&sort=popularity&order=desc`
        )
        if (resMovies.ok) {
          const moviesData = await resMovies.json()
          if (moviesData.data && moviesData.data.length > 0) {
            const mapped = moviesData.data.map((m: MediaItem) => ({
              ...m,
              slug: m.slug || getSlug(m.title || m.name)
            }))
            setFeaturedItem(mapped[0])
            setRecentTrending(mapped)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard highlights:', err)
      }
    }
    loadDashboardData()
  }, [getSlug])

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
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* 1. GLASSMORPHIC OBISIDAN SIDEBAR */}
      <Navbar watchlistCount={watchlist.length} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        {/* Glow backdrop behind header */}
        <div className="absolute top-0 right-1/4 h-75 w-125 rounded-full bg-primary/5 blur-[120px]" />

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  featuredItem={featuredItem}
                  recentTrending={recentTrending}
                  getImageUrl={getImageUrl}
                  toggleWatchlist={toggleWatchlist}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/movies"
              element={
                <Movies
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/movies/:slug"
              element={
                <MovieDetail
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  toggleWatchlist={toggleWatchlist}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/tvshows"
              element={
                <TvShows
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <Watchlist
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  toggleWatchlist={toggleWatchlist}
                  getImageUrl={getImageUrl}
                  getSlug={getSlug}
                />
              }
            />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/dmca" element={<DmcaPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
