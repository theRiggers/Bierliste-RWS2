"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStore, FEE_MONTHS } from "@/lib/store"
import { 
  Wallet, 
  Beer, 
  Clock, 
  ArrowUpRight, 
  Loader2, 
  UserCircle, 
  ShieldCheck, 
  ExternalLink, 
  Banknote, 
  ShoppingCart, 
  Send, 
  FileText, 
  CreditCard, 
  PlusCircle, 
  Package, 
  Check, 
  X, 
  TrendingUp, 
  Scale,
  CalendarDays,
  MapPin,
  Trophy,
  ChevronRight,
  Info,
  Calculator
} from "lucide-react"
import { format, isAfter } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  const { players, expenses, membershipFees, fines, treasuryExpenses, teamEvents, totalMannschaftskasse, totalBierkasse, bierkasseLiquidity, currentUserProfile, settings, addPlayer, recordPayment, recordClubhousePayment, addBezahlkiste, loading: storeLoading } = useStore()
  const [onboardingName, setOnboardingName] = useState("")
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentPlayerId, setPaymentPlayerId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")

  // States for player self-payment
  const [isSelfPaymentDialogOpen, setIsSelfPaymentDialogOpen] = useState(false)
  const [selfPaymentAmount, setSelfPaymentAmount] = useState("")
  const [selfPaymentType, setSelfPaymentType] = useState<'drinks' | 'treasury' | 'fines'>('drinks')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/login")
  }, [mounted, authLoading, user, router])

  const nextEvent = useMemo(() => {
    const now = new Date();
    const futureEvents = teamEvents
      .filter(e => isAfter(new Date(e.date), now))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futureEvents[0] || null;
  }, [teamEvents]);

  const clubhouseStats = useMemo(() => {
    const allCrates = expenses.filter(e => e.itemType === 'crate');
    const totalCrateCost = allCrates.length * settings.cratePrice;
    
    const paidToClubhouse = treasuryExpenses
      .filter(t => t.description.includes("Vereinsheim"))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const openDebt = Math.max(0, totalCrateCost - paidToClubhouse);

    return { 
      count: allCrates.length, 
      totalCost: totalCrateCost,
      paid: paidToClubhouse,
      openDebt
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
      const mIdx = FEE_MONTHS.indexOf(m);
      const curMIdx = FEE_MONTHS.indexOf(currentMonth);
      const isPastOrCurrent = curMIdx === -1 ? true : mIdx <= curMIdx;
      return { month: m, name: MONTH_NAMES_SHORT[m], isPaid, isPastOrCurrent };
    });

    if (isAnnual) return { open: 0, paidMonths: 10, isAnnual: true, monthsStatus };
    const mIdx = FEE_MONTHS.indexOf(currentMonth);
    const monthsToPay = mIdx !== -1 ? mIdx + 1 : (currentMonth === 5 || currentMonth === 6 ? 10 : 0);
    const paidCount = userFees.filter(f => f.type === 'monthly').length;
    return { open: Math.max(0, monthsToPay - paidCount) * settings.monthlyFee, paidMonths: paidCount, isAnnual: false, monthsStatus };
  }, [currentUserProfile, membershipFees, settings]);

  const fineStatus = useMemo(() => {
    if (!currentUserProfile) return 0;
    return fines.filter(f => f.playerId === currentUserProfile.id).reduce((sum, f) => sum + f.amount, 0);
  }, [currentUserProfile, fines]);

  if (!mounted || authLoading || storeLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  if (!currentUserProfile) {
    const hasAdmin = players.some(p => p.role === 'admin')
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-background p-4">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="text-center pb-2 pt-8">
            <div className={cn("mx-auto p-4 rounded-3xl w-fit mb-4", !hasAdmin ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
              {!hasAdmin ? <ShieldCheck className="h-12 w-12" /> : <UserCircle className="h-12 w-12" />}
            </div>
            <CardTitle className="text-2xl font-bold font-headline">{!hasAdmin ? "Master-Account erstellen" : "Willkommen!"}</CardTitle>
            <CardDescription>{!hasAdmin ? "Du bist der erste Nutzer und wirst als Admin registriert." : `Gib deinen Namen ein, um dein Profil zu erstellen.`}</CardDescription>
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
                const role = !hasAdmin ? 'admin' : 'player';
                await addPlayer(onboardingName.trim(), user.email!, role, user.uid);
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

  const handlePayInitiate = (type: 'drinks' | 'treasury' | 'fines') => {
    const amount = type === 'drinks' ? Math.abs(currentUserProfile.balance) : type === 'treasury' ? feeStatus.open : fineStatus;
    if (amount <= 0) {
      toast({ title: "Alles erledigt!" });
      return;
    }
    setSelfPaymentType(type);
    setSelfPaymentAmount(amount.toFixed(2));
    setIsSelfPaymentDialogOpen(true);
  }

  const handlePayConfirm = () => {
    const amount = parseFloat(selfPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte gib einen gültigen Betrag ein." });
      return;
    }

    const subject = selfPaymentType === 'drinks' ? `Getraenkekonto: ${currentUserProfile.name}` : selfPaymentType === 'treasury' ? `Beitrag: ${currentUserProfile.name}` : `Strafen: ${currentUserProfile.name}`;
    
    if (settings.paypalMeLink && settings.paypalMeLink.includes("paypal.me")) {
      let link = settings.paypalMeLink.trim();
      if (!link.startsWith('http')) link = `https://${link}`;
      const baseUrl = link.endsWith("/") ? link : `${link}/`;
      window.open(`${baseUrl}${amount.toFixed(2)}`, '_blank');
    } else {
      const email = settings.treasuryPaypalEmail || settings.paypalMeLink;
      window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(email)}&amount=${amount.toFixed(2)}&currency_code=EUR&item_name=${encodeURIComponent(subject)}`, '_blank');
    }
    setIsSelfPaymentDialogOpen(false);
  }

  const handlePayClubhouse = () => {
    const amount = clubhouseStats.openDebt;
    const email = settings.clubhousePaypalEmail;
    if (!email) {
      toast({ variant: "destructive", title: "Fehler", description: "Keine PayPal E-Mail hinterlegt." });
      return;
    }
    const subject = `Getränke-Abrechnung Vereinsheim`;
    
    if (email.includes("paypal.me")) {
      let link = email.trim();
      if (!link.startsWith('http')) link = `https://${link}`;
      const baseUrl = link.endsWith("/") ? link : `${link}/`;
      window.open(`${baseUrl}${amount.toFixed(2)}`, '_blank');
    } else {
      window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(email)}&amount=${amount.toFixed(2)}&currency_code=EUR&item_name=${encodeURIComponent(subject)}`, '_blank');
    }
  }

  const handleRecordClubhousePaymentAction = () => {
    if (clubhouseStats.openDebt <= 0) return;
    recordClubhousePayment(clubhouseStats.openDebt);
    toast({ title: "Abrechnung verbucht", description: "Die Bierkasse wurde belastet." });
  }

  const handleRecordPaymentAction = async () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentPlayerId || isNaN(amount) || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await recordPayment(paymentPlayerId, amount);
      setIsPaymentOpen(false);
      setPaymentAmount("");
      setPaymentPlayerId("");
      toast({ title: "Zahlung verbucht" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAdmin = currentUserProfile.role === 'admin'
  const isKassenwart = currentUserProfile.role === 'kassenwart' || isAdmin

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger 
        userRole={currentUserProfile.role} 
        rightElement={
          isKassenwart && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-emerald-600 h-10 w-10 mr-1"
              onClick={() => setIsPaymentOpen(true)}
              title="Zahlung verbuchen"
            >
              <PlusCircle className="h-6 w-6" />
            </Button>
          )
        }
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <div className="flex items-center gap-4">
            {isKassenwart && (
              <Button 
                variant="outline" 
                className="rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setIsPaymentOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Zahlung verbuchen
              </Button>
            )}
            <span className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Mein Getränkekonto</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><Wallet className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl font-bold", currentUserProfile.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {currentUserProfile.balance.toFixed(2)} €
                </h2>
                <div className="flex items-center justify-between mt-2">
                   <p className="text-[10px] text-muted-foreground">{currentUserProfile.balance < 0 ? 'Offen' : 'Guthaben'}</p>
                   {currentUserProfile.balance < 0 && (
                     <Button size="sm" variant="link" onClick={() => handlePayInitiate('drinks')} className="h-6 p-0 text-xs font-bold text-primary flex items-center gap-1">
                        Bezahlen <ExternalLink className="h-3 w-3" />
                     </Button>
                   )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Mein Beitragskonto</p>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Banknote className="h-4 w-4" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className={cn("text-2xl font-bold", feeStatus.open > 0 ? 'text-destructive' : 'text-emerald-600')}>
                    {feeStatus.open > 0 ? `-${feeStatus.open.toFixed(2)}` : feeStatus.open.toFixed(2)} €
                  </h2>
                  {feeStatus.open > 0 && (
                    <Button size="sm" variant="link" onClick={() => handlePayInitiate('treasury')} className="h-6 p-0 text-xs font-bold text-blue-600 flex items-center gap-1">
                      Bezahlen <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-5 gap-1 pt-4 border-t border-border">
                  {feeStatus.monthsStatus.map((m) => (
                    <div key={m.month} className="flex flex-col items-center">
                      <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center mb-1 text-[8px] font-bold", m.isPaid ? "bg-emerald-500 text-white" : m.isPastOrCurrent ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground")}>
                        {m.isPaid ? <Check className="h-3 w-3" /> : m.isPastOrCurrent ? <X className="h-3 w-3" /> : null}
                      </div>
                      <span className="text-[8px] text-muted-foreground font-medium">{m.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Meine Strafen</p>
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600"><Scale className="h-4 w-4" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className={cn("text-2xl font-bold", fineStatus > 0 ? 'text-destructive' : 'text-emerald-600')}>
                    {fineStatus > 0 ? `-${fineStatus.toFixed(2)}` : '0.00'} €
                  </h2>
                  {fineStatus > 0 && (
                    <Button size="sm" variant="link" onClick={() => handlePayInitiate('fines')} className="h-6 p-0 text-xs font-bold text-amber-600 flex items-center gap-1">
                      Bezahlen <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {fineStatus > 0 ? 'Offene Vergehen aus dem Katalog' : 'Keine offenen Strafen'}
                </p>
              </CardContent>
            </Card>

            {isKassenwart && (
              <>
                <Card className="border-none shadow-md bg-white rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Bierkasse (Stand)</p>
                      <div className="p-2 bg-amber-100 rounded-full text-amber-600"><Beer className="h-4 w-4" /></div>
                    </div>
                    <h2 className={cn("text-2xl font-bold", totalBierkasse < 0 ? 'text-destructive' : 'text-emerald-600')}>
                      {totalBierkasse.toFixed(2)} €
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1">Guthaben + Außenstände</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">M-Kasse (Gesamt)</p>
                      <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-600">{totalMannschaftskasse.toFixed(2)} €</h2>
                    <p className="text-[10px] text-muted-foreground mt-1">Beiträge & Strafen</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="border-none shadow-lg rounded-2xl bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <CalendarDays className="h-5 w-5" /> Nächster Termin
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextEvent ? (
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[55px] bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">{format(new Date(nextEvent.date), 'EEE', { locale: de })}</p>
                    <p className="text-xl font-black text-blue-900">{format(new Date(nextEvent.date), 'dd')}</p>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base">{nextEvent.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                       <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(nextEvent.date), 'HH:mm')}</span>
                       {nextEvent.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {nextEvent.location}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/calendar')}>
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Keine Termine geplant.</p>
              )}
            </CardContent>
          </Card>

          {isKassenwart && (
            <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-t-amber-500">
              <CardHeader className="bg-amber-50/50 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <ShoppingCart className="h-5 w-5" /> Vereinsheim Abrechnung (Marlene)
                  </CardTitle>
                  <Badge variant="outline" className="bg-white text-amber-700 border-amber-200">
                    Soll: {clubhouseStats.totalCost.toFixed(2)}€
                  </Badge>
                </div>
                <CardDescription>Berechnung nur basierend auf Kisten (Spieler + Bezahlkisten).</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Kisten Total</p>
                    <p className="text-2xl font-black text-amber-700">{clubhouseStats.count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-amber-800/60 font-bold uppercase flex items-center gap-1">
                      <Calculator className="h-3 w-3" /> Noch Offen
                    </p>
                    <p className="text-3xl font-black text-amber-600">{clubhouseStats.openDebt.toFixed(2)} €</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                   <Button variant="outline" onClick={() => addBezahlkiste()} className="rounded-xl border-amber-600 text-amber-700">
                     <PlusCircle className="h-4 w-4 mr-2" /> Bezahlkiste
                   </Button>
                   <Button onClick={handlePayClubhouse} className="rounded-xl bg-amber-600 text-white font-bold">
                     <ExternalLink className="h-4 w-4 mr-2" /> PayPal
                   </Button>
                   <Button variant="secondary" onClick={handleRecordClubhousePaymentAction} disabled={clubhouseStats.openDebt <= 0} className="rounded-xl font-bold">
                     <Check className="h-4 w-4 mr-2" /> Als bezahlt markieren
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4 px-1">Getränk erfassen</h3>
            <ExpenseActions currentUserId={currentUserProfile.id} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 px-1">Letzte Buchungen</h3>
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {expenses.slice(0, 5).map((e) => (
                    <div key={e.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", e.itemType === 'beer' ? 'bg-amber-400' : 'bg-primary')}>
                          {e.itemType === 'beer' ? <Beer className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{e.playerName}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(e.date), 'dd.MM. HH:mm')} • {e.itemType === 'beer' ? 'Bier' : 'Kasten'}</p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive">- {e.cost.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Dialog for Treasurer */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Zahlung erfassen</DialogTitle>
              <DialogDescription>Verbucht eine Zahlung eines Spielers in die Bierkasse.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Spieler</Label>
                <Select value={paymentPlayerId} onValueChange={setPaymentPlayerId}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Spieler wählen" /></SelectTrigger>
                  <SelectContent>
                    {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Betrag (€)</Label>
                <Input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRecordPaymentAction} disabled={isSubmitting || !paymentPlayerId} className="w-full h-12 rounded-xl bg-emerald-600 font-bold">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Zahlung speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Self-Payment Dialog */}
        <Dialog open={isSelfPaymentDialogOpen} onOpenChange={setIsSelfPaymentDialogOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Zahlung vorbereiten</DialogTitle>
              <DialogDescription>
                Wie viel möchtest du für dein {selfPaymentType === 'drinks' ? 'Getränkekonto' : selfPaymentType === 'treasury' ? 'Beitragskonto' : 'Strafenkonto'} bezahlen?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Betrag (€)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={selfPaymentAmount} 
                    onChange={e => setSelfPaymentAmount(e.target.value)} 
                    className="h-12 rounded-xl pl-10"
                  />
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePayConfirm} className="w-full h-12 rounded-xl font-bold cyan-glow">
                Weiter zu PayPal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
