import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Heart,
  Award,
  Film,
  BookmarkCheck,
  ChevronLeft,
  Volume2,
  VolumeX,
  Download
} from 'lucide-react'
import { MediaItem } from '@/types'

// Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MovieDetailProps {
  API_BASE_URL: string
  getImageUrl: (path?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  getSlug: (title?: string) => string
}

const getKeywords = (movie: MediaItem): string[] => {
  const base = ['hd', 'bluray', 'stream', 'cineverse']
  if (movie.genres) {
    base.push(...movie.genres.map((g) => g.toLowerCase()))
  }
  if (movie.title) {
    base.push(
      ...movie.title
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 3)
    )
  }
  return Array.from(new Set(base)).slice(0, 6)
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  API_BASE_URL,
  getImageUrl,
  toggleWatchlist,
  isItemInWatchlist,
  getSlug
}) => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [similarMovies, setSimilarMovies] = useState<MediaItem[]>([])

  useEffect(() => {
    const fetchMovie = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch movies catalogue to resolve by slug
        const response = await fetch(`${API_BASE_URL}/api/movies?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load movies database')
        }
        const result = await response.json()
        const movies: MediaItem[] = result.data || []

        // Find movie where slug matches
        const matchedMovie = movies.find((m) => getSlug(m.title) === slug)

        if (!matchedMovie) {
          // Fallback: Check if slug is database ID
          const parsedId = parseInt(slug || '', 10)
          if (!isNaN(parsedId)) {
            const detailRes = await fetch(`${API_BASE_URL}/api/movies/${parsedId}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setMovie(detailData)

              // Set similar movies fallback
              const others = movies.filter((m) => m.id !== detailData.id)
              const matching = others.filter((m) =>
                m.genres?.some((g) => detailData.genres?.includes(g))
              )
              setSimilarMovies([...matching, ...others].slice(0, 4))

              setLoading(false)
              return
            }
          }
          throw new Error('Movie not found in the Cineverse database.')
        }

        // Resolve similar movies from catalogue
        const others = movies.filter((m) => m.id !== matchedMovie.id)
        const matching = others.filter((m) =>
          m.genres?.some((g) => matchedMovie.genres?.includes(g))
        )
        setSimilarMovies([...matching, ...others].slice(0, 4))

        // 2. Fetch full details by database ID
        const detailRes = await fetch(`${API_BASE_URL}/api/movies/${matchedMovie.id}`)
        if (!detailRes.ok) {
          // Fallback to matched catalog movie
          setMovie(matchedMovie)
        } else {
          const detailData = await detailRes.json()
          setMovie(detailData)
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An error occurred loading movie details'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [slug, API_BASE_URL, getSlug])

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Back and Action button skeletons */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Hero Backdrop skeleton */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card h-96 w-full flex flex-col justify-end p-8 md:p-12">
          <div className="absolute inset-0 bg-muted/20" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <Skeleton className="w-48 md:w-56 aspect-2/3 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-4 md:pt-24 pt-0 w-full">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <Skeleton className="h-10 w-2/3 rounded-lg" />
              <Skeleton className="h-5 w-1/2 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6 animate-fade-in">
        <Film className="size-16 text-destructive bg-destructive/10 p-4 rounded-full border border-destructive/20 shadow-inner" />
        <div className="space-y-2">
          <h4 className="text-xl font-bold text-foreground">Movie Details Unavailable</h4>
          <p className="text-sm text-muted-foreground max-w-md">
            {error || 'Unable to retrieve title content.'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/movies')}
          size="lg"
          className="rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ArrowLeft className="size-4" /> Return to Catalogue
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* 1. Cinematic Full-Bleed Hero Banner */}
      <div className="relative w-full h-[55vh] min-h-[380px] md:h-[65vh] md:min-h-[480px] rounded-4xl overflow-hidden border border-white/10 shadow-2xl group mb-8 animate-fade-in">
        {/* Backdrop Image */}
        <img
          src={getImageUrl(movie.backdropPath)}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        />

        {/* Sleek bottom-up and left-right gradient overlays for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-10" />

        {/* Floating Controls */}
        <button
          onClick={() => navigate('/movies')}
          className="absolute top-6 left-6 z-20 flex items-center justify-center size-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer hover:scale-115"
          title="Back to Movies"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Bottom-left Cinematic Title Overlay */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 max-w-3xl z-20 space-y-4 text-left">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] uppercase">
            {movie.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm lg:text-base font-semibold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            <span>· {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</span>
            {movie.runtime && (
              <>
                <span>·</span>
                <span>
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Structured details layout below the hero */}
      <div className="relative z-10 space-y-10 animate-fade-in max-w-6xl mx-auto pb-20 px-1">
        {/* Main 3-Column Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Column 1: Poster, Download Button, Tags */}
          <div className="md:col-span-4 lg:col-span-3 space-y-5">
            {/* Poster with White Border */}
            {movie.posterPath && (
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-muted aspect-[2/3] relative group">
                <img
                  src={getImageUrl(movie.posterPath)}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
              </div>
            )}

            {/* Big Green Download Button */}
            <Button
              className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2.5 text-lg shadow-lg cursor-pointer transition-all hover:scale-102"
              onClick={() => alert('Starting Movie Download...')}
            >
              <Download className="size-5 text-white stroke-[3px]" />
              Download
            </Button>
          </div>

          {/* Column 2: Title, Genres, Available qualities, Subtitle, Stats */}
          <div className="md:col-span-8 lg:col-span-6 space-y-6 text-left">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {movie.title}
              </h2>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                  {movie.genres ? movie.genres.join(' / ') : 'N/A'}
                </p>
              </div>
            </div>

            {/* Stats Table / List */}
            <div className="space-y-4 pt-4 border-t border-white/10 max-w-md">
              {/* IMDb */}
              <div className="flex items-center gap-4">
                <span className="bg-[#f3ce13] text-black font-black px-1.5 py-0.5 rounded text-[11px] tracking-tight uppercase shadow-sm">
                  IMDb
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {movie.voteAverage?.toFixed(1) || '7.3'}/10
                  <Star className="size-4 fill-green-500 text-green-500 ml-1" />
                  <span className="text-muted-foreground font-semibold text-xs ml-1">
                    {movie.voteCount ? `${(movie.voteCount / 1000).toFixed(1)}K` : '14.2K'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Similar Movies Grid (2x2) */}
          <div className="md:col-span-12 lg:col-span-3 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground text-left">
              Similar Movies
            </h3>

            {similarMovies.length > 0 ? (
              <div className="grid grid-cols-2 gap-3.5">
                {similarMovies.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => navigate(`/movies/${getSlug(sim.title)}`)}
                    className="rounded-xl overflow-hidden border border-white/10 hover:border-white/30 hover:scale-103 transition-all shadow-lg cursor-pointer aspect-[2/3] relative group"
                    title={sim.title}
                  >
                    <img
                      src={getImageUrl(sim.posterPath)}
                      alt={sim.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-end p-2 transition-opacity duration-300">
                      <span className="text-[10px] font-bold text-white line-clamp-2 text-left">
                        {sim.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic text-left py-4">
                No similar titles found.
              </div>
            )}
          </div>
        </div>

        {/* Storyline card */}
        <div className="rounded-4xl border border-white/10 bg-card/25 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Film className="size-5 text-primary" /> Storyline
            </h3>

            {/* Watchlist Toggle button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isItemInWatchlist(movie) ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => toggleWatchlist(movie)}
                  className={`flex items-center gap-2 font-bold cursor-pointer rounded-full backdrop-blur-xl shadow-lg transition-all ${
                    isItemInWatchlist(movie)
                      ? 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-foreground'
                  }`}
                >
                  {isItemInWatchlist(movie) ? (
                    <BookmarkCheck className="size-4 fill-current text-white animate-bounce" />
                  ) : (
                    <Heart className="size-4 text-primary" />
                  )}
                  <span>{isItemInWatchlist(movie) ? 'Bookmarked' : 'Add to Watchlist'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-background/90 backdrop-blur-md border-white/10"
              >
                <span>
                  {isItemInWatchlist(movie)
                    ? 'Remove this movie from your watchlist'
                    : 'Save this movie to your local watchlist'}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-4 text-left">
            <p className="text-lg text-foreground/90 leading-relaxed font-medium">
              {movie.overview || 'No description exists for this title.'}
            </p>

            {movie.tagline && (
              <p className="text-md italic text-primary/80 border-l-2 border-primary/50 pl-4 py-1">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Cast Carousel Horizontal list */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Award className="size-6 text-primary" /> Top Billed Cast
            </h3>

            <ScrollArea className="w-full whitespace-nowrap rounded-4xl border border-white/10 bg-card/30 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex gap-6 pb-4">
                {movie.cast.map((c, i) => (
                  <div
                    key={i}
                    className="flex w-36 shrink-0 flex-col items-center text-center gap-4 bg-black/20 border border-white/5 p-5 rounded-3xl transition-all duration-300 hover:bg-black/40 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/cast"
                  >
                    <Avatar
                      size="lg"
                      className="h-20 w-20 border-2 border-white/10 shadow-xl group-hover/cast:border-primary/50 transition-colors"
                    >
                      {c.profilePath ? (
                        <AvatarImage
                          src={getImageUrl(c.profilePath)}
                          alt={c.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="font-bold text-lg bg-primary/20 text-primary">
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1.5 w-full">
                      <span className="text-sm font-bold text-foreground truncate block group-hover/cast:text-primary transition-colors">
                        {c.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block italic font-medium">
                        {c.character}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="bg-black/20" />
            </ScrollArea>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
