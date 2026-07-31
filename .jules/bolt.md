## 2024-05-24 - [Optimize Dashboard Re-renders]

**Learning:** In React, passing unmemoized callback functions like `getPoster` or `openMediaDetails` to child components like `MediaRow` causes unnecessary re-renders of large lists, especially when states like `isPlaying`, `playTime`, and `playerVolume` frequently update (e.g. via interval).
**Action:** Wrap complex UI row components in `React.memo` and strictly memoize their function props (`useCallback`) to preserve referential equality and optimize performance.

## 2024-05-25 - [Optimize Multi-Genre Filtering Intersection and Prevent Redundant Fetches]

**Learning:** During multi-genre filtering, the app paginates data locally using `.slice()` on the intersected results. If the list isn't cached across page turns, every page increment triggers redundant parallel `1000`-item network requests per selected genre, tanking performance. Additionally, the list intersection previously rebuilt arrays repeatedly in loops (`filtered = filtered.filter(...)`), creating massive garbage collection overhead.
**Action:** Use a `useRef` to cache the final intersected list and avoid re-fetching data when `currentPage` changes, invalidating only when `selectedGenres` or `sortOption` change. Optimize the intersection logic by selecting the first list as the base (to preserve order) and pre-building an array of `Set<number>` for remaining lists, allowing a single `O(1)` look-up filter pass.
