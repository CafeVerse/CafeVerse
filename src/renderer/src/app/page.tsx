import React, { useState, useEffect } from 'react'
import { Flame, Star, Calendar, Heart, TrendingUp, ChevronRight, Play, Film } from 'lucide-react'
import { MediaItem } from '@/types'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AppContextType } from './layout'

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { getImageUrl, getSlug, toggleWatchlist, isItemInWatchlist, API_BASE_URL } =
    useOutletContext<AppContextType>()

  // API Data States
  const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null)
  const [recentTrending, setRecentTrending] = useState<MediaItem[]>([])

  // Fetch Featured Hero item & trending items when landing on dashboard
  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        // Fetch 6 items to perfectly occupy all slots in our responsive grid-cols-6 row
        const resMovies = await fetch(
          `${API_BASE_URL}/api/movies?limit=6&sort=popularity&order=desc`
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
  }, [getSlug, API_BASE_URL])

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Billboard Section */}
      {featuredItem && (
        <div className="relative overflow-hidden rounded-2xl border border-[#3c3a36] bg-[#2e2e2e]/40 select-none">
          {/* Image Backdrop with flat dark masking */}
          <div className="absolute inset-0 z-0">
            <img
              src={getImageUrl(featuredItem.backdropPath)}
              alt={featuredItem.title || featuredItem.name}
              className="h-full w-full object-cover opacity-25 transition-all duration-300 hover:scale-[1.01]"
            />
            {/* Elegant cinematic obsidian fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#232323] via-[#232323]/95 to-transparent z-10" />
            <div className="absolute inset-0 bg-background/50 z-10 md:hidden" />
          </div>

          <div className="relative z-20 max-w-2xl px-8 py-14 sm:px-12 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5 rounded-full bg-primary/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20">
              <Flame className="size-3 text-primary animate-pulse" />
              <span>FEATURED RELEASE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
              {featuredItem.title || featuredItem.name}
            </h2>

            {featuredItem.tagline && (
              <p className="text-xs font-black italic text-primary tracking-wider uppercase">
                &ldquo;{featuredItem.tagline}&rdquo;
              </p>
            )}

            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-3 font-medium max-w-[65ch]">
              {featuredItem.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5 bg-[#2e2e2e]/70 border border-[#3c3a36] px-2.5 py-1 rounded-lg text-primary">
                <Star className="size-3 fill-primary text-primary" />{' '}
                {featuredItem.voteAverage?.toFixed(1) || 'N/A'} Score
              </span>
              {featuredItem.releaseDate && (
                <span className="flex items-center gap-1.5 bg-[#2e2e2e]/50 border border-[#3c3a36] px-2.5 py-1 rounded-lg">
                  <Calendar className="size-3" /> {new Date(featuredItem.releaseDate).getFullYear()}
                </span>
              )}
              {featuredItem.genres &&
                featuredItem.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="bg-primary/10 border border-primary/15 text-primary px-2.5 py-1 rounded-lg"
                  >
                    {g}
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() =>
                  navigate(
                    '/movies/' +
                      (featuredItem.slug || getSlug(featuredItem.title || featuredItem.name))
                  )
                }
                className="flex items-center gap-2 h-10 rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/95 active:scale-98 transition-all duration-150 cursor-pointer shadow-md"
              >
                <Play className="size-3.5 fill-primary-foreground" />
                <span>Stream Details</span>
              </button>

              <button
                onClick={() => toggleWatchlist(featuredItem)}
                className={`flex items-center gap-2 h-10 rounded-xl border px-5 text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer ${
                  isItemInWatchlist(featuredItem)
                    ? 'border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25'
                    : 'border-[#3c3a36] bg-[#2e2e2e]/40 text-white hover:bg-[#2e2e2e]'
                }`}
              >
                <Heart
                  className={`size-3.5 ${
                    isItemInWatchlist(featuredItem)
                      ? 'fill-destructive text-destructive'
                      : 'text-muted-foreground/50'
                  }`}
                />
                <span>{isItemInWatchlist(featuredItem) ? 'Watchlisted' : 'Add Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HORIZONTAL TRENDING SLIDERS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-black tracking-widest text-white/95 uppercase flex items-center gap-2 select-none">
            <TrendingUp className="text-primary size-4.5" /> Database Highlights
          </h3>
          <button
            onClick={() => navigate('/movies')}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Explore Full Library <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recentTrending.length > 0 ? (
            recentTrending.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate('/movies/' + (item.slug || getSlug(item.title || item.name)))
                }
                className="group flex flex-col gap-3 rounded-2xl bg-[#2e2e2e]/40 border border-[#3c3a36]/50 p-3 transition-all duration-150 hover:bg-[#2e2e2e]/80 cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#232323]">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-2.5 right-2.5 flex h-6 items-center gap-0.5 rounded-lg bg-[#232323]/90 px-2 text-[10px] font-black text-primary border border-[#3c3a36] backdrop-blur-md">
                    <Star className="size-3 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                  <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors uppercase tracking-wide">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-semibold">
                    <span>
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'Series'}
                    </span>
                    <span className="uppercase tracking-widest text-[9px] font-black text-primary">
                      {item.contentType}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-[#3c3a36] bg-[#2e2e2e]/20 max-w-lg mx-auto">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[#2e2e2e]/80 border border-white/[0.03] mb-4">
                <Film className="size-6 text-primary animate-pulse" />
              </div>
              <h4 className="text-md font-black text-white uppercase tracking-wider mb-2">
                No Titles in Database
              </h4>
              <p className="text-xs text-muted-foreground/75 leading-relaxed max-w-sm mb-6 font-medium">
                CaféVerse is currently empty. Run the backend migrations and seeding commands to
                populate your cinematic workspace.
              </p>
              <button
                onClick={() => navigate('/movies')}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer"
              >
                Refresh Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
