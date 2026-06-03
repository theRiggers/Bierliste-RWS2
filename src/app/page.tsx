
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStore, FEE_MONTHS } from "@/lib/store"
import { Wallet, Beer, Clock, ArrowUpRight, Loader2, UserCircle, ShieldCheck, ExternalLink, Banknote, ShoppingCart, Send, FileText, CreditCard, PlusCircle, Package, Check, X, TrendingUp, Scale } from "lucide-react"
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
  const { players, expenses, membershipFees, fines, treasuryExpenses, totalMannschaftskasse, currentUserProfile, settings, addPlayer, addTreasuryExpense, addBezahlkiste, addMembershipTransaction, loading: storeLoading } = useStore()
  const [onboardingName, setOnboardingName] = useState("")
  
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false)
  const [tDesc, setTDesc] = useState("")
  const [tAmount, setTAmount] = useState("")

  const [isSponsorOpen, setIsSponsorOpen] = useState(false)
  const [sDesc, setSDesc] = useState("")
  const [sAmount, setSAmount] = useState("")
  const [sType, setSType] = useState<'sponsor' | 'donation' | 'other' | 'expense'>('sponsor')
  
  const [clubhouseDraft, setClubhouseDraft] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/login")
  }, [mounted, authLoading, user, router])

  const monthlyCrateStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const pCrates = expenses.filter(e => e.itemType === 'crate' && isWithinInterval(new Date(e.date), { start, end }));
    const bKisten = treasuryExpenses.filter(t => t.description.includes("Bezahlkiste") && isWithinInterval(new Date(t.date), { start, end }));
    const totalCount = pCrates.length + bKisten.length;
    return { count: totalCount, amount: totalCount * settings.cratePrice };
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
                await addPlayer(onboardingName.trim(), user.email!, !hasAdmin ? 'admin' : 'player', user.uid);
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
  const isAdmin = currentUserProfile.role === 'admin'
  const isKassenwart = currentUserProfile.role === 'kassenwart' || isAdmin

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <span className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Getränkekonto</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><Wallet className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl font-bold", currentUserProfile.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {currentUserProfile.balance.toFixed(2)} €
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1">{currentUserProfile.balance < 0 ? 'Schulden' : 'Guthaben'}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Mannschaftskasse</p>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Banknote className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl font-bold", feeStatus.open > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {feeStatus.open > 0 ? `-${feeStatus.open.toFixed(2)}` : feeStatus.open.toFixed(2)} €
                </h2>
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
                  <p className="text-xs font-medium text-muted-foreground">Strafenkonto</p>
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600"><Scale className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl font-bold", fineStatus > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {fineStatus > 0 ? `-${fineStatus.toFixed(2)}` : fineStatus.toFixed(2)} €
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1">Offene Strafen</p>
              </CardContent>
            </Card>

            {isKassenwart && (
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
            )}
          </div>

          {isKassenwart && (
            <Card className="border-none shadow-lg rounded-2xl bg-white border-t-4 border-t-amber-500 overflow-hidden">
              <CardHeader className="bg-amber-50/50 pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800"><ShoppingCart className="h-5 w-5" /> Vereinsheim Abrechnung</CardTitle>
                <CardDescription>Getränke-Schulden an Marlene für {format(new Date(), 'MMMM', { locale: de })}.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div><p className="text-[10px] text-muted-foreground font-bold">KISTEN</p><p className="text-2xl font-bold text-amber-700">{monthlyCrateStats.count}</p></div>
                  <div><p className="text-[10px] text-muted-foreground font-bold">BETRAG</p><p className="text-2xl font-bold text-amber-700">{monthlyCrateStats.amount.toFixed(2)} €</p></div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" onClick={() => addBezahlkiste()} className="rounded-xl border-amber-600 text-amber-700">Bezahlkiste</Button>
                   <Button onClick={() => {
                     const month = format(new Date(), 'MMMM', { locale: de });
                     setClubhouseDraft(`Hallo Marlene, für ${month} haben wir ${monthlyCrateStats.count} Kisten verbraucht (${monthlyCrateStats.amount.toFixed(2)}€). Überweisung folgt!`);
                   }} disabled={monthlyCrateStats.count === 0} className="rounded-xl border-amber-600 text-amber-700">Entwurf</Button>
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
      </main>
    </div>
  )
}
