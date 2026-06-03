"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, TeamEvent } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Trophy, Users, Info, ExternalLink, MapPin, Clock, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter, startOfDay } from "date-fns"
import { de } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { teamEvents, addTeamEvent, deleteTeamEvent, currentUserProfile, settings, loading: storeLoading } = useStore()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newType, setNewType] = useState<'training' | 'match' | 'social'>('training')
  const [newLocation, setNewLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isEditor = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'coach' || currentUserProfile?.role === 'assistant_coach'

  const handleAddEvent = async () => {
    if (!newTitle || !newDate || !newTime) return
    setIsSubmitting(true)
    try {
      const combinedDate = new Date(`${newDate}T${newTime}`)
      await addTeamEvent({
        title: newTitle,
        type: newType,
        date: combinedDate.toISOString(),
        location: newLocation,
      })
      setIsAddOpen(false)
      setNewTitle(""); setNewDate(""); setNewTime(""); setNewType("training"); setNewLocation("")
      toast({ title: "Termin hinzugefügt" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const upcomingEvents = teamEvents.filter(e => isAfter(new Date(e.date), startOfDay(new Date())))

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return <Users className="h-4 w-4" />;
      case 'match': return <Trophy className="h-4 w-4" />;
      case 'social': return <Info className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'match': return "bg-primary/10 text-primary border-primary/20";
      case 'social': return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-muted text-muted-foreground";
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile?.role} />
      <MobileNavTrigger userRole={currentUserProfile?.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" /> Teamkalender
          </h1>
          <div className="flex items-center gap-4">
            {settings.fupaLink && (
              <Button variant="outline" asChild className="rounded-xl border-blue-600 text-blue-700 hover:bg-blue-50">
                <a href={settings.fupaLink} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" /> FuPa.net
                </a>
              </Button>
            )}
            {settings.footballDeLink && (
              <Button variant="outline" asChild className="rounded-xl border-primary text-primary hover:bg-primary/5">
                <a href={settings.footballDeLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Fußball.de
                </a>
              </Button>
            )}
            {isEditor && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="cyan-glow rounded-xl"><Plus className="h-4 w-4 mr-2" /> Termin</Button></DialogTrigger>
                <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
                  <DialogHeader><DialogTitle>Neuer Termin</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Titel</Label><Input placeholder="Z.B. Training" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Datum</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Uhrzeit</Label><Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Typ</Label>
                      <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="match">Spiel</SelectItem>
                          <SelectItem value="social">Mannschaftsabend / Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Ort (Optional)</Label><Input placeholder="Z.B. Kunstrasen" value={newLocation} onChange={e => setNewLocation(e.target.value)} /></div>
                  </div>
                  <DialogFooter><Button onClick={handleAddEvent} disabled={isSubmitting} className="w-full rounded-xl">Speichern</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-20">
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Teamkalender</h1>
            <div className="flex flex-wrap gap-2">
              {settings.fupaLink && (
                <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] rounded-xl text-xs border-blue-600 text-blue-700">
                  <a href={settings.fupaLink} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-3 w-3 mr-1" /> FuPa.net
                  </a>
                </Button>
              )}
              {settings.footballDeLink && (
                <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] rounded-xl text-xs">
                  <a href={settings.footballDeLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> Fußball.de
                  </a>
                </Button>
              )}
              {isEditor && (
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button size="sm" className="flex-1 min-w-[120px] rounded-xl text-xs"><Plus className="h-3 w-3 mr-1" /> Termin</Button></DialogTrigger>
                    <DialogContent className="max-w-[95vw] rounded-2xl">
                      <DialogHeader><DialogTitle>Neuer Termin</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-1"><Label className="text-xs">Titel</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-10" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><Label className="text-xs">Datum</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-10" /></div>
                          <div className="space-y-1"><Label className="text-xs">Uhrzeit</Label><Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-10" /></div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Typ</Label>
                          <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="training">Training</SelectItem><SelectItem value="match">Spiel</SelectItem><SelectItem value="social">Event</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label className="text-xs">Ort</Label><Input value={newLocation} onChange={e => setNewLocation(e.target.value)} className="h-10" /></div>
                      </div>
                      <DialogFooter><Button onClick={handleAddEvent} disabled={isSubmitting} className="w-full">Speichern</Button></DialogFooter>
                    </DialogContent>
                 </Dialog>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <Card className="border-none shadow-sm bg-muted/20">
                <CardContent className="p-8 text-center text-muted-foreground italic">
                  Keine anstehenden Termine gefunden.
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((event) => (
                <Card key={event.id} className="border-none shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
                  <div className="flex h-full">
                    <div className={cn("w-2", event.type === 'training' ? 'bg-blue-500' : event.type === 'match' ? 'bg-primary' : 'bg-emerald-500')}></div>
                    <CardContent className="p-4 md:p-6 flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-center min-w-[60px]">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">{format(new Date(event.date), 'EEE', { locale: de })}</p>
                          <p className="text-xl font-bold">{format(new Date(event.date), 'dd')}</p>
                          <p className="text-[10px] font-medium">{format(new Date(event.date), 'MMM', { locale: de })}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", getTypeColor(event.type))}>
                               {getTypeIcon(event.type)}
                               <span className="ml-1 uppercase">{event.type === 'training' ? 'Training' : event.type === 'match' ? 'Spiel' : 'Event'}</span>
                             </span>
                          </div>
                          <h3 className="font-bold text-base md:text-lg">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(event.date), 'HH:mm')} Uhr</span>
                            {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                          </div>
                        </div>
                      </div>
                      {isEditor && (
                        <Button variant="ghost" size="icon" onClick={() => deleteTeamEvent(event.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
