import React from 'react'
import { History, Trash2, Star, X, Play, Film, Tv } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AppContextType } from '../layout'

export default function WatchHistoryPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { watchHistory, removeFromWatchHistory, clearWatchHistory, getImageUrl, getSlug } =
    useOutletContext<AppContextType>()

  // Premium relative timestamp formatter
  const formatWatchedTime = (dateStr?: string): string => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Page Header Control Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2.5">
            <History className="size-6 text-primary" />
            Watch History
          </h2>
          <p className="text-xs text-muted-foreground/60 tracking-tight font-medium max-w-xl">
            Titles you open are saved locally to your device. This makes it effortless to return to
            your progress or resume exactly where you left off.
          </p>
        </div>
        {watchHistory.length > 0 && (
          <button
            onClick={clearWatchHistory}
            className="text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 border border-destructive/20 bg-destructive/5 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center gap-2"
          >
            <Trash2 className="size-4" /> Clear History
          </button>
        )}
      </div>

      {/* 2. Grid/Catalogue Content Shelf */}
      {watchHistory.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {watchHistory.map((item) => (
            <div
              key={`${item.contentType}-${item.id}`}
              onClick={() => {
                const destination =
                  item.contentType === 'movie'
                    ? `/movies/${item.slug || getSlug(item.title)}`
                    : `/tvshows/${item.slug || getSlug(item.title || item.name)}`
                navigate(destination)
              }}
              className="group flex flex-col gap-3 rounded-2xl bg-card/20 border border-border/40 p-3 hover:bg-card/60 transition-all duration-300 cursor-pointer relative"
            >
              {/* Media Poster Cover */}
              <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-muted">
                <img
                  src={getImageUrl(item.posterPath)}
                  alt={item.title || item.name}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                />

                {/* Star rating tag overlay */}
                <div className="absolute top-2.5 right-2.5 flex h-7 items-center gap-0.5 rounded-lg bg-card/85 px-2 text-xs font-bold text-primary border border-border/80 backdrop-blur-sm shadow-md">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {item.voteAverage?.toFixed(1) || 'N/A'}
                </div>

                {/* Media Type Badge Overlay (Top Left) */}
                <div className="absolute top-2.5 left-2.5 flex h-7 items-center gap-1 rounded-lg bg-black/70 px-2 text-[9px] font-black uppercase tracking-widest text-white/90 border border-white/10 backdrop-blur-sm shadow-md">
                  {item.contentType === 'movie' ? (
                    <>
                      <Film className="size-3 text-primary" />
                      <span>Movie</span>
                    </>
                  ) : (
                    <>
                      <Tv className="size-3 text-primary" />
                      <span>TV</span>
                    </>
                  )}
                </div>

                {/* TV Episode Resume Indicator Overlay (Bottom Left) */}
                {item.contentType === 'tv' &&
                  item.activeSeason !== undefined &&
                  item.activeEpisode !== undefined && (
                    <div className="absolute bottom-2.5 left-2.5 flex h-7 items-center gap-1.5 rounded-lg bg-primary/95 text-primary-foreground px-2.5 text-[10px] font-black uppercase tracking-widest border border-primary/20 backdrop-blur-sm shadow-lg">
                      <Play className="size-3 fill-primary-foreground text-primary-foreground" />
                      <span>
                        S{item.activeSeason} E{item.activeEpisode}
                      </span>
                    </div>
                  )}
              </div>

              {/* Media Info Panel */}
              <div className="flex flex-col px-1 text-left">
                <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title || item.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground/60 font-semibold mt-1">
                  <span className="text-[10px] tracking-tight font-extrabold">
                    {formatWatchedTime(item.watchedAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent detail navigation trigger!
                      removeFromWatchHistory(item.id, item.contentType)
                    }}
                    className="text-[10px] font-extrabold text-destructive hover:text-destructive/80 flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    <X className="size-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State Panel */
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4 bg-card/10 border border-dashed border-border/80 rounded-3xl p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/5 shadow-inner">
            <History className="size-7 text-muted-foreground/80" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground uppercase tracking-wider">
              Your History is Empty
            </h4>
            <p className="text-sm text-muted-foreground/60 max-w-sm font-medium">
              Open some movies or TV shows to fill your history grid. That way you can resume
              playing titles instantly later.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => navigate('/movies')}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-lg shadow-primary/10"
            >
              Browse Movies
            </button>
            <button
              onClick={() => navigate('/tvshows')}
              className="px-5 py-2.5 bg-card hover:bg-accent border border-border/50 text-foreground font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
            >
              Browse TV Shows
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
