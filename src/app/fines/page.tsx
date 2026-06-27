
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Fine, Player } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scale, Plus, Trash2, Loader2, UserCircle, AlertCircle, CheckCircle2, History, Share2, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FinesPage() {
  const { toast } = useToast()
  const { players, fines, fineCatalog, addFine, markFineAsPaid, deleteFine, currentUserProfile, loading: storeLoading } = useStore()
  const [mounted, setMounted] = useState(false)
  
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [selectedFineTypeId, setSelectedFineTypeId] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Filter fines for display
  const unpaidFines = useMemo(() => fines.filter(f => !f.isPaid), [fines]);
  const paidFines = useMemo(() => fines.filter(f => f.isPaid), [fines]);

  // Auto-fill amount when fine type changes
  useEffect(() => {
    const selectedFine = fineCatalog.find(f => f.id === selectedFineTypeId)
    if (selectedFine) {
      setCustomAmount(selectedFine.amount.toString())
    }
  }, [selectedFineTypeId, fineCatalog])

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdmin = currentUserProfile?.roles?.includes('admin')
  const isKassenwart = currentUserProfile?.roles?.includes('kassenwart')
  const isStrafenwart = currentUserProfile?.roles?.includes('strafenwart') || isAdmin || isKassenwart

  if (!currentUserProfile || !isStrafenwart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const exportFinesList = () => {
    if (unpaidFines.length === 0) {
      toast({ title: "Keine offenen Strafen", description: "Alle Strafen wurden bereits beglichen." });
      return;
    }

    const dateStr = format(new Date(), 'dd.MM.yyyy', { locale: de });
    let text = `⚖️ *Offene Strafen - RWS2*\n(Stand: ${dateStr})\n\n`;

    // Group by player
    const playerFines: Record<string, Fine[]> = {};
    unpaidFines.forEach(f => {
      if (!playerFines[f.playerName]) playerFines[f.playerName] = [];
      playerFines[f.playerName].push(f);
    });

    Object.entries(playerFines).sort((a, b) => a[0].localeCompare(b[0])).forEach(([playerName, items]) => {
      const total = items.reduce((sum, i) => sum + i.amount, 0);
      text += `• *${playerName}: ${total.toFixed(2).replace('.', ',')} €*\n`;
      items.forEach(i => {
        text += `  - ${i.reason} (${i.amount.toFixed(2).replace('.', ',')} €)\n`;
      });
      text += `\n`;
    });

    const totalAll = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
    text += `*Gesamtsumme offen: ${totalAll.toFixed(2).replace('.', ',')} €*`;
    text += `\n\nBitte zeitnah begleichen! 🤝`;

    navigator.clipboard.writeText(text);
    toast({ title: "Liste kopiert", description: "Der WhatsApp-Text ist in der Zwischenablage." });
  };

  const handleAddFine = async () => {
    const val = parseFloat(customAmount)
    const qty = parseInt(quantity)
    const fineType = fineCatalog.find(f => f.id === selectedFineTypeId)
    
    if (!selectedPlayer || !fineType || isNaN(val) || val <= 0 || isNaN(qty) || qty <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder korrekt aus." })
      return
    }
    setIsSubmitting(true)
    try {
      const totalAmount = val * qty;
      const reason = qty === 1 ? fineType.name : `${fineType.name} (${qty}x)`;
      addFine(selectedPlayer, reason, totalAmount);
      toast({ title: "Strafe eingetragen" })
      setSelectedFineTypeId("")
      setCustomAmount("")
      setSelectedPlayer("")
      setQuantity("1")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRoles={currentUserProfile.roles} />
      <MobileNavTrigger userRoles={currentUserProfile.roles} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-card border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Scale className="h-6 w-6" /> Strafenverwaltung
          </h1>
          <Button variant="outline" onClick={exportFinesList} className="rounded-xl border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            <Share2 className="h-4 w-4 mr-2" /> Strafenliste exportieren
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full pb-20">
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Strafen</h1>
            <Button variant="outline" onClick={exportFinesList} className="w-full rounded-xl border-emerald-600 text-emerald-700 dark:text-emerald-400 h-10 text-xs">
              <Share2 className="h-3 w-3 mr-2" /> Strafenliste exportieren
            </Button>
          </div>

          <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-amber-500/10 dark:bg-amber-900/20">
              <CardTitle className="text-lg">Neue Strafe erfassen</CardTitle>
              <CardDescription>Wähle einen Spieler und das Vergehen aus dem Katalog.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Spieler</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Spieler auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vergehen (Katalog)</Label>
                  <Select value={selectedFineTypeId} onValueChange={setSelectedFineTypeId}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Grund auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {fineCatalog.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name} ({f.amount.toFixed(2)}€)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Einzelbetrag (€)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.50" 
                      value={customAmount} 
                      onChange={(e) => setCustomAmount(e.target.value)} 
                      className="rounded-xl h-12 pl-10" 
                    />
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anzahl</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min="1"
                      step="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      className="rounded-xl h-12 pl-10" 
                    />
                    <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {parseInt(quantity) > 1 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    Gesamtbetrag: {(parseFloat(customAmount || "0") * parseInt(quantity || "0")).toFixed(2)} €
                  </p>
                </div>
              )}

              <Button onClick={handleAddFine} disabled={isSubmitting || !selectedPlayer || !selectedFineTypeId} className="w-full rounded-xl h-12 font-bold text-base mt-2 shadow-lg shadow-amber-200 dark:shadow-none bg-amber-600 hover:bg-amber-700 text-white">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                Strafe buchen
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="unpaid" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-xl">
              <TabsTrigger value="unpaid" className="flex items-center gap-2 rounded-lg">
                <Scale className="h-4 w-4" /> Offen ({unpaidFines.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2 rounded-lg">
                <History className="h-4 w-4" /> Bezahlt ({paidFines.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid">
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-card">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {unpaidFines.map((f) => (
                      <div key={f.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <UserCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{f.playerName}</p>
                            <p className="text-xs text-muted-foreground">{f.reason} • {format(new Date(f.date), 'dd.MM.yy', { locale: de })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-destructive mr-2">-{f.amount.toFixed(2)} €</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            onClick={() => markFineAsPaid(f.id)}
                            title="Als bezahlt markieren"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFine(f.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {unpaidFines.length === 0 && <p className="p-8 text-center text-muted-foreground italic">Keine offenen Strafen vorhanden.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paid">
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-card opacity-80">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {paidFines.map((f) => (
                      <div key={f.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{f.playerName}</p>
                            <p className="text-xs text-muted-foreground line-through">{f.reason} • {format(new Date(f.date), 'dd.MM.yy', { locale: de })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{f.amount.toFixed(2)} €</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFine(f.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {paidFines.length === 0 && <p className="p-8 text-center text-muted-foreground italic">Noch keine Strafen bezahlt.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
