
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { Wallet, Beer, Clock, ArrowUpRight, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useUser()
  const { players, expenses, currentUserProfile, loading: storeLoading } = useStore()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login")
    }
  }, [mounted, authLoading, user, router])

  if (!mounted || authLoading || storeLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Falls der API-Key noch fehlt (Platzhalter-Check)
  const isConfigMissing = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "env-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  if (!user) return null

  if (!currentUserProfile) {
    return (
      <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
        <Sidebar userRole="player" />
        <MobileNavTrigger userRole="player" />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Beer className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Profil nicht gefunden</h2>
          <p className="text-muted-foreground max-w-md">
            Dein Konto ({user.email}) ist noch keinem Spielerprofil zugeordnet. 
            Bitte wende dich an den Kassenprüfer, um dich registrieren zu lassen.
          </p>
        </main>
      </div>
    )
  }

  const teamKasse = players.find(p => p.email === 'kasse@kickoff.de') || { balance: 0 }

  const formatDate = (date: string | Date, pattern: string) => {
    try {
      return format(new Date(date), pattern, { locale: de })
    } catch (e) {
      return "Datum unbekannt"
    }
  }

  const monthlyConsumptionCount = expenses.filter(e => 
    e.playerId === currentUserProfile.id && 
    new Date(e.date).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {formatDate(new Date(), 'EEEE, d. MMMM')}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {isConfigMissing && (
            <Alert variant="destructive" className="rounded-xl border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Konfiguration fehlt</AlertTitle>
              <AlertDescription>
                Bitte trage deinen Firebase API-Key in der Datei <code>src/firebase/config.ts</code> ein, damit der Login funktioniert.
              </AlertDescription>
            </Alert>
          )}

          <div className="md:hidden pt-2">
            <p className="text-sm font-medium text-muted-foreground px-1">
              {formatDate(new Date(), 'EEEE, d. MMMM')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Dein Kontostand</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <h2 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  currentUserProfile.balance < 0 ? 'text-destructive' : 'text-emerald-600'
                )}>
                  {currentUserProfile.balance.toFixed(2)} €
                </h2>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Offene Beträge</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Mannschaftskasse</p>
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-600">
                  {teamKasse.balance.toFixed(2)} €
                </h2>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Verfügbares Guthaben</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Dein Konsum (Monat)</p>
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                    <Beer className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {monthlyConsumptionCount}
                </h2>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Getränkeeinheiten</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground px-1">Getränk erfassen</h3>
            <ExpenseActions currentUserId={currentUserProfile.id} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-semibold text-foreground">Letzte Buchungen</h3>
            </div>
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-muted/30 active:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white",
                          expense.itemType === 'beer' ? 'bg-amber-400' : 'bg-primary'
                        )}>
                          {expense.itemType === 'beer' ? <Beer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{expense.playerName}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {formatDate(expense.date, 'dd.MM. HH:mm')} • {expense.itemType === 'beer' ? 'Bier' : 'Kasten'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive whitespace-nowrap ml-2">
                        - {expense.cost.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic">
                      Noch keine Buchungen vorhanden.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
