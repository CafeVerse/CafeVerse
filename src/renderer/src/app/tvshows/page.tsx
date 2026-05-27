import React, { useState, useEffect, useMemo } from 'react'
import { Search, X, Loader2, Star, ChevronLeft, ChevronRight, Tv } from 'lucide-react'
import { MediaItem, MetaPagination } from '@/types'
import { useOutletContext } from 'react-router-dom'
import { AppContextType } from '../layout'

export default function TvShowsPage(): React.JSX.Element {
  const { API_BASE_URL, getImageUrl, isItemInWatchlist, getSlug } =
    useOutletContext<AppContextType>()

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('popularity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(12)

  // API Data States
  const [allMedia, setAllMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  // Fetch all TV shows once on mount
  useEffect(() => {
    const fetchAllTvShows = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/tvshows?page=1&limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load TV shows')
        }

        const result = await response.json()
        let items: MediaItem[] = result.data || []

        const meta = result.meta as MetaPagination
        if (meta && meta.totalPages > 1) {
          const promises: Promise<{ data?: MediaItem[] }>[] = []
          for (let p = 2; p <= meta.totalPages; p++) {
            promises.push(
              fetch(`${API_BASE_URL}/api/tvshows?page=${p}&limit=100`).then((res) =>
                res.ok ? res.json() : { data: [] }
              )
            )
          }
          const results = await Promise.all(promises)
          results.forEach((res) => {
            if (res.data) {
              items = items.concat(res.data)
            }
          })
        }

        const mapped = items.map((m: MediaItem) => ({
          ...m,
          slug: m.slug || getSlug(m.title || m.name)
        }))

        setAllMedia(mapped)

        // Extract available genres
        const genresSet = new Set<string>()
        mapped.forEach((item) => {
          if (item.genres && Array.isArray(item.genres)) {
            item.genres.forEach((g) => {
              if (g) genresSet.add(g)
            })
          }
        })
        setAvailableGenres(Array.from(genresSet).sort())
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Something went wrong fetching catalogue'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTvShows()
  }, [API_BASE_URL, getSlug])

  // Client-side search, filtering, sorting, and pagination
  const filteredAndSortedMedia = useMemo(() => {
    let result = [...allMedia]

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (item) =>
          (item.title || item.name || '').toLowerCase().includes(q) ||
          (item.originalTitle || item.originalName || '').toLowerCase().includes(q) ||
          (item.overview || '').toLowerCase().includes(q)
      )
    }

    // 2. Multiple Genres Filter (AND match: TV show must contain ALL selected genres)
    if (selectedGenres.length > 0) {
      result = result.filter((item) => {
        const itemGenres = item.genres || []
        return selectedGenres.every((sg) => itemGenres.includes(sg))
      })
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[sortBy as keyof MediaItem] as string | number | undefined
      let valB = b[sortBy as keyof MediaItem] as string | number | undefined

      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }

      if (sortBy === 'release_date' || sortBy === 'first_air_date' || sortBy === 'created_at') {
        const dateA = valA ? new Date(valA).getTime() : 0
        const dateB = valB ? new Date(valB).getTime() : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }

      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })

    return result
  }, [allMedia, searchQuery, selectedGenres, sortBy, sortOrder])

  // Derive current page media items
  const mediaList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedMedia.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedMedia, currentPage, itemsPerPage])

  // Derive pagination metadata
  const pagination = useMemo<MetaPagination | null>(() => {
    const totalItems = filteredAndSortedMedia.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    return {
      currentPage,
      itemCount: mediaList.length,
      itemsPerPage,
      totalItems,
      totalPages
    }
  }, [filteredAndSortedMedia.length, mediaList.length, currentPage, itemsPerPage])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* FILTERS CONTROL PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/45 border border-border p-5 rounded-2xl backdrop-blur-md">
        {/* Search query input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="size-4 text-muted-foreground" />
          </span>
          <input
            type="text"
            placeholder="Search TV shows..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full bg-muted/70 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-muted/70 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 cursor-pointer"
            >
              <option value="popularity">Popularity</option>
              <option value="vote_average">User Score</option>
              <option value="first_air_date">First Air Date</option>
              <option value="created_at">Date Imported</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc')
                setCurrentPage(1)
              }}
              className="bg-muted/70 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 cursor-pointer"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {selectedGenres.length > 0 && (
            <button
              onClick={() => {
                setSelectedGenres([])
                setCurrentPage(1)
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors cursor-pointer"
            >
              Reset Genre Filter <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Genre Pills Row */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-xs font-bold text-muted-foreground mr-2">Genres:</span>
        <button
          onClick={() => {
            setSelectedGenres([])
            setCurrentPage(1)
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
            selectedGenres.length === 0
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          All
        </button>
        {availableGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre)
          return (
            <button
              key={genre}
              onClick={() => {
                setSelectedGenres((prev) =>
                  prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                )
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 border border-transparent'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {genre}
            </button>
          )
        })}
      </div>

      {/* CATALOG GRID BODY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">
            Querying CaféVerse database...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <X className="size-10 text-destructive bg-destructive/10 p-2.5 rounded-full border border-destructive/20" />
          <h4 className="text-base font-bold text-foreground">Failed to load TV shows</h4>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
      ) : mediaList.length > 0 ? (
        <div className="space-y-8">
          {/* Grid list of posters */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col gap-3 rounded-2xl bg-card/40 border border-border p-3 transition-all duration-300 hover:bg-accent/60 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  />

                  {/* Score Badge */}
                  <div className="absolute top-2.5 right-2.5 flex h-7 items-center gap-0.5 rounded-lg bg-card/85 px-2 text-xs font-bold text-primary border border-border/80 backdrop-blur-sm">
                    <Star className="size-3.5 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>

                  {/* Watchlisted tiny badge indicator */}
                  {isItemInWatchlist(item) && (
                    <div className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-sm border border-primary/20 shadow-md">
                      <Star className="size-3.5 fill-primary-foreground text-primary-foreground" />
                    </div>
                  )}

                  {/* Info Overlay Panel */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <span className="text-[10px] text-primary uppercase tracking-widest font-extrabold mb-1">
                      {item.status}
                    </span>
                    <h5 className="text-xs font-bold text-foreground line-clamp-2">
                      {item.title || item.name}
                    </h5>
                  </div>
                </div>

                {/* Title descriptions */}
                <div className="flex flex-col px-1">
                  <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mt-0.5">
                    <span>
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] bg-card border border-border px-2 py-0.5 rounded text-muted-foreground">
                      TV Series
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MODERN PAGINATION BAR */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-6 px-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}{' '}
                of {pagination.totalItems} titles
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.currentPage === 1}
                  onClick={() => setCurrentPage(pagination.currentPage - 1)}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/30 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map(
                    (pNum) => {
                      if (
                        pNum === 1 ||
                        pNum === pagination.totalPages ||
                        Math.abs(pNum - pagination.currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={pNum}
                            onClick={() => setCurrentPage(pNum)}
                            className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              pagination.currentPage === pNum
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                          >
                            {pNum}
                          </button>
                        )
                      }
                      if (pNum === 2 || pNum === pagination.totalPages - 1) {
                        return (
                          <span
                            key={pNum}
                            className="text-xs text-muted-foreground px-1 select-none"
                          >
                            ...
                          </span>
                        )
                      }
                      return null
                    }
                  )}
                </div>

                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(pagination.currentPage + 1)}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/30 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-card/20 border border-dashed border-border rounded-2xl">
          <Tv className="size-10 text-muted-foreground" />
          <h4 className="text-base font-bold text-foreground">No matches found</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            No items in the catalogue matched your active search term or selected genres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedGenres([])
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Clear Search Filters
          </button>
        </div>
      )}
    </div>
  )
}
