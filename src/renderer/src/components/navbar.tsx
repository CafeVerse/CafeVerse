import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Layers, Film, Tv, Bookmark, Menu, Coffee } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  watchlistCount: number
}

interface SidebarContentProps {
  watchlistCount: number
  setOpen: (open: boolean) => void
}

const NavItem: React.FC<{
  to: string
  icon: React.ElementType
  label: string
  count?: number
  onClick: () => void
  end?: boolean
}> = ({ to, icon: Icon, label, count, onClick, end }) => (
  <NavLink
    to={to}
    onClick={onClick}
    end={end}
    className={({ isActive }) =>
      `flex w-full items-center gap-4 px-6 py-3.5 text-sm font-bold transition-all duration-500 relative group/nav ${
        isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Architectural Active Background */}
        {isActive && (
          <div className="absolute inset-y-0 left-0 right-4 bg-linear-to-r from-primary/[0.08] to-transparent rounded-r-2xl animate-in slide-in-from-left-2 duration-500" />
        )}

        {/* Refined Indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_20px_rgba(var(--primary),0.8)] z-20" />
        )}

        <Icon
          className={`size-5 relative z-10 transition-all duration-500 ${
            isActive
              ? 'text-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
              : 'group-hover/nav:text-primary group-hover/nav:scale-110'
          }`}
        />
        <span className="flex-1 text-left tracking-tight font-extrabold relative z-10">
          {label}
        </span>

        {count !== undefined && count > 0 && (
          <div
            className={`relative z-10 flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-black transition-all duration-500 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground/40'
            }`}
          >
            {count}
          </div>
        )}
      </>
    )}
  </NavLink>
)

const SidebarContent: React.FC<SidebarContentProps> = ({ watchlistCount, setOpen }) => (
  <div className="flex h-full flex-col bg-[#0c0a09]/60 backdrop-blur-3xl relative overflow-hidden border-r border-white/[0.02]">
    {/* Architectural Rim Light */}
    <div className="absolute inset-y-0 right-0 w-[1px] bg-linear-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

    {/* Subdued Brand Glow */}
    <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-primary/[0.02] blur-[120px] pointer-events-none" />

    {/* Sidebar Header */}
    <div className="flex h-36 items-center px-12 shrink-0 relative z-10">
      <div className="flex items-center gap-5 group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/5 shadow-2xl group-hover:-translate-y-1 transition-transform duration-700">
            <Coffee className="size-7 text-primary" />
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic select-none leading-none">
            Café<span className="text-primary not-italic">Verse</span>
          </h2>
        </div>
      </div>
    </div>

    {/* Navigation Options */}
    <nav className="flex-1 py-4 overflow-y-auto relative z-10 scrollbar-none space-y-8">
      {/* SECTION: BROWSE */}
      <div className="space-y-1.5">
        <div className="px-12 mb-4">
          <span className="text-[10px] font-black text-white/10 tracking-[0.3em] uppercase select-none">
            Browse
          </span>
        </div>
        <div className="space-y-0.5">
          <NavItem to="/" icon={Layers} label="Dashboard" onClick={() => setOpen(false)} end />
          <NavItem to="/movies" icon={Film} label="Movies" onClick={() => setOpen(false)} />
          <NavItem to="/tvshows" icon={Tv} label="TV Shows" onClick={() => setOpen(false)} />
        </div>
      </div>

      {/* SECTION: COLLECTION */}
      <div className="space-y-1.5">
        <div className="px-12 mb-4">
          <span className="text-[10px] font-black text-white/10 tracking-[0.3em] uppercase select-none">
            Collection
          </span>
        </div>
        <div className="space-y-0.5">
          <NavItem
            to="/watchlist"
            icon={Bookmark}
            label="Watchlist"
            count={watchlistCount}
            onClick={() => setOpen(false)}
          />
        </div>
      </div>
    </nav>

    {/* Footer - Pure Architectural Detail */}
    <div className="p-12 relative z-10">
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
        <div className="h-px flex-1 bg-linear-to-r from-white/5 to-transparent" />
      </div>
    </div>
  </div>
)

export const Navbar: React.FC<NavbarProps> = ({ watchlistCount }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center p-4 fixed top-0 left-0 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/60 backdrop-blur-xl border-white/5 text-foreground shrink-0 cursor-pointer rounded-xl shadow-2xl"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-72 flex-col justify-start border-r border-border/40 bg-transparent p-0"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent watchlistCount={watchlistCount} setOpen={setOpen} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex relative w-72 flex-col shrink-0 h-full">
        <SidebarContent watchlistCount={watchlistCount} setOpen={setOpen} />
      </aside>
    </>
  )
}

export default Navbar
