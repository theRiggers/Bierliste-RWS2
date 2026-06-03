
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Loader2, 
  Banknote, 
  Calendar,
  Search,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Siren
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"

export default function TreasuryPage() {
  const { toast } = useToast()
  const { membershipTransactions, totalMannschaftskasse, addMembershipTransaction, deleteMembershipTransaction, currentUserProfile, loading: storeLoading } = useStore()
  const [mounted, setMounted] = useState(false)
  
  // Transaction Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<'sponsor' | 'donation' | 'other' | 'expense'>('expense')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isKassenwart = currentUserProfile?.role === 'kassenwart' || currentUserProfile?.role === 'admin'

  if (!currentUserProfile || !isKassenwart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const handleAddTransaction = async () => {
    const val = parseFloat(amount)
    if (!description || isNaN(val) || val <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder korrekt aus." })
      return
    }
    setIsSubmitting(true)
    try {
      addMembershipTransaction(description, val, type)
      toast({ title: "Buchung erfolgreich" })
      setIsDialogOpen(false)
      setDescription("")
      setAmount("")
      setType("expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'sponsor': return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
      case 'donation': return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
      case 'other': return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
      case 'expense': return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  }

  const getLabel = (type: string) => {
    switch (type) {
      case 'sponsor': return 'Sponsoring';
      case 'donation': return 'Spende';
      case 'expense': return 'Ausgabe';
      case 'other': return 'Sonstige Einnahme';
      default: return type;
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <TrendingUp className="h-6 w-6" /> Mannschaftskasse
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl cyan-glow">
                <Plus className="h-4 w-4 mr-2" /> Neue Buchung
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Einnahme / Ausgabe buchen</DialogTitle>
                <DialogDescription>Erfasse Sponsorenbeiträge oder sonstige Teamausgaben.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Input 
                    placeholder="Z.B. Sponsor Trikotsatz oder Platzmiete" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Betrag (€)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Typ</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Ausgabe (-)</SelectItem>
                        <SelectItem value="sponsor">Sponsoring (+)</SelectItem>
                        <SelectItem value="donation">Spende (+)</SelectItem>
                        <SelectItem value="other">Sonstige Einnahme (+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTransaction} disabled={isSubmitting || !description || !amount} className="w-full h-12 rounded-xl font-bold">
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Buchung speichern"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-20">
          <div className="md:hidden flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Mannschaftskasse</h1>
            <Button size="sm" onClick={() => setIsDialogOpen(true)} className="rounded-xl cyan-glow">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Gesamtstand M-Kasse</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Banknote className="h-5 w-5" />
                  </div>
                </div>
                <h2 className={cn("text-3xl font-black", totalMannschaftskasse < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {totalMannschaftskasse.toFixed(2)} €
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Inkl. Beiträge, Strafen und Sponsoring
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Letzte Einnahme</p>
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                {membershipTransactions.filter(t => t.type !== 'expense')[0] ? (
                  <>
                    <h2 className="text-2xl font-black text-emerald-600">
                      +{membershipTransactions.filter(t => t.type !== 'expense')[0].amount.toFixed(2)} €
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {membershipTransactions.filter(t => t.type !== 'expense')[0].description}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Noch keine Einnahmen</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Buchungshistorie</CardTitle>
              <CardDescription>Chronologische Liste aller Bewegungen der Mannschaftskasse.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Datum</TableHead>
                      <TableHead className="font-bold">Beschreibung</TableHead>
                      <TableHead className="font-bold">Typ</TableHead>
                      <TableHead className="text-right font-bold">Betrag</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membershipTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/20 group">
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getIcon(transaction.type)}
                            <span className="text-[10px] font-bold uppercase">{getLabel(transaction.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-black",
                          transaction.type === 'expense' ? 'text-destructive' : 'text-emerald-600'
                        )}>
                          {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteMembershipTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {membershipTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                          Keine Buchungen vorhanden.
                        </TableCell>
                      </TableRow>
                    )}
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
