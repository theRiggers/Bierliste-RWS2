"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Beer, History, Users, LayoutDashboard, Sparkles, LogOut, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Verlauf', href: '/history', icon: History },
  { name: 'Spieler', href: '/players', icon: Users, auditorOnly: true },
  { name: 'KI-Berichte', href: '/ai-tools', icon: Sparkles, auditorOnly: true },
]

interface SidebarProps {
  userRole?: 'player' | 'auditor'
}

export function Sidebar({ userRole = 'player' }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-md">
            <Beer className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold font-headline text-primary">Kickoff Kasse</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navigation.map((item) => {
          if (item.auditorOnly && userRole !== 'auditor') return null
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
              <div className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-secondary text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-border bg-white">
        <div className="bg-muted/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-sm">
              LM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Lukas Müller</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole === 'auditor' ? 'Kassenprüfer' : 'Spieler'}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl py-6">
          <LogOut className="mr-3 h-5 w-5" />
          Abmelden
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-full w-64 flex-col bg-white border-r border-border shadow-sm">
        <NavContent />
      </aside>

      {/* Mobile Sidebar (Trigger is handled in pages) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  )
}

export function MobileNavTrigger({ userRole }: { userRole?: 'player' | 'auditor' }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  
  return (
    <div className="md:hidden flex h-16 items-center px-4 bg-white border-b border-border sticky top-0 z-30">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex h-16 items-center px-6 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded-lg shadow-md">
                  <Beer className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold font-headline text-primary">Kickoff Kasse</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navigation.map((item) => {
                if (item.auditorOnly && userRole !== 'auditor') return null
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                    <div className={cn(
                      "group flex items-center px-3 py-3.5 text-base font-medium rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-secondary text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                      <item.icon className={cn(
                        "mr-4 h-6 w-6 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="p-4 border-t border-border bg-white">
              <div className="bg-muted/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-sm text-sm">
                    LM
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Lukas Müller</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole === 'auditor' ? 'Kassenprüfer' : 'Spieler'}</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl py-7">
                <LogOut className="mr-3 h-5 w-5" />
                Abmelden
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2 ml-2">
        <Beer className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg text-primary">Kickoff Kasse</span>
      </div>
    </div>
  )
}
