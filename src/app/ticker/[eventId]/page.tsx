
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, TeamEvent, Ticker, TickerEvent, Player } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Trophy, Users, MessageSquare, Clock, Plus, Trash2, ShieldCheck, Flag, Replace, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function TickerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const eventId = params.eventId as string

  const [mounted, setMounted] = useState(false)
  const { 
    players, teamEvents, tickers, tickerEvents, claimTicker, releaseTicker, 
    updateTickerScore, addTickerEvent, deleteTickerEvent, currentUserProfile, loading 
  } = useStore()

  const [newMinute, setNewMinute] = useState("")
  const [newText, setNewText] = useState("")
  const [newType, setNewType] = useState<TickerEvent['type']>('comment')
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [selectedAssist, setSelectedAssist] = useState("")
  const [playerIn, setPlayerIn] = useState("")
  const [playerOut, setPlayerOut] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const event = useMemo(() => teamEvents.find(e => e.id === eventId), [teamEvents, eventId]);
  const ticker = useMemo(() => tickers.find(t => t.id === eventId) || {
    id: eventId, homeScore: 0, awayScore: 0, operatorId: null, status: 'pre'
  } as Ticker, [tickers, eventId]);

  const sortedEvents = useMemo(() => 
    tickerEvents.filter(e => e.eventId === eventId)
      .sort((a, b) => b.minute - a.minute || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [tickerEvents, eventId]
  );

  if (loading || !mounted) return <div className="flex h-svh items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!event || !currentUserProfile) return null;

  const isOperator = ticker.operatorId === currentUserProfile.id;
  const isAvailable = !ticker.operatorId;

  const handleAddEvent = async () => {
    if (!newMinute) return;
    setIsSubmitting(true);
    try {
      const p = players.find(x => x.id === selectedPlayer);
      const a = players.find(x => x.id === selectedAssist);
      const pin = players.find(x => x.id === playerIn);
      const pout = players.find(x => x.id === playerOut);

      await addTickerEvent(eventId, {
        type: newType,
        minute: parseInt(newMinute),
        playerId: selectedPlayer || undefined,
        playerName: p?.name,
        assistPlayerId: selectedAssist || undefined,
        assistPlayerName: a?.name,
        playerInId: playerIn || undefined,
        playerInName: pin?.name,
        playerOutId: playerOut || undefined,
        playerOutName: pout?.name,
        text: newText || undefined
      });

      if (newType === 'goal') {
        updateTickerScore(eventId, ticker.homeScore + 1, ticker.awayScore);
      }

      setNewText(""); setSelectedPlayer(""); setSelectedAssist(""); setPlayerIn(""); setPlayerOut("");
      toast({ title: "Event hinzugefügt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'sub': return <Replace className="h-4 w-4 text-blue-500" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      case 'status': return <Clock className="h-4 w-4 text-emerald-500" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRoles={currentUserProfile.roles} />
      <MobileNavTrigger userRoles={currentUserProfile.roles} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-4 md:px-8 bg-card border-b border-border sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
             <h1 className="text-lg font-bold text-primary font-headline truncate max-w-[150px] md:max-w-none">{event.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-2">
              <span className="text-lg font-black">{ticker.homeScore} : {ticker.awayScore}</span>
            </div>
            {isAvailable ? (
              <Button size="sm" onClick={() => claimTicker(eventId)} className="rounded-xl h-9 bg-emerald-600">Bedienen</Button>
            ) : isOperator ? (
              <Button size="sm" variant="outline" onClick={() => releaseTicker(eventId)} className="rounded-xl h-9">Freigeben</Button>
            ) : (
              <Badge variant="outline" className="h-9 px-3 rounded-xl border-amber-500 text-amber-600 bg-amber-50">
                Wird von {ticker.operatorName?.split(' ')[0]} bedient
              </Badge>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-24">
          {isOperator && (
            <Card className="border-none shadow-lg rounded-2xl bg-card border-l-4 border-l-primary overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Ticker-Konsole</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Minute</Label>
                    <Input type="number" placeholder="z.B. 45" value={newMinute} onChange={e => setNewMinute(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Aktionstyp</Label>
                    <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comment">Kommentar</SelectItem>
                        <SelectItem value="goal">Tor RWS2 (+1)</SelectItem>
                        <SelectItem value="sub">Wechsel RWS2</SelectItem>
                        <SelectItem value="status">Spielstatus (Anpfiff, Pause...)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {newType === 'goal' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Torschütze</Label>
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                          <SelectContent>
                            {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vorlage</Label>
                        <Select value={selectedAssist} onValueChange={setSelectedAssist}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine Vorlage</SelectItem>
                            {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {newType === 'sub' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Raus</Label>
                        <Select value={playerOut} onValueChange={setPlayerOut}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                          <SelectContent>
                            {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Rein</Label>
                        <Select value={playerIn} onValueChange={setPlayerIn}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                          <SelectContent>
                            {players.filter(p => p.email !== 'kasse@kickoff.de').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Kommentar / Info</Label>
                    <Input placeholder="Was passiert gerade?" value={newText} onChange={e => setNewText(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="flex gap-2">
                   <Button onClick={handleAddEvent} disabled={isSubmitting || !newMinute} className="flex-1 h-12 rounded-xl font-bold red-glow">
                     {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                     Event posten
                   </Button>
                   <div className="flex gap-1 border rounded-xl p-1 bg-muted/30">
                      <Button variant="ghost" size="sm" onClick={() => updateTickerScore(eventId, ticker.homeScore, ticker.awayScore + 1)} className="h-10 px-3 text-xs font-bold text-destructive">+ Gast-Tor</Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Spielverlauf
            </h3>
            
            <div className="relative space-y-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border z-0"></div>
              {sortedEvents.map((e) => (
                <div key={e.id} className="relative z-10 flex gap-4 animate-in fade-in slide-in-from-left-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-background",
                    e.type === 'goal' ? 'bg-yellow-400 text-yellow-950' : 
                    e.type === 'sub' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {getEventIcon(e.type)}
                  </div>
                  <Card className="flex-1 border-none shadow-sm rounded-2xl bg-card overflow-hidden">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="font-black text-sm">{e.minute}'</span>
                           <span className="text-[10px] font-bold uppercase text-muted-foreground">
                             {e.type === 'goal' ? 'Tor!' : e.type === 'sub' ? 'Wechsel' : 'Info'}
                           </span>
                        </div>
                        {e.type === 'goal' && (
                          <div className="space-y-0.5">
                            <p className="font-bold text-base">{e.playerName}</p>
                            {e.assistPlayerName && <p className="text-xs text-muted-foreground">V: {e.assistPlayerName}</p>}
                          </div>
                        )}
                        {e.type === 'sub' && (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-destructive">OUT: {e.playerOutName}</span>
                            <span className="text-emerald-600">IN: {e.playerInName}</span>
                          </div>
                        )}
                        {e.text && <p className="text-sm font-medium leading-relaxed">{e.text}</p>}
                      </div>
                      {isOperator && (
                        <Button variant="ghost" size="icon" onClick={() => deleteTickerEvent(eventId, e.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
              {sortedEvents.length === 0 && (
                <div className="p-12 text-center text-muted-foreground italic bg-muted/20 rounded-3xl border-2 border-dashed">
                  Noch keine Ticker-Einträge vorhanden.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
