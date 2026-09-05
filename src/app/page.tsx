"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useStore, FEE_MONTHS, Role, Player, TeamEvent } from "@/lib/store"
import { 
  Clock, 
  Loader2, 
  UserCircle, 
  ShieldCheck, 
  ExternalLink, 
  Banknote, 
  TrendingUp, 
  Scale,
  CalendarDays,
  MapPin,
  Trophy,
  ChevronRight,
  Calculator,
  Medal,
  Copy,
  Check, 
  X, 
  HandCoins,
  AlertCircle,
  UserX,
  Sparkles,
  UserPlus
} from "lucide-react"
import { format, isAfter, isBefore, addDays, startOfDay, parseISO, subHours } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IntroDialog } from "@/components/layout/intro-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, loading: authLoading } = useUser()
  const { players, membershipFees, fines, teamEvents, attendance, totalMannschaftskasse, currentUserProfile, settings, recordPayment, upsertAttendance, loading: storeLoading, addPlayer } = useStore()
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentPlayerId, setPaymentPlayerId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")

  const [isSelfPaymentDialogOpen, setIsSelfPaymentDialogOpen] = useState(false)
  const [selfPaymentAmount, setSelfPaymentAmount] = useState("")
  const [selfPaymentType, setSelfPaymentType] = useState<'treasury' | 'fines'>('treasury')

  const [isQuickDeclineOpen, setIsQuickDeclineOpen] = useState(false)
  const [quickDeclineEventId, setQuickDeclineEventId] = useState<string | null>(null)
  const [quickDeclineReason, setQuickDeclineReason] = useState("")

  // Onboarding state
  const [setupName, setSetupName] = useState("")
  const [isSettingUp, setIsSettingUp] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/login")
  }, [mounted, authLoading, user, router])

  const roles = useMemo(() => currentUserProfile?.roles || [], [currentUserProfile]);
  const isAdmin = useMemo(() => roles.includes('admin'), [roles]);
  const isKassenwart = useMemo(() => roles.includes('kassenwart') || roles.includes('admin'), [roles]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    const futureEvents = teamEvents
      .filter(e => isAfter(new Date(e.date), now))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futureEvents[0] || null;
  }, [teamEvents]);

  const isDeclineDeadlinePassed = (event: TeamEvent) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    if (event.type === 'match') {
      return isAfter(now, subHours(eventDate, 48));
    }
    if (event.type === 'training') {
      return isAfter(now, subHours(eventDate, 6));
    }
    return false;
  };

  const rsvpReminder = useMemo(() => {
    if (!nextEvent || !currentUserProfile) return null;
    
    // Trainers don't need RSVP reminders
    if (currentUserProfile.roles.includes('coach')) return null;

    const userAttendance = attendance.find(a => a.eventId === nextEvent.id && a.playerId === currentUserProfile.id);
    if (userAttendance) return null;

    const eventDate = new Date(nextEvent.date);
    const now = new Date();
    const reminderThreshold = addDays(now, 5);

    if (isBefore(eventDate, reminderThreshold)) {
      return nextEvent;
    }
    return null;
  }, [nextEvent, currentUserProfile, attendance]);

  const feeStatus = useMemo(() => {
    if (!currentUserProfile) return { open: 0, paidMonths: 0, monthsStatus: [], totalDebt: 0 };
    
    const personalTreasuryDebt = Math.abs(Math.min(0, currentUserProfile.treasuryBalance));

    if (currentUserProfile.isFeeExempt) return { open: 0, paidMonths: 0, isExempt: true, monthsStatus: [], totalDebt: personalTreasuryDebt };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const seasonYear = currentMonth < 5 ? currentYear - 1 : currentYear;
    
    const userFees = membershipFees.filter(f => f.playerId === currentUserProfile.id && f.year === seasonYear);
    const isAnnual = userFees.some(f => f.type === 'annual');
    
    const currentMIdxInList = FEE_MONTHS.indexOf(currentMonth);

    const monthsStatus = FEE_MONTHS.map(m => {
      const isPaid = isAnnual || userFees.some(f => f.type === 'monthly' && f.month === m);
      const mIdxInList = FEE_MONTHS.indexOf(m);
      
      let isPastOrCurrent = false;
      if (currentMIdxInList !== -1) {
        isPastOrCurrent = mIdxInList <= currentMIdxInList;
      }

      return { month: m, name: MONTH_NAMES_SHORT[m], isPaid, isPastOrCurrent };
    });

    if (isAnnual) return { open: 0, paidMonths: 10, isAnnual: true, monthsStatus, totalDebt: personalTreasuryDebt };
    
    let monthsToPay = 0;
    if (currentMIdxInList !== -1) {
      monthsToPay = currentMIdxInList + 1;
    }

    const paidCount = userFees.filter(f => f.type === 'monthly').length;
    const openFees = Math.max(0, monthsToPay - paidCount) * settings.monthlyFee;
    
    return { 
      open: openFees, 
      paidMonths: paidCount, 
      isAnnual: false, 
      monthsStatus,
      totalDebt: openFees + personalTreasuryDebt
    };
  }, [currentUserProfile, membershipFees, settings]);

  const fineStatus = useMemo(() => {
    if (!currentUserProfile) return 0;
    return fines.filter(f => f.playerId === currentUserProfile.id && !f.isPaid).reduce((sum, f) => sum + f.amount, 0);
  }, [currentUserProfile, fines]);

  const finesRanking = useMemo(() => {
    const rankingMap = new Map<string, { id: string, name: string, total: number }>();
    
    players.forEach(p => {
      if (p.email !== 'kasse@kickoff.de' && p.id !== 'team_treasury') {
        rankingMap.set(p.id, { id: p.id, name: p.name, total: 0 });
      }
    });

    fines.forEach(f => {
      const entry = rankingMap.get(f.playerId);
      if (entry) entry.total += f.amount;
    });

    return Array.from(rankingMap.values())
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [players, fines]);

  if (!mounted || authLoading || storeLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupName.trim() || !user) return
    setIsSettingUp(true)
    try {
      await addPlayer(setupName.trim(), user.email || "", ['player'], user.uid)
      toast({ title: "Profil erstellt", description: `Willkommen im Team, ${setupName}!` })
    } catch (err) {
      toast({ variant: "destructive", title: "Fehler", description: "Profil konnte nicht erstellt werden." })
    } finally {
      setIsSettingUp(false)
    }
  }

  if (user && !currentUserProfile) {
    return (
      <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
        <Sidebar userRoles={[]} />
        <MobileNavTrigger userRoles={[]} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary pb-8 pt-10 text-white">
              <div className="mx-auto bg-white/20 p-3 rounded-full w-20 h-20 mb-4 flex items-center justify-center">
                <UserPlus className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold font-headline">Profil anlegen</CardTitle>
              <CardDescription className="text-white/80">Willkommen im Headquarter RWS2! Wie sollen wir dich nennen?</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <form onSubmit={handleSetupProfile} className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="setup-name" className="ml-1 text-xs font-bold uppercase text-muted-foreground">Dein Name</Label>
                  <Input 
                    id="setup-name"
                    placeholder="Vorname Nachname" 
                    className="h-12 rounded-xl text-lg" 
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold red-glow" disabled={isSettingUp || !setupName.trim()}>
                  {isSettingUp ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-5 w-5 mr-2" /> Profil jetzt erstellen</>}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground italic">
                Deine E-Mail Adresse ({user.email}) wird automatisch verknüpft.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!user || !currentUserProfile) return null

  const handleQuickRSVP = async (eventId: string, status: 'going' | 'declined') => {
    if (status === 'going') {
      await upsertAttendance(eventId, 'going');
      toast({ title: "Zusage gespeichert", description: "Wir sehen uns beim Termin!" });
    } else {
      const event = teamEvents.find(e => e.id === eventId);
      if (event && isDeclineDeadlinePassed(event)) {
        toast({ 
          variant: "destructive", 
          title: "Frist abgelaufen", 
          description: event.type === 'match' ? "Absagen für Spiele sind nur bis 48h vorher möglich." : "Absagen für Trainings sind nur bis 6h vorher möglich." 
        });
        return;
      }
      setQuickDeclineEventId(eventId);
      setQuickDeclineReason("");
      setIsQuickDeclineOpen(true);
    }
  }

  const confirmQuickDecline = async () => {
    if (!quickDeclineEventId || !quickDeclineReason.trim()) return;
    await upsertAttendance(quickDeclineEventId, 'declined', quickDeclineReason);
    setIsQuickDeclineOpen(false);
    toast({ title: "Absage gespeichert" });
  }

  const handlePayInitiate = (type: 'treasury' | 'fines') => {
    let amount = 0;
    if (type === 'treasury') {
      amount = Math.max(0, feeStatus.totalDebt);
    } else if (type === 'fines') {
      amount = Math.max(0, fineStatus);
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

    const typeLabel = selfPaymentType === 'treasury' ? 'Beitrag' : 'Strafen';
    const reference = `2. Herren RWS - ${typeLabel}: ${currentUserProfile.name}`;
    
    const emailOrLink = settings.treasuryPaypalEmail || settings.paypalMeLink;
    if (!emailOrLink) {
      toast({ variant: "destructive", title: "Fehler", description: "Keine PayPal Mannschaftskasse hinterlegt." });
      return;
    }

    navigator.clipboard.writeText(reference);
    toast({ 
      title: "Betreff kopiert!", 
      description: "Der Verwendungszweck wurde kopiert. Bitte füge ihn in der PayPal-App ein." 
    });

    if (emailOrLink.includes("paypal.me")) {
      let link = emailOrLink.trim();
      if (!link.startsWith('http')) link = `https://${link}`;
      const baseUrl = link.endsWith("/") ? link : `${link}/`;
      window.location.href = `${baseUrl}${amount.toFixed(2)}`;
    } else {
      window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(emailOrLink)}&amount=${amount.toFixed(2)}&currency_code=EUR&item_name=${encodeURIComponent(reference)}`;
    }
    setIsSelfPaymentDialogOpen(false);
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

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRoles={roles} />
      <MobileNavTrigger 
        userRoles={roles} 
        rightElement={
          isKassenwart && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-emerald-600 h-10 w-10 mr-1"
              onClick={() => setIsPaymentOpen(true)}
              title="Zahlung verbuchen"
            >
              <Banknote className="h-6 w-6" />
            </Button>
          )
        }
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-card border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          <div className="flex items-center gap-4">
            {isKassenwart && (
              <Button 
                variant="outline" 
                className="rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                onClick={() => setIsPaymentOpen(true)}
              >
                <Banknote className="h-4 w-4 mr-2" /> Zahlung verbuchen
              </Button>
            )}
            <span className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, d. MMMM', { locale: de })}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Dashboard</h1>
          </div>

          {rsvpReminder && (
            <Alert className="bg-primary/10 border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary rounded-xl text-white shrink-0 mt-0.5">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <AlertTitle className="font-black text-primary uppercase text-xs tracking-wider">Erinnerung: Termin steht an!</AlertTitle>
                    <AlertDescription className="text-sm font-medium text-foreground">
                      Du bist fürs <strong className="text-primary">{rsvpReminder.title}</strong> am {format(new Date(rsvpReminder.date), 'dd.MM. HH:mm')} eingeplant. Kannst du doch nicht kommen?
                    </AlertDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button 
                    size="sm" 
                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 h-10 px-4"
                    onClick={() => handleQuickRSVP(rsvpReminder.id, 'going')}
                   >
                     <Check className="h-4 w-4 mr-1.5" /> Ich bin dabei
                   </Button>
                   <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-xl font-bold border-destructive text-destructive hover:bg-destructive/10 h-10 px-4"
                    onClick={() => handleQuickRSVP(rsvpReminder.id, 'declined')}
                   >
                     <X className="h-4 w-4 mr-1.5" /> Absagen
                   </Button>
                </div>
              </div>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-none shadow-md bg-card rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Mein Beitragskonto</p>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400"><Banknote className="h-4 w-4" /></div>
                </div>
                {feeStatus.isExempt && feeStatus.totalDebt === 0 ? (
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-blue-600">BEFREIT</h2>
                    <p className="text-[10px] text-muted-foreground">Du bist vom Mitgliedsbeitrag befreit.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className={cn("text-2xl font-bold", feeStatus.totalDebt > 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {feeStatus.totalDebt > 0 ? `-${feeStatus.totalDebt.toFixed(2)}` : '0.00'} €
                      </h2>
                      <Button size="sm" variant="link" onClick={() => handlePayInitiate('treasury')} className="h-6 p-0 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        Bezahlen <ExternalLink className="h-3 w-3" />
                      </Button>
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
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-card rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Meine Strafen</p>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400"><Scale className="h-4 w-4" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className={cn("text-2xl font-bold", fineStatus > 0 ? 'text-destructive' : 'text-emerald-600')}>
                    {fineStatus > 0 ? `-${fineStatus.toFixed(2)}` : '0.00'} €
                  </h2>
                  <Button size="sm" variant="link" onClick={() => handlePayInitiate('fines')} className="h-6 p-0 text-xs font-bold text-amber-600 dark:text-blue-400 flex items-center gap-1">
                    Bezahlen <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {fineStatus > 0 ? 'Offene Vergehen aus dem Katalog' : 'Keine offenen Strafen'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-lg rounded-2xl bg-card border-l-4 border-l-blue-500 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CalendarDays className="h-5 w-5" /> Nächster Termin
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextEvent ? (
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[55px] bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-900/50">
                      <p className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400">{format(new Date(nextEvent.date), 'EEE', { locale: de })}</p>
                      <p className="text-xl font-black text-blue-900 dark:text-blue-100">{format(new Date(nextEvent.date), 'dd')}</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-base">{nextEvent.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                         <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(nextEvent.date), 'HH:mm')}</span>
                         {nextEvent.location && (
                           <a 
                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextEvent.location)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                           >
                             <MapPin className="h-3 w-3" /> {nextEvent.location}
                           </a>
                         )}
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

            <Card className="border-none shadow-lg rounded-2xl bg-card border-l-4 border-l-amber-500 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Trophy className="h-5 w-5" /> Ehrentabelle
                </CardTitle>
                <CardDescription>Kumulierte Strafen (nach Euro-Wert).</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border px-6 pb-4">
                  {finesRanking.map((p, idx) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                          idx === 0 ? "bg-yellow-400 text-yellow-950" : 
                          idx === 1 ? "bg-slate-300 text-slate-700" : 
                          idx === 2 ? "bg-amber-600 text-amber-50" : "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </div>
                        <span className={cn("text-sm font-semibold", idx < 3 ? "text-foreground" : "text-muted-foreground")}>{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{p.total.toFixed(2)} €</span>
                        {idx < 3 && <Medal className={cn("h-4 w-4", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-700")} />}
                      </div>
                    </div>
                  ))}
                  {finesRanking.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground italic">Keine Strafen erfasst.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isQuickDeclineOpen} onOpenChange={setIsQuickDeclineOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl bg-card">
            <DialogHeader>
              <DialogTitle>Termin absagen</DialogTitle>
              <DialogDescription>Bitte gib einen kurzen Grund für deine Absage an.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Grund (Pflichtfeld)</Label>
              <Textarea 
                placeholder="Z.B. Arbeit, Krankheit, Familie..." 
                value={quickDeclineReason} 
                onChange={(e) => setQuickDeclineReason(e.target.value)}
                className="mt-2 rounded-xl h-24"
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={confirmQuickDecline} 
                disabled={!quickDeclineReason.trim()} 
                className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold h-12"
              >
                Absage bestätigen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl bg-card">
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
                    {players.filter(p => p.email !== 'kasse@kickoff.de' && p.id !== 'team_treasury').map(p => (
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

        <Dialog open={isSelfPaymentDialogOpen} onOpenChange={setIsSelfPaymentDialogOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl bg-card">
            <DialogHeader>
              <DialogTitle>Zahlung vorbereiten</DialogTitle>
              <DialogDescription>
                Wie viel möchtest du für dein {selfPaymentType === 'treasury' ? 'Beitragskonto' : 'Strafenkonto'} bezahlen?
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
              
              <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vorgeschlagener Betreff:</Label>
                   <Copy className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium break-all">
                  2. Herren RWS - {selfPaymentType === 'treasury' ? 'Beitrag' : 'Strafen'}: {currentUserProfile.name}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Wird automatisch kopiert beim Klick auf "Weiter".</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePayConfirm} className="w-full h-12 rounded-2xl font-bold red-glow">
                Weiter zu PayPal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <IntroDialog />
      </main>
    </div>
  )
}
