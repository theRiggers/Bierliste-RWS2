
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { ExpenseActions } from "@/components/dashboard/expense-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStore, PAYPAL_ME_LINK, FEE_MONTHS, MONTHLY_FEE, ANNUAL_FEE } from "@/lib/store"
import { Wallet, Beer, Clock, ArrowUpRight, Loader2, UserCircle, ShieldCheck, ExternalLink, Banknote } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, loading: authLoading } = useUser()
  const { players, expenses, membershipFees, currentUserProfile, addPlayer, loading: storeLoading } = useStore()
  const [onboardingName, setOnboardingName] = useState("")
  
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/login")
  }, [mounted, authLoading, user, router])

  // Beitragsstatus berechnen
  const feeStatus = useMemo(() => {
    if (!currentUserProfile) return { open: 0, paidMonths: 0 };
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const seasonYear = currentMonth < 6 ? currentYear - 1 : currentYear;

    const userFees = membershipFees.filter(f => f.playerId === currentUserProfile.id && f.year === seasonYear);
    const isAnnual = userFees.some(f => f.type === 'annual');
    
    if (isAnnual) return { open: 0, paidMonths: 10, isAnnual: true };

    const elapsedMonthsInSeason = FEE_MONTHS.indexOf(currentMonth);
    const monthsToPay = elapsedMonthsInSeason === -1 ? 0 : elapsedMonthsInSeason + 1;
    
    const paidMonthIndices = userFees.filter(f => f.type === 'monthly').map(f => f.month);
    const paidCount = paidMonthIndices.length;
    
    const unpaidCount = Math.max(0, monthsToPay - paidCount);
    return { open: unpaidCount * MONTHLY_FEE, paidMonths: paidCount, isAnnual: false };
  }, [currentUserProfile, membershipFees]);

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

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <span className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
          <div className={cn(
            "grid gap-4 md:grid-cols-2",
            isAuditor ? "lg:grid-cols-4" : "lg:grid-cols-3"
          )}>
            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Getränkekasse</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><Wallet className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl md:text-3xl font-bold", currentUserProfile.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {currentUserProfile.balance.toFixed(2)} €
                </h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{currentUserProfile.balance < 0 ? 'Schulden' : 'Guthaben'}</p>
                  {currentUserProfile.balance < 0 && (
                    <Button variant="link" className="h-auto p-0 text-[10px] text-primary font-bold flex items-center gap-1" onClick={() => window.open(`${PAYPAL_ME_LINK}/${Math.abs(currentUserProfile.balance)}`, '_blank')}>
                      Zahlen <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Vereinsbeiträge</p>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Banknote className="h-4 w-4" /></div>
                </div>
                <h2 className={cn("text-2xl md:text-3xl font-bold", feeStatus.open > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {feeStatus.open.toFixed(2)} €
                </h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{feeStatus.isAnnual ? 'Jahreszahler' : `${feeStatus.paidMonths} Monate bezahlt`}</p>
                  {feeStatus.open > 0 && (
                    <Button variant="link" className="h-auto p-0 text-[10px] text-blue-600 font-bold flex items-center gap-1" onClick={() => window.open(`${PAYPAL_ME_LINK}/${feeStatus.open}`, '_blank')}>
                      Beitrag zahlen <ExternalLink className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {isAuditor && (
              <Card className="border-none shadow-md bg-white rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Teamkasse (Gesamt)</p>
                    <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><ArrowUpRight className="h-4 w-4" /></div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-emerald-600">{teamKasse.balance.toFixed(2)} €</h2>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-md bg-white rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Bier (Monat)</p>
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600"><Beer className="h-4 w-4" /></div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{monthlyConsumptionCount}</h2>
              </CardContent>
            </Card>
          </div>

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
                      <span className="font-bold text-destructive">- {expense.cost.toFixed(2)} €</span>
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
