import React from 'react'
import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom'
import RootLayout from '@/app/layout'

// Auto-discover every page.tsx in the app/ directory at build time
const pages = import.meta.glob<{ default: React.ComponentType }>('./app/**/page.tsx', {
  eager: true
})

// Dynamically build the route array from the file system
const autoRoutes: RouteObject[] = Object.entries(pages).map(([filePath, module]) => {
  // filePath: './app/movies/[slug]/page.tsx'
  // → Strip './app' prefix and '/page.tsx' suffix
  // → Convert Next.js [param] to React Router :param
  const routePath = filePath
    .replace('./app', '') // './app/movies/page.tsx' → '/movies/page.tsx'
    .replace(/\/page\.tsx$/, '') // '/movies/page.tsx' → '/movies'
    .replace(/\[([^\]]+)\]/g, ':$1') // '/movies/[slug]' → '/movies/:slug'
    .replace(/^\//, '') // '/movies' → 'movies' (relative to parent)

  // Home page (app/page.tsx) → index route
  if (!routePath) {
    return { index: true, element: React.createElement(module.default) } as RouteObject
  }

  return { path: routePath, element: React.createElement(module.default) } as RouteObject
})

// Catch-all fallback → redirect to home
autoRoutes.push({ path: '*', element: <Navigate to="/" replace /> })

// Mount all auto-discovered routes inside the root layout
export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: autoRoutes
  }
])
