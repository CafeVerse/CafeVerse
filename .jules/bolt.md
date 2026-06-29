## 2024-05-24 - [Optimize Dashboard Re-renders]

**Learning:** In React, passing unmemoized callback functions like `getPoster` or `openMediaDetails` to child components like `MediaRow` causes unnecessary re-renders of large lists, especially when states like `isPlaying`, `playTime`, and `playerVolume` frequently update (e.g. via interval).
**Action:** Wrap complex UI row components in `React.memo` and strictly memoize their function props (`useCallback`) to preserve referential equality and optimize performance.
