
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStore, FEE_MONTHS } from "@/lib/store"
import { Wallet, Beer, Clock, ArrowUpRight, Loader2, UserCircle, ShieldCheck, ExternalLink, Banknote, ShoppingCart, Send, FileText, CreditCard, PlusCircle, Package, Check, X, TrendingUp } from "lucide-react"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, loading: authLoading } = useUser()
  const { players, expenses, membershipFees, treasuryExpenses, totalMannschaftskasse, currentUserProfile, settings, addPlayer, addTreasuryExpense, addBezahlkiste, addMembershipTransaction, loading: storeLoading } = useStore()
  const [onboardingName, setOnboardingName] = useState("")
  
  // Treasury Expense States (Now for Team Fund)
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false)
  const [tDesc, setTDesc] = useState("")
  const [tAmount, setTAmount] = useState("")

  // Sponsor/Donation States
  const [isSponsorOpen, setIsSponsorOpen] = useState(false)
  const [sDesc, setSDesc] = useState("")
  const [sAmount, setSAmount] = useState("")
  const [sType, setSType] = useState<'sponsor' | 'donation' | 'other' | 'expense'>('sponsor')
  
  // Result for Clubhouse Draft
  const [clubhouseDraft, setClubhouseDraft] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/login")
  }, [mounted, authLoading, user, router])

  // Calculate monthly crates (Team-wide) including player crates AND treasury Bezahlkisten
  const monthlyCrateStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    // 1. Crates recorded for individual players
    const playerCrates = expenses.filter(e => {
      const d = new Date(e.date);
      return e.itemType === 'crate' && isWithinInterval(d, { start, end });
    });

    // 2. Bezahlkisten recorded directly in treasury
    const bezahlKisten = treasuryExpenses.filter(t => {
      const d = new Date(t.date);
      return t.description.includes("Bezahlkiste") && isWithinInterval(d, { start, end });
    });

    const totalCount = playerCrates.length + bezahlKisten.length;

    return {
      count: totalCount,
      amount: totalCount * settings.cratePrice
    };
  }, [expenses, treasuryExpenses, settings]);

  const feeStatus = useMemo(() => {
    if (!currentUserProfile) return { open: 0, paidMonths: 0, monthsStatus: [] };
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const seasonYear = currentMonth < 7 ? currentYear - 1 : currentYear;
    const userFees = membershipFees.filter(f => f.playerId === currentUserProfile.id && f.year === seasonYear);
    const isAnnual = userFees.some(f => f.type === 'annual');
    
    const monthsStatus = FEE_MONTHS.map(m => {
      const isPaid = isAnnual || userFees.some(f => f.type === 'monthly' && f.month === m);
      const monthIdxInSeason = FEE_MONTHS.indexOf(m);
      const currentMonthIdxInSeason = FEE_MONTHS.indexOf(currentMonth);
      const isPastOrCurrent = currentMonthIdxInSeason === -1 ? true : monthIdxInSeason <= currentMonthIdxInSeason;

      return {
        month: m,
        name: MONTH_NAMES_SHORT[m],
        isPaid,
        isPastOrCurrent
      };
    });

    if (isAnnual) return { open: 0, paidMonths: 10, isAnnual: true, monthsStatus };

    const monthIndex = FEE_MONTHS.indexOf(currentMonth);
    let monthsToPay = 0;
    
    if (monthIndex !== -1) {
      monthsToPay = monthIndex + 1;
    } else if (currentMonth === 5 || currentMonth === 6) {
      monthsToPay = 10;
    }
    
    const paidCount = userFees.filter(f => f.type === 'monthly').length;
    const unpaidCount = Math.max(0, monthsToPay - paidCount);
    
    return { open: unpaidCount * settings.monthlyFee, paidMonths: paidCount, isAnnual: false, monthsStatus };
  }, [currentUserProfile, membershipFees, settings]);

  if (!mounted || authLoading || storeLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  if (!currentUserProfile) {
    const hasAdmin = players.some(p => p.role === 'auditor')
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-background p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="text-center pb-2 pt-8">
            <div className={cn("mx-auto p-4 rounded-3xl w-fit mb-4", !hasAdmin ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
              {!hasAdmin ? <ShieldCheck className="h-12 w-12" /> : <UserCircle className="h-12 w-12" />}
            </div>
            <CardTitle className="text-2xl font-bold font-headline">{!hasAdmin ? "Master-Account erstellen" : "Willkommen!"}</CardTitle>
            <CardDescription>{!hasAdmin ? "Du bist der erste Nutzer und wirst als Kassenprüfer registriert." : `Gib deinen Namen ein, um dein Profil zu erstellen.`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-10 px-8">
            <div className="space-y-2">
              <Label htmlFor="onboarding-name" className="text-xs uppercase font-bold text-muted-foreground ml-1">Dein Name</Label>
              <Input id="onboarding-name" placeholder="Z.B. Max Mustermann" value={onboardingName} onChange={(e) => setOnboardingName(e.target.value)} className="rounded-xl h-12 bg-muted/30 border-none text-base" disabled={isSubmitting} />
            </div>
            <Button className={cn("w-full h-12 rounded-xl font-bold text-lg", !hasAdmin ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 shadow-lg" : "cyan-glow")} onClick={async () => {
              if (!onboardingName.trim()) return;
              setIsSubmitting(true);
              try {
                await addPlayer(onboardingName.trim(), user.email!, !hasAdmin ? 'auditor' : 'player', user.uid);
                if (!hasAdmin && !players.some(p => p.email === 'kasse@kickoff.de')) await addPlayer('Mannschaftskasse', 'kasse@kickoff.de', 'player');
                toast({ title: "Profil erstellt" });
              } finally { setIsSubmitting(false) }
            }} disabled={!onboardingName.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : (!hasAdmin ? "Als Admin starten" : "Profil erstellen")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const teamKasse = players.find(p => p.email === 'kasse@kickoff.de') || { balance: 0 }
  const monthlyConsumptionCount = expenses.filter(e => e.playerId === currentUserProfile.id && new Date(e.date).getMonth() === new Date().getMonth()).length
  const isAuditor = currentUserProfile.role === 'auditor'

  const handleAddTreasuryExpense = () => {
    const amount = parseFloat(tAmount)
    if (!tDesc || isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte gültige Daten eingeben." })
      return
    }
    // Now redirected to Mannschaftskasse as an expense
    addMembershipTransaction(tDesc, amount, 'expense')
    setIsTreasuryOpen(false)
    setTDesc("")
    setTAmount("")
  }

  const handleAddSponsor = () => {
    const amount = parseFloat(sAmount)
    if (!sDesc || isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte gültige Daten eingeben." })
      return
    }
    addMembershipTransaction(sDesc, amount, sType)
    setIsSponsorOpen(false)
    setSDesc("")
    setSAmount("")
  }

  const handleAddBezahlkisteLocal = () => {
    addBezahlkiste();
    toast({ title: "Bezahlkiste erfasst", description: `${settings.cratePrice.toFixed(2)}€ von Bierliste abgezogen.` });
  }

  const handleDraftClubhouseLocal = () => {
    if (monthlyCrateStats.count === 0) return;
    const monthName = format(new Date(), 'MMMM', { locale: de });
    const draft = `Hallo Marlene,\n\nfür den Monat ${monthName} haben wir im Vereinsheim ${monthlyCrateStats.count} Kisten verbraucht.\nDer Gesamtbetrag von ${monthlyCrateStats.amount.toFixed(2)}€ wird hiermit per PayPal überwiesen.\n\nBeste Grüße,\nBierliste RWS2 (Schatzmeister)`;
    setClubhouseDraft(draft);
    toast({ title: "Entwurf erstellt" });
  }

  const handlePayClubhouse = () => {
    const monthName = format(new Date(), 'MMMM', { locale: de });
    const amount = monthlyCrateStats.amount.toFixed(2);
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(settings.clubhousePaypalEmail)}&amount=${amount}&currency_code=EUR&item_name=Kistenabrechnung%20RWS2%20${encodeURIComponent(monthName)}`;
    window.open(paypalUrl, '_blank');
  }

  const handlePayIndividualDebt = () => {
    const amount = Math.abs(currentUserProfile.balance).toFixed(2);
    const reference = `Getränkekonto: ${currentUserProfile.name}`;
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(settings.treasuryPaypalEmail)}&amount=${amount}&currency_code=EUR&item_name=${encodeURIComponent(reference)}`;
    window.open(paypalUrl, '_blank');
  }

  const handlePayMembershipFee = () => {
    const amount = feeStatus.open.toFixed(2);
    const reference = `Mannschaftskasse: ${currentUserProfile.name}`;
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(settings.treasuryPaypalEmail)}&amount=${amount}&currency_code=EUR&item_name=${encodeURIComponent(reference)}`;
    window.open(paypalUrl, '_blank');
  }

  const TreasuryDialog = ({ variant = "default" }: { variant?: "default" | "mobile" }) => (
    <div className="flex flex-wrap gap-2">
      <Dialog open={isTreasuryOpen} onOpenChange={setIsTreasuryOpen}>
        <DialogTrigger asChild>
          <Button variant={variant === "mobile" ? "ghost" : "outline"} size={variant === "mobile" ? "icon" : "sm"} className={cn("rounded-xl h-10", variant === "mobile" ? "text-primary hover:bg-primary/10" : "border-primary text-primary hover:bg-primary/5")}>
            <ShoppingCart className={cn("h-4 w-4", variant === "mobile" ? "h-6 w-6" : "mr-2")} />
            {variant !== "mobile" && "Mannschaftskassen-Ausgabe"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ausgabe der Mannschaftskasse</DialogTitle>
            <DialogDescription>Buchung von der Mannschaftskasse abziehen (z.B. Trainingsmaterial).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="t-desc">Beschreibung</Label>
              <Input id="t-desc" placeholder="Z.B. Neue Trainingsbälle" value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-amount">Betrag (€)</Label>
              <Input id="t-amount" type="number" step="0.01" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTreasuryExpense} className="rounded-xl w-full">Ausgabe bestätigen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSponsorOpen} onOpenChange={setIsSponsorOpen}>
        <DialogTrigger asChild>
          <Button variant={variant === "mobile" ? "ghost" : "outline"} size={variant === "mobile" ? "icon" : "sm"} className={cn("rounded-xl h-10", variant === "mobile" ? "text-emerald-600 hover:bg-emerald-50" : "border-emerald-600 text-emerald-600 hover:bg-emerald-50")}>
            <TrendingUp className={cn("h-4 w-4", variant === "mobile" ? "h-6 w-6" : "mr-2")} />
            {variant !== "mobile" && "Sponsor / Spende"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einnahme Mannschaftskasse</DialogTitle>
            <DialogDescription>Buchung für externe Einnahmen (Sponsoren, Spenden).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="s-desc">Beschreibung</Label>
              <Input id="s-desc" placeholder="Z.B. Sponsor Trikotsatz" value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-amount">Betrag (€)</Label>
              <Input id="s-amount" type="number" step="0.01" value={sAmount} onChange={(e) => setSAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={sType} onValueChange={(v: any) => setSType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="donation">Spende</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSponsor} className="rounded-xl w-full bg-emerald-600 hover:bg-emerald-700">Einnahme buchen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger 
        userRole={currentUserProfile.role} 
        rightElement={isAuditor ? <TreasuryDialog variant="mobile" /> : null} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <div className="flex items-center gap-4">
            {isAuditor && <TreasuryDialog />}
            <span className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          <div className="md:hidden mb-2">
            <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          </div>

          <div className={cn(
            "grid gap-4 md:grid-cols-2",
            isAuditor ? "lg:grid-cols-4" : "lg:grid-cols-3"
          )}>
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Getränkekonto</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><Wallet className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl md:text-3xl font-bold", currentUserProfile.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {currentUserProfile.balance.toFixed(2)} €
                </h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{currentUserProfile.balance < 0 ? 'Schulden' : 'Guthaben'}</p>
                  {currentUserProfile.balance < 0 && (
                    <Button variant="link" className="h-auto p-0 text-[10px] text-primary font-bold flex items-center gap-1" onClick={handlePayIndividualDebt}>
                      Zahlen <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Mannschaftskasse</p>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Banknote className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl md:text-3xl font-bold", feeStatus.open > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {feeStatus.open > 0 ? `-${feeStatus.open.toFixed(2)}` : feeStatus.open.toFixed(2)} €
                </h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{feeStatus.isAnnual ? 'Jahreszahler' : `${feeStatus.paidMonths} Monate bezahlt`}</p>
                  {feeStatus.open > 0 && (
                    <Button variant="link" className="h-auto p-0 text-[10px] text-blue-600 font-bold flex items-center gap-1" onClick={handlePayMembershipFee}>
                      Beitrag zahlen <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-5 gap-1 pt-4 border-t border-border">
                  {feeStatus.monthsStatus.map((m) => (
                    <div key={m.month} className="flex flex-col items-center">
                      <div className={cn(
                        "h-6 w-6 rounded-lg flex items-center justify-center mb-1 text-[8px] font-bold",
                        m.isPaid ? "bg-emerald-500 text-white" : 
                        m.isPastOrCurrent ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground"
                      )}>
                        {m.isPaid ? <Check className="h-3 w-3" /> : m.isPastOrCurrent ? <X className="h-3 w-3" /> : null}
                      </div>
                      <span className="text-[8px] text-muted-foreground font-medium">{m.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isAuditor && (
              <>
                <Card className="border-none shadow-md bg-white rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Bierliste (Gesamt)</p>
                      <div className={cn("p-2 rounded-full", teamKasse.balance < 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-600")}>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <h2 className={cn("text-2xl md:text-3xl font-bold", teamKasse.balance < 0 ? "text-destructive" : "text-emerald-600")}>
                      {teamKasse.balance.toFixed(2)} €
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {teamKasse.balance < 0 ? "Bierliste im Minus" : "Bierliste im Plus"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Mannschaftskasse (Gesamt)</p>
                      <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-emerald-600">
                      {totalMannschaftskasse.toFixed(2)} €
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Summe Beiträge & Sponsoren
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {!isAuditor && (
              <Card className="border-none shadow-md bg-white rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Bier (Monat)</p>
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600"><Beer className="h-4 w-4" /></div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">{monthlyConsumptionCount}</h2>
                </CardContent>
              </Card>
            )}
          </div>

          {isAuditor && (
            <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-t-amber-500 overflow-hidden">
              <CardHeader className="bg-amber-50/50 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <ShoppingCart className="h-5 w-5" />
                    Vereinsheim Abrechnung
                  </CardTitle>
                  <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    {format(new Date(), 'MMMM', { locale: de })}
                  </span>
                </div>
                <CardDescription>Abrechnung der monatlichen Getränke-Schulden an das Vereinsheim.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Kisten</p>
                      <p className="text-2xl md:text-3xl font-bold text-amber-700">{monthlyCrateStats.count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Betrag</p>
                      <p className="text-2xl md:text-3xl font-bold text-amber-700">{monthlyCrateStats.amount.toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button 
                      variant="outline"
                      onClick={handleAddBezahlkisteLocal}
                      className="rounded-xl border-amber-600 text-amber-700 hover:bg-amber-50 flex-1 md:flex-none h-10 px-4 text-xs font-bold"
                    >
                      <Package className="h-3 w-3 mr-2" />
                      Bezahlkiste (+{settings.cratePrice.toFixed(0)}€)
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleDraftClubhouseLocal} 
                      disabled={monthlyCrateStats.count === 0}
                      className="rounded-xl border-amber-600 text-amber-700 hover:bg-amber-50 flex-1 md:flex-none h-10 px-4 text-xs"
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      Nachricht
                    </Button>
                    <Button 
                      onClick={handlePayClubhouse} 
                      disabled={monthlyCrateStats.count === 0}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex-1 md:flex-none h-10 px-4 text-xs"
                    >
                      <CreditCard className="h-3 w-3 mr-2" />
                      PayPal
                    </Button>
                  </div>
                </div>

                {clubhouseDraft && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-amber-800">Vorschau</p>
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] text-amber-600" onClick={() => {
                        navigator.clipboard.writeText(clubhouseDraft);
                        toast({ title: "Kopiert", description: "Nachricht in der Zwischenablage." });
                      }}>Kopieren</Button>
                    </div>
                    <p className="text-xs italic text-amber-900 whitespace-pre-wrap leading-relaxed">
                      {clubhouseDraft}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground px-1">Getränk erfassen</h3>
            <ExpenseActions currentUserId={currentUserProfile.id} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground px-1">Letzte Buchungen</h3>
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", expense.itemType === 'beer' ? 'bg-amber-400' : 'bg-primary')}>
                          {expense.itemType === 'beer' ? <Beer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{expense.playerName}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(expense.date), 'dd.MM. HH:mm')} • {expense.itemType === 'beer' ? 'Bier' : 'Kasten'}</p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive whitespace-nowrap">- {expense.cost.toFixed(2)} €</span>
                    </div>
                  ))}
                  {expenses.length === 0 && <div className="p-8 text-center text-muted-foreground italic">Noch keine Buchungen vorhanden.</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
