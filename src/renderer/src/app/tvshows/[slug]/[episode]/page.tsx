import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  SkipBack,
  SkipForward,
  Tv,
  List,
  Calendar,
  Star,
  Maximize2,
  Info
} from 'lucide-react'
import { MediaItem, Episode } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppContextType } from '../../layout'

interface SeasonDetails {
  id: number
  name: string
  overview: string
  seasonNumber: number
  episodes: Episode[]
}

/**
 * Parse a SxxExx string (e.g. "S01E05") into season and episode numbers.
 */
function parseEpisodeCode(code: string): { season: number; episode: number } | null {
  const match = code?.match(/^S(\d{1,3})E(\d{1,4})$/i)
  if (!match) return null
  return { season: parseInt(match[1], 10), episode: parseInt(match[2], 10) }
}

/**
 * Format season/episode numbers into the SxxExx slug format.
 */
function formatEpisodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export default function TvShowPlayerPage(): React.JSX.Element {
  const { slug, episode: episodeParam } = useParams<{ slug: string; episode: string }>()
  const navigate = useNavigate()
  const {
    API_BASE_URL,
    getImageUrl,
    getSlug,
    toggleWatchlist,
    isItemInWatchlist,
    addToWatchHistory
  } = useOutletContext<AppContextType>()

  // Parse the SxxExx parameter
  const parsed = useMemo(() => parseEpisodeCode(episodeParam || ''), [episodeParam])

  const [show, setShow] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [activeSeason, setActiveSeason] = useState<number>(parsed?.season || 1)
  const [activeEpisode, setActiveEpisode] = useState<number>(parsed?.episode || 1)
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null)
  const [loadingSeason, setLoadingSeason] = useState<boolean>(false)
  const [showEpisodeList, setShowEpisodeList] = useState<boolean>(false)

  // Sync URL params → state when URL changes
  useEffect(() => {
    if (parsed) {
      setActiveSeason(parsed.season)
      setActiveEpisode(parsed.episode)
    }
  }, [parsed])

  // Navigate to a specific episode (update URL)
  const navigateToEpisode = useCallback(
    (season: number, ep: number) => {
      const code = formatEpisodeCode(season, ep)
      navigate(`/tvshows/${slug}/${code}`, { replace: true })
    },
    [navigate, slug]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === 'Escape') {
        e.preventDefault()
        navigate(`/tvshows/${slug}`)
      } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleNextEpisode()
      } else if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handlePrevEpisode()
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setShowEpisodeList((prev) => !prev)
      } else if (e.key.toLowerCase() === 'w' && show) {
        e.preventDefault()
        toggleWatchlist(show)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, navigate, slug, seasonDetails, activeSeason, activeEpisode, toggleWatchlist])

  // Fetch show details
  useEffect(() => {
    const fetchShowDetails = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/tvshows?limit=100`)
        if (!response.ok) throw new Error('Failed to load TV shows database')
        const result = await response.json()
        const shows: MediaItem[] = result.data || []
        const matchedShow = shows.find((s) => getSlug(s.title || s.name) === slug)

        if (!matchedShow) {
          const parsedId = parseInt(slug || '', 10)
          if (!isNaN(parsedId)) {
            const detailRes = await fetch(`${API_BASE_URL}/api/tvshows/${parsedId}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setShow(detailData)
              setLoading(false)
              return
            }
          }
          throw new Error('TV Show not found in the CaféVerse database.')
        }

        const detailRes = await fetch(`${API_BASE_URL}/api/tvshows/${matchedShow.id}`)
        if (!detailRes.ok) {
          setShow(matchedShow)
        } else {
          const detailData = await detailRes.json()
          setShow(detailData)
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An error occurred loading TV show details'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchShowDetails()
  }, [slug, API_BASE_URL, getSlug])

  // Fetch season episodes
  useEffect(() => {
    if (!show) return

    const fetchSeasonDetails = async (): Promise<void> => {
      setLoadingSeason(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tvshows/${show.id}/seasons/${activeSeason}`
        )
        if (response.ok) {
          const data = await response.json()
          setSeasonDetails(data)
        } else {
          setSeasonDetails(null)
        }
      } catch (err) {
        console.error('Failed to fetch season details', err)
        setSeasonDetails(null)
      } finally {
        setLoadingSeason(false)
      }
    }

    fetchSeasonDetails()
  }, [show, activeSeason, API_BASE_URL])

  // Discord Activity
  useEffect(() => {
    if (show) {
      const year = show.firstAirDate ? ` (${new Date(show.firstAirDate).getFullYear()})` : ''
      window.api?.discord?.updateActivity({
        details: `Watching ${show.title || show.name}${year}`,
        state: `Season ${activeSeason}, Episode ${activeEpisode}`,
        startTimestamp: Date.now(),
        largeImageKey: getImageUrl(show.posterPath),
        largeImageText: `${show.title || show.name} • ${formatEpisodeCode(activeSeason, activeEpisode)}`,
        smallImageKey: 'play',
        smallImageText: 'Streaming now'
      })
    }

    return (): void => {
      window.api?.discord?.clearActivity()
    }
  }, [show, activeSeason, activeEpisode, getImageUrl])

  // Watch history tracking
  useEffect(() => {
    if (show) {
      addToWatchHistory(show, activeSeason, activeEpisode)
    }
  }, [show, activeSeason, activeEpisode, addToWatchHistory])

  // Episode navigation helpers
  const currentEpisode = useMemo(() => {
    if (!seasonDetails?.episodes) return null
    return seasonDetails.episodes.find((e) => e.episodeNumber === activeEpisode) || null
  }, [seasonDetails, activeEpisode])

  const seasonsCount = show?.numberOfSeasons || 1
  const seasonsArray = useMemo(
    () => Array.from({ length: seasonsCount }, (_, i) => i + 1),
    [seasonsCount]
  )

  const handleNextEpisode = useCallback(() => {
    if (!seasonDetails?.episodes) return
    const currentIndex = seasonDetails.episodes.findIndex(
      (e) => e.episodeNumber === activeEpisode
    )
    if (currentIndex < seasonDetails.episodes.length - 1) {
      const nextEp = seasonDetails.episodes[currentIndex + 1]
      navigateToEpisode(activeSeason, nextEp.episodeNumber)
    } else if (activeSeason < seasonsCount) {
      // Jump to next season's first episode
      navigateToEpisode(activeSeason + 1, 1)
    }
  }, [seasonDetails, activeEpisode, activeSeason, seasonsCount, navigateToEpisode])

  const handlePrevEpisode = useCallback(() => {
    if (!seasonDetails?.episodes) return
    const currentIndex = seasonDetails.episodes.findIndex(
      (e) => e.episodeNumber === activeEpisode
    )
    if (currentIndex > 0) {
      const prevEp = seasonDetails.episodes[currentIndex - 1]
      navigateToEpisode(activeSeason, prevEp.episodeNumber)
    } else if (activeSeason > 1) {
      // Jump to previous season (last episode — default to a high number, will resolve)
      navigateToEpisode(activeSeason - 1, 99)
    }
  }, [seasonDetails, activeEpisode, activeSeason, navigateToEpisode])

  const canGoNext = useMemo(() => {
    if (!seasonDetails?.episodes) return false
    const idx = seasonDetails.episodes.findIndex((e) => e.episodeNumber === activeEpisode)
    return idx < seasonDetails.episodes.length - 1 || activeSeason < seasonsCount
  }, [seasonDetails, activeEpisode, activeSeason, seasonsCount])

  const canGoPrev = useMemo(() => {
    if (!seasonDetails?.episodes) return false
    const idx = seasonDetails.episodes.findIndex((e) => e.episodeNumber === activeEpisode)
    return idx > 0 || activeSeason > 1
  }, [seasonDetails, activeEpisode, activeSeason])

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <Skeleton className="w-full aspect-video bg-card rounded-none" />
        <div className="max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-80 bg-card" />
          <Skeleton className="h-24 w-full bg-card" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-11 bg-card rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- ERROR STATE ---
  if (error || !show || !parsed) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">
            {!parsed ? 'Invalid Episode Format' : 'Episode Unavailable'}
          </h4>
          <p className="text-muted-foreground">
            {!parsed
              ? 'Expected format: S01E01 (Season and Episode number)'
              : error || 'Unable to retrieve episode content.'}
          </p>
        </div>
        <Button
          onClick={() => navigate(`/tvshows/${slug || ''}`)}
          size="lg"
          className="rounded-none font-bold bg-primary text-primary-foreground hover:bg-primary transition-none cursor-pointer"
        >
          Return to Show
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full pb-24">
      {/* ─── TOP BAR: Navigation + Now Playing ─── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3">
          {/* Left: Back + Show Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/tvshows/${slug}`)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer transition-colors shrink-0"
              title="Back to show details (Esc)"
            >
              <ChevronLeft className="size-4" />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
                Back
              </span>
            </button>
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <Tv className="size-3.5 text-primary shrink-0" />
              <span className="text-sm font-bold text-foreground truncate">
                {show.title || show.name}
              </span>
            </div>
          </div>

          {/* Center: Episode indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
              {formatEpisodeCode(activeSeason, activeEpisode)}
            </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEpisodeList((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                showEpisodeList
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title="Toggle episode list (L)"
            >
              <List className="size-3.5" />
              <span className="hidden md:inline">Episodes</span>
            </button>
            <button
              onClick={() => toggleWatchlist(show)}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                isItemInWatchlist(show)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title="Toggle watchlist (W)"
            >
              <Star
                className={`size-3.5 ${isItemInWatchlist(show) ? 'fill-primary' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex flex-col lg:flex-row">
        {/* ─── PLAYER + INFO COLUMN ─── */}
        <div className={`flex-1 min-w-0 ${showEpisodeList ? 'lg:mr-0' : ''}`}>
          {/* Video Player */}
          <div className="relative w-full bg-black">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`https://vaplayer.ru/embed/tv/${show.imdbId}/${activeSeason}/${activeEpisode}?color=ebd29f&secondaryColor=2e2e2e&title=false`}
                className="absolute inset-0 border-0"
                style={{ top: '-1%', left: '-1%', width: '102%', height: '102%' }}
                allowFullScreen
                allow="fullscreen; picture-in-picture"
                title={`Watch ${show.title || show.name} ${formatEpisodeCode(activeSeason, activeEpisode)}`}
              />
            </div>
          </div>

          {/* Episode Navigation Bar */}
          <div className="border-b border-border bg-card/30">
            <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3">
              {/* Previous */}
              <button
                onClick={handlePrevEpisode}
                disabled={!canGoPrev}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-95"
              >
                <SkipBack className="size-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Current playing info */}
              <div className="flex items-center gap-3 text-center min-w-0">
                <Play className="size-3.5 text-primary fill-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-black text-foreground">
                    Season {activeSeason} &bull; Episode {activeEpisode}
                  </span>
                  {currentEpisode?.name && (
                    <span className="text-xs text-muted-foreground font-medium ml-2 hidden md:inline">
                      &mdash; {currentEpisode.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Next */}
              <button
                onClick={handleNextEpisode}
                disabled={!canGoNext}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-95"
              >
                <span className="hidden sm:inline">Next</span>
                <SkipForward className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Episode Details Card */}
          <div className="px-4 sm:px-6 md:px-8 py-6 space-y-5">
            {/* Title + Metadata */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                    {currentEpisode?.name || `Episode ${activeEpisode}`}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="text-primary">
                      {formatEpisodeCode(activeSeason, activeEpisode)}
                    </span>
                    <span>&bull;</span>
                    <span>{show.title || show.name}</span>
                    {currentEpisode?.airDate && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(currentEpisode.airDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </>
                    )}
                    {currentEpisode?.voteAverage != null && currentEpisode.voteAverage > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-primary">
                          <Star className="size-3 fill-primary" />
                          {currentEpisode.voteAverage.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand player hint */}
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe')
                    iframe?.requestFullscreen?.()
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-accent cursor-pointer transition-all shrink-0"
                >
                  <Maximize2 className="size-3" />
                  Fullscreen
                </button>
              </div>

              {/* Overview */}
              {currentEpisode?.overview && (
                <p className="text-sm sm:text-base text-foreground/75 leading-relaxed font-medium max-w-3xl">
                  {currentEpisode.overview}
                </p>
              )}
            </div>

            {/* Inline Season Tabs + Episode Grid (visible on mobile or when sidebar is hidden) */}
            <div className={`space-y-5 ${showEpisodeList ? 'lg:hidden' : ''}`}>
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <Info className="size-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                  Quick Episode Select
                </span>
              </div>

              {/* Season Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {seasonsArray.map((seasonNum) => (
                  <button
                    key={seasonNum}
                    onClick={() => navigateToEpisode(seasonNum, 1)}
                    className={`px-3.5 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer border ${
                      activeSeason === seasonNum
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/15'
                        : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    S{String(seasonNum).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* Episode Compact Grid */}
              {loadingSeason ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 bg-card rounded-lg" />
                  ))}
                </div>
              ) : seasonDetails?.episodes && seasonDetails.episodes.length > 0 ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                  {seasonDetails.episodes.map((ep) => {
                    const isActive = activeEpisode === ep.episodeNumber
                    return (
                      <button
                        key={ep.id}
                        onClick={() => navigateToEpisode(activeSeason, ep.episodeNumber)}
                        className={`flex items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/15'
                            : 'bg-card/30 border-border text-foreground hover:bg-accent/60'
                        }`}
                        title={ep.name || `Episode ${ep.episodeNumber}`}
                      >
                        <span className="text-xs font-black">{ep.episodeNumber}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                  {Array.from(
                    {
                      length: show.numberOfEpisodes
                        ? Math.ceil(show.numberOfEpisodes / seasonsCount)
                        : 10
                    },
                    (_, idx) => idx + 1
                  ).map((epNum) => {
                    const isActive = activeEpisode === epNum
                    return (
                      <button
                        key={epNum}
                        onClick={() => navigateToEpisode(activeSeason, epNum)}
                        className={`flex items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/15'
                            : 'bg-card/30 border-border text-foreground hover:bg-accent/60'
                        }`}
                      >
                        <span className="text-xs font-black">{epNum}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── EPISODE LIST SIDEBAR (Desktop) ─── */}
        {showEpisodeList && (
          <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border bg-card/15 shrink-0 max-h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <List className="size-3.5 text-primary" />
                  Episodes
                </h3>
                <button
                  onClick={() => setShowEpisodeList(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Season Tabs in Sidebar */}
              <div className="flex flex-wrap gap-1">
                {seasonsArray.map((seasonNum) => (
                  <button
                    key={seasonNum}
                    onClick={() => navigateToEpisode(seasonNum, 1)}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer border ${
                      activeSeason === seasonNum
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    S{String(seasonNum).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Episodes List */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {loadingSeason ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-card rounded-xl" />
                  ))}
                </div>
              ) : seasonDetails?.episodes && seasonDetails.episodes.length > 0 ? (
                <div className="p-2 space-y-0.5">
                  {seasonDetails.episodes.map((ep) => {
                    const isActive = activeEpisode === ep.episodeNumber
                    return (
                      <button
                        key={ep.id}
                        onClick={() => navigateToEpisode(activeSeason, ep.episodeNumber)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-accent/40 border border-transparent'
                        }`}
                      >
                        {/* Episode Number Badge */}
                        <div
                          className={`flex items-center justify-center size-9 rounded-lg shrink-0 text-xs font-black ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/40 text-muted-foreground group-hover:bg-muted/70'
                          }`}
                        >
                          {ep.episodeNumber}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <Play className="size-3 text-primary fill-primary shrink-0" />
                            )}
                            <span
                              className={`text-xs font-bold truncate ${
                                isActive ? 'text-primary' : 'text-foreground'
                              }`}
                            >
                              {ep.name || `Episode ${ep.episodeNumber}`}
                            </span>
                          </div>
                          {ep.overview && (
                            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                              {ep.overview}
                            </p>
                          )}
                          {ep.airDate && (
                            <span className="text-[9px] text-muted-foreground/60 font-semibold">
                              {new Date(ep.airDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-3 space-y-1">
                  {Array.from(
                    {
                      length: show.numberOfEpisodes
                        ? Math.ceil(show.numberOfEpisodes / seasonsCount)
                        : 10
                    },
                    (_, idx) => idx + 1
                  ).map((epNum) => {
                    const isActive = activeEpisode === epNum
                    return (
                      <button
                        key={epNum}
                        onClick={() => navigateToEpisode(activeSeason, epNum)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-accent/40 border border-transparent'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center size-9 rounded-lg shrink-0 text-xs font-black ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          {epNum}
                        </div>
                        <span
                          className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}
                        >
                          Episode {epNum}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
