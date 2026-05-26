import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ChevronLeft, Play } from 'lucide-react'
import { MediaItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MovieDetailProps {
  API_BASE_URL: string
  getImageUrl: (path?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  getSlug: (title?: string) => string
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  API_BASE_URL,
  getImageUrl,
  toggleWatchlist,
  getSlug
}) => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [similarMovies, setSimilarMovies] = useState<MediaItem[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        navigate('/movies')
      } else if (e.key.toLowerCase() === 'w' && movie) {
        e.preventDefault()
        toggleWatchlist(movie)
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault()
        alert('Starting Movie Download...')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [movie, navigate, toggleWatchlist])

  useEffect(() => {
    const fetchMovie = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/movies?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load movies database')
        }
        const result = await response.json()
        const movies: MediaItem[] = result.data || []
        const matchedMovie = movies.find((m) => getSlug(m.title) === slug)

        if (!matchedMovie) {
          const parsedId = parseInt(slug || '', 10)
          if (!isNaN(parsedId)) {
            const detailRes = await fetch(`${API_BASE_URL}/api/movies/${parsedId}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setMovie(detailData)
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

        const others = movies.filter((m) => m.id !== matchedMovie.id)
        const matching = others.filter((m) =>
          m.genres?.some((g) => matchedMovie.genres?.includes(g))
        )
        setSimilarMovies([...matching, ...others].slice(0, 4))

        const detailRes = await fetch(`${API_BASE_URL}/api/movies/${matchedMovie.id}`)
        if (!detailRes.ok) {
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
      <div className="space-y-8 w-full pb-16">
        <Skeleton className="h-[60vh] w-full bg-card rounded-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-32 w-full bg-card rounded-none" />
            <Skeleton className="h-44 w-full bg-card rounded-none" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full bg-card rounded-none" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Movie Details Unavailable
          </h4>
          <p className="text-muted-foreground">{error || 'Unable to retrieve title content.'}</p>
        </div>
        <Button
          onClick={() => navigate('/movies')}
          size="lg"
          className="rounded-none font-bold bg-primary text-primary-foreground hover:bg-primary transition-none cursor-pointer"
        >
          Return to Catalogue
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full pb-24">
      {/* 1. Cinematic Full-Bleed Hero Banner */}
      <div className="relative w-full h-[65vh] min-h-[500px] mb-12">
        <img
          src={getImageUrl(movie.backdropPath)}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <button
          onClick={() => navigate('/movies')}
          className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/70 hover:text-white cursor-pointer font-bold tracking-widest text-sm uppercase transition-none"
        >
          <ChevronLeft className="size-5" /> Back
        </button>

        <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 pb-12 z-20">
          <div className="max-w-4xl space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
              {movie.title}
            </h1>
            <div className="flex items-center gap-3 text-sm md:text-base font-bold text-white/70 uppercase tracking-widest">
              <span>{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</span>
              <span>&bull;</span>
              {movie.runtime && (
                <>
                  <span>
                    {Math.floor(movie.runtime / 60)}H {movie.runtime % 60}M
                  </span>
                  <span>&bull;</span>
                </>
              )}
              <span className="text-primary">{movie.genres ? movie.genres[0] : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-16">
          {/* Actions & Synopsis Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  IMDb Rating
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">
                    {movie.voteAverage?.toFixed(1) || 'N/A'}
                  </span>
                  <Star className="size-5 fill-primary text-primary" />
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-6 text-left">
              <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
                Storyline
              </h3>
              <p className="text-lg text-foreground/80 leading-relaxed font-medium">
                {movie.overview || 'No description available.'}
              </p>
              {movie.tagline && (
                <p className="text-base font-bold italic text-primary/80">{movie.tagline}</p>
              )}
            </div>
          </div>

          {/* Player Embed */}
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Play className="size-5 text-primary fill-primary" />
              Now Playing
            </h3>
            <div className="relative w-full bg-card aspect-video">
              <iframe
                src={`https://vaplayer.ru/embed/movie/${movie.imdbId || movie.tmdbId}?color=ffe0c2&secondaryColor=393028&title=false`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                title={`Watch ${movie.title}`}
              />
            </div>
          </div>

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Cast</h3>
              <div className="flex gap-8 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden">
                {movie.cast.map((c, i) => (
                  <div key={i} className="flex flex-col w-32 shrink-0 gap-3">
                    {c.profilePath ? (
                      <img
                        src={getImageUrl(c.profilePath)}
                        alt={c.name}
                        className="w-full aspect-[2/3] object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-none"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-card flex items-center justify-center">
                        <span className="text-xl font-black text-muted-foreground uppercase">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-foreground leading-tight">
                        {c.name}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest line-clamp-2">
                        {c.character}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Similar</h3>
          {similarMovies.length > 0 ? (
            <div className="flex flex-col gap-6">
              {similarMovies.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => navigate(`/movies/${getSlug(sim.title)}`)}
                  className="group flex gap-4 cursor-pointer"
                >
                  <img
                    src={getImageUrl(sim.posterPath)}
                    alt={sim.title}
                    className="w-24 aspect-[2/3] object-cover"
                  />
                  <div className="flex flex-col justify-center gap-2">
                    <span className="text-base font-bold text-white group-hover:text-primary transition-none leading-tight">
                      {sim.title}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {sim.releaseDate ? new Date(sim.releaseDate).getFullYear() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">No similar titles found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
