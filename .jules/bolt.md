## 2024-05-24 - [Optimize Dashboard Re-renders]

**Learning:** In React, passing unmemoized callback functions like `getPoster` or `openMediaDetails` to child components like `MediaRow` causes unnecessary re-renders of large lists, especially when states like `isPlaying`, `playTime`, and `playerVolume` frequently update (e.g. via interval).
**Action:** Wrap complex UI row components in `React.memo` and strictly memoize their function props (`useCallback`) to preserve referential equality and optimize performance.

## 2024-05-25 - [Optimize Multi-Genre Filtering Intersection and Prevent Redundant Fetches]

**Learning:** During multi-genre filtering, the app paginates data locally using `.slice()` on the intersected results. If the list isn't cached across page turns, every page increment triggers redundant parallel `1000`-item network requests per selected genre, tanking performance. Additionally, the list intersection previously rebuilt arrays repeatedly in loops (`filtered = filtered.filter(...)`), creating massive garbage collection overhead.
**Action:** Use a `useRef` to cache the final intersected list and avoid re-fetching data when `currentPage` changes, invalidating only when `selectedGenres` or `sortOption` change. Optimize the intersection logic by selecting the first list as the base (to preserve order) and pre-building an array of `Set<number>` for remaining lists, allowing a single `O(1)` look-up filter pass.

## 2025-03-01 - [Optimize List Lookups & Grid Re-renders]

**Learning:** When dealing with large arrays (like `watchlist`) and checking membership inside `.map()` loops for grid rendering (e.g. `movies.map(m => isInWatchlist(m))`), using `.some()` results in O(N*M) operations, crippling performance. Furthermore, passing inline closures like `onNavigate={() => navigate(...)}` to list items defeats React's rendering optimizations, causing the entire grid to re-render every time an interval ticks (like the 7-second featured carousel interval).
**Action:** Always pre-compute a `Set` within `useMemo` for O(1) membership lookups across large lists. Additionally, strictly memoize child grid components with `React.memo` and pass them stable `useCallback` functions that expect the `item` as a parameter instead of passing inline closures.
