"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MOCK_PLAYERS, MOCK_EXPENSES } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, TrendingUp, AlertTriangle, FileText, Send, Loader2 } from "lucide-react"
import { treasurerExpenseSummary, TreasurerExpenseSummaryOutput } from "@/ai/flows/ai-treasurer-expense-summary"
import { highlightOverduePayments, OverduePaymentHighlightOutput } from "@/ai/flows/ai-overdue-payment-highlight-flow"
import { Badge } from "@/components/ui/badge"

export default function AiToolsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [expenseSummary, setExpenseSummary] = useState<TreasurerExpenseSummaryOutput | null>(null)
  const [overdueHighlight, setOverdueHighlight] = useState<OverduePaymentHighlightOutput | null>(null)

  const generateExpenseSummary = async () => {
    setLoading('summary')
    try {
      const expenses = MOCK_EXPENSES.map(e => ({
        playerId: e.playerId,
        playerName: e.playerName,
        itemType: e.itemType,
        cost: e.cost,
        date: e.date
      }))
      const result = await treasurerExpenseSummary({ expenses })
      setExpenseSummary(result)
    } finally {
      setLoading(null)
    }
  }

  const generateOverdueHighlight = async () => {
    setLoading('overdue')
    try {
      const players = MOCK_PLAYERS.map(p => ({
        id: p.id,
        name: p.name,
        balance: p.balance
      }))
      const result = await highlightOverduePayments(players)
      setOverdueHighlight(result)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            KI-Berichte & Analysen
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Team-Ausgaben Analyse
                </CardTitle>
                <CardDescription>Detaillierte Übersicht über Konsumverhalten und Trends.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button 
                  onClick={generateExpenseSummary} 
                  disabled={loading === 'summary'}
                  className="w-full rounded-xl cyan-glow"
                >
                  {loading === 'summary' ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Zusammenfassung erstellen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-destructive/5">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Überfällige Zahlungen
                </CardTitle>
                <CardDescription>Identifiziere Spieler mit hohem Zahlungsrückstand.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button 
                  variant="outline"
                  onClick={generateOverdueHighlight} 
                  disabled={loading === 'overdue'}
                  className="w-full rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-white"
                >
                  {loading === 'overdue' ? <Loader2 className="animate-spin mr-2" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                  Highlights identifizieren
                </Button>
              </CardContent>
            </Card>
          </div>

          {expenseSummary && (
            <Card className="border-none shadow-xl rounded-2xl bg-white animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle className="text-xl">KI-Bericht: Team-Ausgaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-xl italic text-foreground leading-relaxed">
                  "{expenseSummary.overallSummary}"
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {expenseSummary.playerSummaries.map((p) => (
                    <div key={p.playerId} className="p-4 border border-border rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">{p.playerName}</span>
                        <span className="text-destructive font-bold">-{p.totalOwed.toFixed(2)}€</span>
                      </div>
                      <div className="text-xs space-y-1">
                        {p.itemBreakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-muted-foreground">
                            <span>{item.quantity}x {item.itemType}</span>
                            <span>{item.totalCost.toFixed(2)}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {expenseSummary.paymentRequestMessages.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      Nachrichtenvorschläge
                    </h4>
                    <div className="space-y-3">
                      {expenseSummary.paymentRequestMessages.map((msg, idx) => (
                        <div key={idx} className="p-3 bg-secondary text-primary-foreground/10 text-sm rounded-lg border border-primary/20">
                          {msg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {overdueHighlight && (
            <Card className="border-none shadow-xl rounded-2xl bg-white animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Fokus: Ausstehende Beträge
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-foreground font-medium">{overdueHighlight.summaryMessage}</p>
                <div className="divide-y divide-border">
                  {overdueHighlight.overduePlayers.map((p, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <span className="font-semibold">{p.playerName}</span>
                      <Badge variant="destructive" className="rounded-lg">
                        {p.overdueAmount.toFixed(2)} €
                      </Badge>
                    </div>
                  ))}
                  {overdueHighlight.overduePlayers.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground italic">
                      Keine kritischen überfälligen Zahlungen gefunden.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}