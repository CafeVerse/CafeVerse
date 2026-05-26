import './assets/main.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollArea } from '@/components/ui/scroll-area'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ScrollArea className="h-screen w-screen">
        <RouterProvider router={router} />
      </ScrollArea>
    </ThemeProvider>
  </StrictMode>
)
