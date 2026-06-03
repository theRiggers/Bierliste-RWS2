
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Fine, Player } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scale, Plus, Trash2, Loader2, UserCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"

export default function FinesPage() {
  const { toast } = useToast()
  const { players, fines, fineCatalog, addFine, deleteFine, currentUserProfile, loading: storeLoading } = useStore()
  const [mounted, setMounted] = useState(false)
  
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [selectedFineTypeId, setSelectedFineTypeId] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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

  const isAdmin = currentUserProfile?.role === 'admin'
  const isStrafenwart = currentUserProfile?.role === 'strafenwart'

  if (!currentUserProfile || (!isAdmin && !isStrafenwart)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const handleAddFine = async () => {
    const val = parseFloat(customAmount)
    const fineType = fineCatalog.find(f => f.id === selectedFineTypeId)
    
    if (!selectedPlayer || !fineType || isNaN(val) || val <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder korrekt aus." })
      return
    }
    setIsSubmitting(true)
    try {
      addFine(selectedPlayer, fineType.name, val)
      toast({ title: "Strafe eingetragen" })
      setSelectedFineTypeId("")
      setCustomAmount("")
      setSelectedPlayer("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Scale className="h-6 w-6" /> Strafenverwaltung
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full pb-20">
          <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-amber-50">
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

              <div className="space-y-2">
                <Label>Betrag anpassen (€)</Label>
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
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Betrag wird automatisch aus dem Katalog geladen, kann aber überschrieben werden.
                </p>
              </div>

              <Button onClick={handleAddFine} disabled={isSubmitting || !selectedPlayer || !selectedFineTypeId} className="w-full rounded-xl h-12 font-bold text-base mt-2 shadow-lg shadow-amber-200 bg-amber-600 hover:bg-amber-700">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5 mr-2" />}
                Strafe buchen
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Offene Strafen</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {fines.map((f) => (
                  <div key={f.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <UserCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{f.playerName}</p>
                        <p className="text-xs text-muted-foreground">{f.reason} • {format(new Date(f.date), 'dd.MM.yy', { locale: de })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-destructive">-{f.amount.toFixed(2)} €</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFine(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {fines.length === 0 && <p className="p-8 text-center text-muted-foreground italic">Keine offenen Strafen vorhanden.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
