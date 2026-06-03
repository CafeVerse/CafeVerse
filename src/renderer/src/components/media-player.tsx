import React, { useState, useEffect, useRef } from 'react'
import { Maximize2, RefreshCw, Play, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { MediaItem, Episode, SeasonMeta } from '@/types'

const API_BASE = 'https://cafeverce-api.vercel.app'

export interface MediaPlayerProps {
  item: MediaItem
}

interface SourceOption {
  name: string
  getUrl: (item: MediaItem, season: number, episode: number) => string
}

const SOURCES: SourceOption[] = [
  {
    name: 'VAPlayer',
    getUrl: (item, s, e) => {
      const id = item.imdbId || String(item.tmdbId || item.id)
      return item.contentType === 'tv'
        ? `https://vaplayer.ru/embed/tv/${id}/${s}/${e}`
        : `https://vaplayer.ru/embed/movie/${id}`
    }
  }
]

export default function MediaPlayer({ item }: MediaPlayerProps): React.JSX.Element {
  const isTv = item.contentType === 'tv'

  // Player & Iframe states
  const [sourceIdx, setSourceIdx] = useState(0)
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // TV Show specific states
  const [seasons, setSeasons] = useState<SeasonMeta[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)

  const playerRef = useRef<HTMLDivElement>(null)

  // Fetch seasons for TV Show
  useEffect(() => {
    if (!isTv) return
    const timer = setTimeout(() => {
      setLoadingSeasons(true)
      const fetchSeasons = async (): Promise<void> => {
        try {
          const showId = item.id || item.tmdbId
          const res = await fetch(`${API_BASE}/tv/${item.slug || showId}/seasons`).catch(() =>
            fetch(`${API_BASE}/api/tvshows/${showId}/seasons`)
          )
          if (res.ok) {
            const json = await res.json()
            const data = Array.isArray(json) ? json : json.seasons || json.data || []
            setSeasons(data)
            if (data.length > 0) {
              setCurrentSeason(data[0].seasonNumber)
            }
          }
        } catch (err) {
          console.error('Failed to fetch seasons:', err)
          // Fallback seasons generator
          const count = item.numberOfSeasons || 1
          const fallback = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            seasonNumber: i + 1,
            name: `Season ${i + 1}`,
            episodeCount: item.numberOfEpisodes ? Math.round(item.numberOfEpisodes / count) : 10
          }))
          setSeasons(fallback)
        } finally {
          setLoadingSeasons(false)
        }
      }
      fetchSeasons()
    }, 0)

    return () => clearTimeout(timer)
  }, [isTv, item])

  // Fetch episodes for selected Season
  useEffect(() => {
    if (!isTv || !currentSeason) return
    const timer = setTimeout(() => {
      setLoadingEpisodes(true)
      const fetchEpisodes = async (): Promise<void> => {
        try {
          const showId = item.id || item.tmdbId
          let res = await fetch(
            `${API_BASE}/tv/${item.slug || showId}/seasons/${currentSeason}/episodes`
          )
          if (!res.ok) {
            res = await fetch(`${API_BASE}/api/tvshows/${showId}/seasons/${currentSeason}`)
          }
          if (res.ok) {
            const json = await res.json()
            const data = Array.isArray(json) ? json : json.episodes || json.items || json.data || []
            setEpisodes(data)
            if (data.length > 0) {
              setCurrentEpisode(data[0].episodeNumber)
            }
          }
        } catch (err) {
          console.error('Failed to fetch episodes:', err)
          // Fallback episodes generator
          const targetSeason = seasons.find((s) => s.seasonNumber === currentSeason)
          const count = targetSeason?.episodeCount || 10
          const fallback = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            episodeNumber: i + 1,
            seasonNumber: currentSeason,
            name: `Episode ${i + 1}`,
            overview: `Episode ${i + 1} of Season ${currentSeason}.`
          }))
          setEpisodes(fallback)
        } finally {
          setLoadingEpisodes(false)
        }
      }
      fetchEpisodes()
    }, 0)

    return () => clearTimeout(timer)
  }, [isTv, currentSeason, item, seasons])

  const activeSource = SOURCES[sourceIdx]
  const embedUrl = activeSource.getUrl(item, currentSeason, currentEpisode)

  const handleSourceChange = (idx: number): void => {
    setSourceIdx(idx)
    setIframeLoaded(false)
    setIframeKey((k) => k + 1)
  }

  const handleFullscreen = (): void => {
    const iframe = document.getElementById('media-iframe') as HTMLIFrameElement | null
    if (iframe) {
      iframe.requestFullscreen?.()
    }
  }

  const handleRefresh = (): void => {
    setIframeLoaded(false)
    setIframeKey((k) => k + 1)
  }

  return (
    <div
      ref={playerRef}
      className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      {/* Player Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border/20 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9.5px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
            {isTv ? `S${currentSeason}E${currentEpisode}` : 'Movie'}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-white/90 font-bold uppercase tracking-wider">
            <Play className="size-3.5 fill-current text-primary" />
            <span>Now Playing</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Source Selector */}
          <div className="relative group">
            <select
              value={sourceIdx}
              onChange={(e) => handleSourceChange(parseInt(e.target.value))}
              className="h-9.5 bg-muted hover:bg-muted/80 border border-border/40 hover:border-primary/20 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl px-3 pr-8 outline-hidden focus:ring-1 focus:ring-primary cursor-pointer transition-all appearance-none"
            >
              {SOURCES.map((src, i) => (
                <option key={src.name} value={i} className="bg-background font-bold text-xs py-2">
                  {src.name}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3.5 absolute right-2.5 top-3 pointer-events-none text-muted-foreground/60" />
          </div>

          <Button
            size="sm"
            onClick={handleRefresh}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl px-4.5 py-2 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="size-3" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleFullscreen}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-extrabold uppercase tracking-widest rounded-xl px-4.5 py-2 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Maximize2 className="size-3" />
            <span>Fullscreen</span>
          </Button>
        </div>
      </div>

      {/* Main Video Screen Container */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#09090b]/90 z-10">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-[10px] text-muted-foreground/75 font-black uppercase tracking-widest animate-pulse">
              Buffering stream details...
            </p>
          </div>
        )}
        <iframe
          id="media-iframe"
          key={iframeKey}
          src={embedUrl}
          title={`Watch ${item.title || item.name}`}
          className="w-full h-full"
          allowFullScreen
          allow="fullscreen; picture-in-picture"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      {/* TV Season / Episode selectors below screen */}
      {isTv && seasons.length > 0 && (
        <div className="space-y-4 bg-muted/5 border border-border/10 p-5 rounded-3xl animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-4">
            <div className="space-y-1">
              <span className="text-[9.5px] uppercase tracking-[0.25em] text-primary font-black block">
                Browse Series Seasons
              </span>
              <h4 className="text-sm font-black text-white">Select Season & Episode</h4>
            </div>

            {/* Season selection dropdown */}
            <div className="relative flex items-center">
              {loadingSeasons ? (
                <Loader2 className="size-4 animate-spin text-primary mr-2" />
              ) : (
                <>
                  <select
                    value={currentSeason}
                    onChange={(e) => {
                      setCurrentSeason(parseInt(e.target.value))
                      setIframeLoaded(false)
                    }}
                    className="h-9.5 bg-muted hover:bg-muted/80 border border-border/40 hover:border-primary/20 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl px-3 pr-8 outline-hidden focus:ring-1 focus:ring-primary cursor-pointer transition-all appearance-none"
                  >
                    {seasons.map((s) => (
                      <option
                        key={s.seasonNumber}
                        value={s.seasonNumber}
                        className="bg-background font-bold text-xs py-2"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-3.5 absolute right-2.5 top-3 pointer-events-none text-muted-foreground/60" />
                </>
              )}
            </div>
          </div>

          {/* Episode items grid */}
          {loadingEpisodes ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : episodes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No episodes found for this season.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-56 overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisode
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisode(ep.episodeNumber)
                      setIframeLoaded(false)
                    }}
                    className={`p-3 rounded-2xl text-[10px] font-extrabold text-left border transition-all cursor-pointer truncate ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                        : 'bg-muted/40 text-white/80 border-border/25 hover:bg-muted hover:text-white hover:border-border/50'
                    }`}
                  >
                    <span className="block text-[8px] opacity-60 uppercase mb-0.5 tracking-wider">
                      Episode {ep.episodeNumber}
                    </span>
                    <span className="block truncate">{ep.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
