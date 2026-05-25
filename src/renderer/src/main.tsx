import './assets/main.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollArea } from '@/components/ui/scroll-area'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <ScrollArea className="h-screen w-screen">
          <App />
        </ScrollArea>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
