"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, CRATE_PRICE } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, TrendingUp, AlertTriangle, FileText, Loader2, CheckCircle2, XCircle, ShoppingBag, Send } from "lucide-react"
import { treasurerExpenseSummary, TreasurerExpenseSummaryOutput } from "@/ai/flows/ai-treasurer-expense-summary"
import { highlightOverduePayments, OverduePaymentHighlightOutput } from "@/ai/flows/ai-overdue-payment-highlight-flow"
import { parseTransactions, ParseTransactionsOutput } from "@/ai/flows/ai-parse-transactions"
import { draftClubhousePayment } from "@/ai/flows/ai-clubhouse-payment-draft"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { de } from "date-fns/locale"

export default function AiToolsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { players, expenses, recordPayment, loading: storeLoading } = useStore()
  const [loading, setLoading] = useState<string | null>(null)
  
  // States for results
  const [expenseSummary, setExpenseSummary] = useState<TreasurerExpenseSummaryOutput | null>(null)
  const [overdueHighlight, setOverdueHighlight] = useState<OverduePaymentHighlightOutput | null>(null)
  const [clubhouseDraft, setClubhouseDraft] = useState<string | null>(null)
  
  // Transaction Parser States
  const [rawText, setRawText] = useState("")
  const [parsedResults, setParsedResults] = useState<ParseTransactionsOutput | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Monthly Crate Stats
  const currentMonthCrates = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      return e.itemType === 'crate' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const crateCount = currentMonthCrates.length;
  const crateTotalAmount = crateCount * CRATE_PRICE;

  const handleAiError = (error: any, toolName: string) => {
    console.error(`AI Error (${toolName}):`, error);
    const message = error?.message?.toLowerCase() || "";
    
    if (message.includes("resource_exhausted") || message.includes("429") || message.includes("quota")) {
      toast({
        variant: "destructive",
        title: "KI-Limit erreicht",
        description: "Das Kontingent für die KI ist für heute erschöpft oder die Abrechnung ist nicht aktiv. Bitte später erneut versuchen."
      });
    } else {
      toast({
        variant: "destructive",
        title: "KI-Fehler",
        description: "Es gab ein Problem bei der Verarbeitung durch die KI. Bitte versuche es noch einmal."
      });
    }
  }

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const generateExpenseSummary = async () => {
    setLoading('summary')
    try {
      const formattedExpenses = expenses.map(e => ({
        playerId: e.playerId,
        playerName: e.playerName,
        itemType: e.itemType,
        cost: e.cost,
        date: e.date
      }))
      const result = await treasurerExpenseSummary({ expenses: formattedExpenses })
      setExpenseSummary(result)
    } catch (err) {
      handleAiError(err, "Expense Summary")
    } finally {
      setLoading(null)
    }
  }

  const generateOverdueHighlight = async () => {
    setLoading('overdue')
    try {
      const formattedPlayers = players.map(p => ({
        id: p.id,
        name: p.name,
        balance: p.balance
      }))
      const result = await highlightOverduePayments(formattedPlayers)
      setOverdueHighlight(result)
    } catch (err) {
      handleAiError(err, "Overdue Highlight")
    } finally {
      setLoading(null)
    }
  }

  const handleParseTransactions = async () => {
    if (!rawText.trim()) return
    setLoading('parse')
    try {
      const playerList = players.filter(p => p.email !== 'kasse@kickoff.de').map(p => ({ id: p.id, name: p.name }))
      const result = await parseTransactions({ rawText, players: playerList })
      setParsedResults(result)
    } catch (err) {
      handleAiError(err, "Transaction Parser")
    } finally {
      setLoading(null)
    }
  }

  const handleDraftClubhousePayment = async () => {
    setLoading('clubhouse')
    try {
      const monthName = format(new Date(), 'MMMM', { locale: de });
      const result = await draftClubhousePayment({
        crateCount,
        totalAmount: crateTotalAmount,
        monthName
      });
      setClubhouseDraft(result.draftMessage);
    } catch (err) {
      handleAiError(err, "Clubhouse Draft")
    } finally {
      setLoading(null)
    }
  }

  const handleConfirmPayment = (payment: any) => {
    recordPayment(payment.playerId, payment.amount)
    if (parsedResults) {
      setParsedResults({
        ...parsedResults,
        identifiedPayments: parsedResults.identifiedPayments.filter(p => p !== payment)
      })
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      <MobileNavTrigger userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            KI-Berichte & Automatisierung
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Team-Ausgaben Analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Button onClick={generateExpenseSummary} disabled={loading === 'summary'} className="w-full rounded-xl cyan-glow text-xs">
                  {loading === 'summary' ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Bericht erstellen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-destructive/5">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Überfällige Zahlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Button variant="outline" onClick={generateOverdueHighlight} disabled={loading === 'overdue'} className="w-full rounded-xl border-destructive text-destructive text-xs">
                  {loading === 'overdue' ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                  Fokus-Check
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden border-t-4 border-t-amber-500">
              <CardHeader className="bg-amber-50">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-700">
                  <ShoppingBag className="h-4 w-4" />
                  Kisten-Kasse (Vereinsheim)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Diesen Monat ({format(new Date(), 'MMMM', { locale: de })})</p>
                  <p className="text-xl font-bold">{crateCount} Kisten / {crateTotalAmount.toFixed(2)} €</p>
                </div>
                <Button 
                  onClick={handleDraftClubhousePayment} 
                  disabled={loading === 'clubhouse' || crateCount === 0}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-xs"
                >
                  {loading === 'clubhouse' ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  Abrechnung entwerfen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden md:col-span-2">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="flex items-center gap-2 text-sm text-emerald-700">
                  <FileText className="h-4 w-4" />
                  Zahlungs-Auto-Import
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground mb-4 italic">Kopiere PayPal-Texte hier hinein, um Zahlungen automatisch zu erkennen.</p>
                <Textarea 
                  placeholder="Text von PayPal/Bank hier einfügen..." 
                  className="mb-4 text-xs h-24 rounded-xl"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <Button 
                  onClick={handleParseTransactions} 
                  disabled={loading === 'parse' || !rawText}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  {loading === 'parse' ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Text analysieren
                </Button>
              </CardContent>
            </Card>
          </div>

          {clubhouseDraft && (
            <Card className="border-none shadow-xl rounded-2xl bg-white animate-in fade-in slide-in-from-bottom-4 border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg">Entwurf: Vereinsheim-Abrechnung</CardTitle>
                <CardDescription>Kopiere diesen Text für die WhatsApp-Gruppe oder E-Mail.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-amber-50 rounded-xl whitespace-pre-wrap text-sm italic border border-amber-100">
                  {clubhouseDraft}
                </div>
                <Button className="mt-4 rounded-xl w-full bg-amber-600" onClick={() => {
                  navigator.clipboard.writeText(clubhouseDraft);
                }}>
                  Text kopieren
                </Button>
              </CardContent>
            </Card>
          )}

          {parsedResults && (
            <Card className="border-none shadow-xl rounded-2xl bg-white animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Erkannte Zahlungen
                </CardTitle>
                <CardDescription>Bitte prüfe die Beträge und bestätige die Buchung.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {parsedResults.identifiedPayments.map((p, idx) => (
                    <div key={idx} className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{p.playerName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.date} • Sicherheit: {(p.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600">+{p.amount.toFixed(2)} €</span>
                        <Button size="sm" onClick={() => handleConfirmPayment(p)} className="rounded-lg h-8 bg-emerald-600 hover:bg-emerald-700">
                          Buchen
                        </Button>
                      </div>
                    </div>
                  ))}
                  {parsedResults.identifiedPayments.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground italic text-sm">Keine eindeutigen Zahlungen gefunden.</p>
                  )}
                </div>

                {parsedResults.unmatchedLines.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      Nicht zugeordnete Zeilen
                    </h4>
                    <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                      {parsedResults.unmatchedLines.map((line, idx) => (
                        <p key={idx} className="text-[10px] text-muted-foreground truncate">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {expenseSummary && (
            <Card className="border-none shadow-xl rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">KI-Bericht: Team-Ausgaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-xl italic text-foreground leading-relaxed text-sm">
                  "{expenseSummary.overallSummary}"
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {expenseSummary.playerSummaries.map((p) => (
                    <div key={p.playerId} className="p-3 border border-border rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{p.playerName}</span>
                        <span className="text-destructive font-bold text-sm">-{p.totalOwed.toFixed(2)}€</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.itemBreakdown.map(i => `${i.quantity}x ${i.itemType}`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
