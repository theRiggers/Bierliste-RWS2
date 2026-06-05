
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, FEE_MONTHS } from "@/lib/store"
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
  Check,
  X,
  CreditCard,
  BadgeEuro
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function TreasuryPage() {
  const { toast } = useToast()
  const { 
    players, 
    membershipTransactions, 
    membershipFees,
    totalMannschaftskasse, 
    settings,
    addMembershipTransaction, 
    deleteMembershipTransaction, 
    addMembershipFee,
    deleteMembershipFee,
    currentUserProfile, 
    loading: storeLoading 
  } = useStore()
  
  const [mounted, setMounted] = useState(false)
  
  // Transaction Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<'sponsor' | 'donation' | 'other' | 'expense'>('expense')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Membership Fee States
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeasonYear = currentMonth < 6 ? currentYear - 1 : currentYear;
  const visibleSeasons = [currentSeasonYear, currentSeasonYear - 1, currentSeasonYear - 2];
  const [selectedSeason, setSelectedSeason] = useState(currentSeasonYear.toString())

  useEffect(() => { setMounted(true) }, [])

  const filteredPlayers = useMemo(() => players.filter(p => p.email !== 'kasse@kickoff.de'), [players]);

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isKassenwart = currentUserProfile?.roles?.includes('kassenwart') || currentUserProfile?.roles?.includes('admin')

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

  const handleToggleFee = (playerId: string, month: number) => {
    const season = parseInt(selectedSeason);
    const existing = membershipFees.find(f => f.playerId === playerId && f.month === month && f.year === season);
    if (existing) {
      deleteMembershipFee(existing.id);
    } else {
      addMembershipFee(playerId, 'monthly', season, month);
    }
  };

  const handleToggleAnnual = (playerId: string) => {
    const season = parseInt(selectedSeason);
    const existing = membershipFees.find(f => f.playerId === playerId && f.type === 'annual' && f.year === season);
    if (existing) {
      deleteMembershipFee(existing.id);
    } else {
      addMembershipFee(playerId, 'annual', season);
    }
  };

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
      <Sidebar userRoles={currentUserProfile.roles} />
      <MobileNavTrigger userRoles={currentUserProfile.roles} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <TrendingUp className="h-6 w-6" /> Mannschaftskasse
          </h1>
          <div className="flex items-center gap-4">
             <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/20">
               <span className="text-xs font-bold uppercase text-muted-foreground mr-2">Gesamtstand:</span>
               <span className={cn("text-lg font-black", totalMannschaftskasse < 0 ? 'text-destructive' : 'text-emerald-600')}>
                 {totalMannschaftskasse.toFixed(2)} €
               </span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full pb-20">
          <div className="md:hidden flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Mannschaftskasse</h1>
            <Badge variant="outline" className={cn("font-black", totalMannschaftskasse < 0 ? 'text-destructive' : 'text-emerald-600')}>
              {totalMannschaftskasse.toFixed(2)} €
            </Badge>
          </div>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 rounded-2xl h-12">
              <TabsTrigger value="transactions" className="rounded-xl flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Buchungen
              </TabsTrigger>
              <TabsTrigger value="fees" className="rounded-xl flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Beiträge
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                  Einnahmen & Ausgaben
                </h3>
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
              </div>

              <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
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
            </TabsContent>

            <TabsContent value="fees" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BadgeEuro className="h-5 w-5 text-blue-600" />
                    Beitrags-Matrix
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {settings.monthlyFee}€ / Mon. • {settings.annualFee}€ / Jahr
                  </Badge>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="w-full sm:w-40 rounded-xl">
                      <SelectValue placeholder="Saison" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleSeasons.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}/{(year + 1) % 100}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="min-w-[150px] font-bold text-xs">Spieler</TableHead>
                        <TableHead className="text-center font-bold text-xs">Jahresb.</TableHead>
                        {FEE_MONTHS.map(m => (
                          <TableHead key={m} className="text-center font-bold px-2 text-xs">{MONTH_NAMES[m]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map(player => {
                        const season = parseInt(selectedSeason);
                        const playerFees = membershipFees.filter(f => f.playerId === player.id && f.year === season);
                        const isAnnual = playerFees.some(f => f.type === 'annual');
                        
                        return (
                          <TableRow key={player.id} className="hover:bg-muted/10">
                            <TableCell className="font-semibold py-4 whitespace-nowrap text-sm">{player.name}</TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant={isAnnual ? "default" : "outline"} 
                                size="sm"
                                className={cn("rounded-lg h-8 w-8 p-0", isAnnual ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                                onClick={() => handleToggleAnnual(player.id)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            {FEE_MONTHS.map(m => {
                              const isPaid = isAnnual || playerFees.some(f => f.type === 'monthly' && f.month === m);
                              return (
                                <TableCell key={m} className="text-center p-1">
                                  <Button 
                                    variant={isPaid ? "default" : "ghost"} 
                                    size="sm" 
                                    disabled={isAnnual}
                                    className={cn(
                                      "rounded-lg h-7 w-7 p-0 transition-all",
                                      isPaid && !isAnnual ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "",
                                      isAnnual ? "bg-emerald-200 text-emerald-700 opacity-100" : "hover:bg-muted"
                                    )}
                                    onClick={() => handleToggleFee(player.id, m)}
                                  >
                                    {isPaid ? <Check className="h-3 w-3" /> : <X className="h-2 w-2 text-muted-foreground/20" />}
                                  </Button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
