
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { MOCK_PLAYERS, MOCK_EXPENSES } from "@/lib/store"
import { Wallet, TrendingDown, Beer, Clock, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const currentUser = MOCK_PLAYERS[0] // Lukas Müller (Auditor)
  const teamKasse = MOCK_PLAYERS[2] // Mannschaftskasse
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("")

  useEffect(() => {
    setCurrentDateFormatted(format(new Date(), 'EEEE, d. MMMM', { locale: de }))
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userRole={currentUser.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">{currentDateFormatted}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Top Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Dein Kontostand</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <h2 className={`text-3xl font-bold ${currentUser.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {currentUser.balance.toFixed(2)} €
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Offene Beträge</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Mannschaftskasse</p>
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-emerald-600">
                  {teamKasse.balance.toFixed(2)} €
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Verfügbares Guthaben</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Dein Konsum (Monat)</p>
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                    <Beer className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  12
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Getränkeeinheiten</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Entry */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Getränk erfassen</h3>
            <ExpenseActions isAdmin={currentUser.role === 'auditor'} />
          </div>

          {/* Recent History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Letzte Buchungen</h3>
              <button className="text-sm font-medium text-primary hover:underline">Alle ansehen</button>
            </div>
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {MOCK_EXPENSES.map((expense) => (
                    <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
                          expense.itemType === 'beer' ? 'bg-amber-400' : 'bg-primary'
                        )}>
                          {expense.itemType === 'beer' ? <Beer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{expense.playerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), 'dd.MM.yyyy HH:mm')} • {expense.itemType === 'beer' ? 'Bier' : 'Kasten'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive">
                        - {expense.cost.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
