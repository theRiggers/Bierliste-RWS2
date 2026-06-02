
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { History, Users, LayoutDashboard, Sparkles, LogOut, Menu, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useStore } from "@/lib/store"
import Image from "next/image"

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Verlauf', href: '/history', icon: History },
  { name: 'Beiträge', href: '/membership-fees', icon: Banknote, auditorOnly: true },
  { name: 'Spieler', href: '/players', icon: Users, auditorOnly: true },
  { name: 'KI-Berichte', href: '/ai-tools', icon: Sparkles, auditorOnly: true },
]

interface SidebarProps {
  userRole?: 'player' | 'auditor'
}

export function Sidebar({ userRole = 'player' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { currentUserProfile } = useStore()

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="RW Sutthausen" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold font-headline text-primary">Bierliste RWS2</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navigation.map((item) => {
          if (item.auditorOnly && userRole !== 'auditor') return null
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
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
        {user && (
          <div className="bg-muted/50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                {currentUserProfile?.name.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{currentUserProfile?.name || user.displayName || 'Benutzer'}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUserProfile?.role === 'auditor' ? 'Kassenprüfer' : 'Spieler'}</p>
              </div>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl py-6"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Abmelden
        </Button>
      </div>
    </div>
  )

  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-white border-r border-border shadow-sm">
      <NavContent />
    </aside>
  )
}

export function MobileNavTrigger({ userRole, rightElement }: { userRole?: 'player' | 'auditor', rightElement?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { currentUserProfile } = useStore()

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }
  
  return (
    <div className="md:hidden flex h-auto min-h-16 flex-col bg-white border-b border-border sticky top-0 z-30 pt-safe-top">
      <div className="flex h-16 items-center justify-between px-4 mt-2">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
              <div className="flex flex-col h-full">
                <div className="flex h-16 items-center px-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="text-xl font-bold font-headline text-primary">Bierliste RWS2</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                  {navigation.map((item) => {
                    if (item.auditorOnly && userRole !== 'auditor') return null
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                        <div className={cn("group flex items-center px-3 py-3.5 text-base font-medium rounded-xl transition-all duration-200", isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                          <item.icon className={cn("mr-4 h-6 w-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                          {item.name}
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <div className="p-4 border-t border-border bg-white">
                  {user && (
                    <div className="bg-muted/50 rounded-2xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm text-sm">
                          {currentUserProfile?.name.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{currentUserProfile?.name || user.displayName || 'Benutzer'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{currentUserProfile?.role === 'auditor' ? 'Kassenprüfer' : 'Spieler'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl py-7">
                    <LogOut className="mr-3 h-5 w-5" /> Abmelden
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-3 ml-2">
            <div className="relative h-6 w-6">
              <Image src="/logo.png" alt="RW Sutthausen" fill className="object-contain" />
            </div>
            <span className="font-bold text-lg text-primary">Bierliste RWS2</span>
          </div>
        </div>
        
        {/* Page Actions Slot */}
        <div className="flex items-center">
          {rightElement}
        </div>
      </div>
    </div>
  )
}
