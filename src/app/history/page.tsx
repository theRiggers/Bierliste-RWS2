
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore } from "@/lib/store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const { players, expenses } = useStore()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentUser = players[0]

  const formatDate = (date: string | Date, pattern: string) => {
    if (!mounted) return ""
    return format(new Date(date), pattern, { locale: de })
  }

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.playerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || exp.itemType === filterType
    return matchesSearch && matchesFilter
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUser.role} />
      <MobileNavTrigger userRole={currentUser.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Transaktionsverlauf</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden">
            <h1 className="text-2xl font-bold text-primary font-headline mb-4">Verlauf</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Spieler suchen..." 
                className="pl-10 h-12 md:h-10 rounded-xl bg-white text-base md:text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40 h-12 md:h-10 rounded-xl bg-white text-base md:text-sm">
                  <SelectValue placeholder="Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="beer">Bier</SelectItem>
                  <SelectItem value="crate">Kiste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="md:hidden">
                <div className="divide-y divide-border">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 flex justify-between items-center active:bg-muted/20">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{expense.playerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {mounted ? formatDate(expense.date, 'dd.MM.yy HH:mm') : "--.--.-- --:--"} • {expense.itemType === 'beer' ? 'Bier' : 'Kiste'}
                        </p>
                      </div>
                      <span className="font-bold text-destructive whitespace-nowrap ml-2">
                        -{expense.cost.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">
                      Keine Buchungen gefunden.
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">Datum</TableHead>
                      <TableHead className="font-bold">Spieler</TableHead>
                      <TableHead className="font-bold">Artikel</TableHead>
                      <TableHead className="text-right font-bold">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-muted-foreground">
                          {mounted ? formatDate(expense.date, 'dd.MM.yyyy HH:mm') : "--.--.---- --:--"}
                        </TableCell>
                        <TableCell className="font-medium">{expense.playerName}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            expense.itemType === 'beer' ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                          )}>
                            {expense.itemType === 'beer' ? 'Bier' : 'Kiste'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          -{expense.cost.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
