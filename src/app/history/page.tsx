"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MOCK_PLAYERS, MOCK_EXPENSES } from "@/lib/store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  
  const currentUser = MOCK_PLAYERS[0]

  const filteredExpenses = MOCK_EXPENSES.filter(exp => {
    const matchesSearch = exp.playerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || exp.itemType === filterType
    return matchesSearch && matchesFilter
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userRole={currentUser.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Transaktionsverlauf</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Spieler suchen..." 
                className="pl-10 rounded-xl bg-white" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40 rounded-xl bg-white">
                  <SelectValue placeholder="Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="beer">Einzelne Biere</SelectItem>
                  <SelectItem value="crate">Kisten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
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
                        {format(new Date(expense.date), 'dd.MM.yyyy HH:mm')}
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
                  {filteredExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Keine Buchungen gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
