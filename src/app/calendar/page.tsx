
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, TeamEvent } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Trophy, Users, Info, ExternalLink, MapPin, Clock, Globe, CalendarDays, Check, X, Calendar as CalendarDaysIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter, startOfDay, addDays, getDay, parseISO, isBefore } from "date-fns"
import { de } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

const WEEKDAYS = [
  { id: 1, name: "Montag", short: "Mo" },
  { id: 2, name: "Dienstag", short: "Di" },
  { id: 3, name: "Mittwoch", short: "Mi" },
  { id: 4, name: "Donnerstag", short: "Do" },
  { id: 5, name: "Freitag", short: "Fr" },
  { id: 6, name: "Samstag", short: "Sa" },
  { id: 0, name: "Sonntag", short: "So" },
]

export default function CalendarPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { teamEvents, addTeamEvent, deleteTeamEvent, currentUserProfile, settings, loading: storeLoading } = useStore()
  
  // Single Add State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newType, setNewType] = useState<'training' | 'match' | 'social'>('training')
  const [newLocation, setNewLocation] = useState("")
  
  // Bulk Add State (New Logic)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkTitle, setBulkTitle] = useState("Training")
  const [bulkLocation, setBulkLocation] = useState("")
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [weekdayTimes, setWeekdayTimes] = useState<Record<number, string>>({})
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState("")
  
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

  const handleBulkAdd = async () => {
    if (selectedWeekdays.length === 0 || !bulkTitle || !startDate || !endDate) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder aus." })
      return
    }

    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (isAfter(start, end)) {
      toast({ variant: "destructive", title: "Fehler", description: "Enddatum muss nach dem Startdatum liegen." })
      return
    }

    setIsSubmitting(true)
    let count = 0
    try {
      let current = start
      while (isBefore(current, addDays(end, 1))) {
        const dayIdx = getDay(current)
        if (selectedWeekdays.includes(dayIdx)) {
          const time = weekdayTimes[dayIdx] || "19:00"
          const dateStr = format(current, 'yyyy-MM-dd')
          
          await addTeamEvent({
            title: bulkTitle,
            type: 'training',
            date: new Date(`${dateStr}T${time}`).toISOString(),
            location: bulkLocation,
          })
          count++
        }
        current = addDays(current, 1)
      }
      
      setIsBulkOpen(false)
      setSelectedWeekdays([])
      setWeekdayTimes({})
      setEndDate("")
      toast({ title: "Erfolg", description: `${count} Trainingstermine wurden erstellt.` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleWeekday = (id: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    )
    if (!weekdayTimes[id]) {
      setWeekdayTimes(prev => ({ ...prev, [id]: "19:00" }))
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
            {isEditor && (
              <>
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-blue-600 text-blue-700 hover:bg-blue-50">
                      <CalendarDays className="h-4 w-4 mr-2" /> Serientermine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-2xl rounded-3xl h-[85vh] md:h-auto flex flex-col p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 pb-2 shrink-0 border-b">
                      <DialogTitle className="text-xl md:text-2xl">Serientermine erstellen</DialogTitle>
                      <DialogDescription>Erstelle Trainings automatisch für einen Zeitraum.</DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1">
                      <div className="p-6 space-y-8">
                        {/* Title & Location */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Titel</Label>
                            <Input value={bulkTitle} onChange={e => setBulkTitle(e.target.value)} placeholder="Z.B. Training" className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Ort (Optional)</Label>
                            <Input value={bulkLocation} onChange={e => setBulkLocation(e.target.value)} placeholder="Z.B. Kunstrasen" className="h-11 rounded-xl" />
                          </div>
                        </div>

                        {/* Weekday Selection */}
                        <div className="space-y-4">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">1</span>
                            Trainingstage wählen
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {WEEKDAYS.map((day) => (
                              <Button
                                key={day.id}
                                variant={selectedWeekdays.includes(day.id) ? "default" : "outline"}
                                className={cn(
                                  "h-12 w-12 rounded-xl text-xs font-bold p-0 transition-all",
                                  selectedWeekdays.includes(day.id) ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "hover:bg-blue-50"
                                )}
                                onClick={() => toggleWeekday(day.id)}
                              >
                                {day.short}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Times for Weekdays */}
                        {selectedWeekdays.length > 0 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-sm font-bold flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">2</span>
                              Uhrzeiten festlegen
                            </Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {WEEKDAYS.filter(d => selectedWeekdays.includes(d.id)).map(day => (
                                <div key={day.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                                  <span className="text-sm font-bold">{day.name}</span>
                                  <Input 
                                    type="time" 
                                    className="w-28 h-9 rounded-lg bg-white" 
                                    value={weekdayTimes[day.id] || "19:00"}
                                    onChange={(e) => setWeekdayTimes(prev => ({ ...prev, [day.id]: e.target.value }))}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Date Range */}
                        <div className="space-y-4">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">3</span>
                            Zeitraum festlegen
                          </Label>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground ml-1">Startdatum</Label>
                              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground ml-1">Enddatum</Label>
                              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 rounded-xl" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 bg-muted/50 border-t">
                      <Button 
                        onClick={handleBulkAdd} 
                        disabled={isSubmitting || selectedWeekdays.length === 0 || !endDate} 
                        className="w-full h-12 rounded-2xl font-bold cyan-glow"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                        Termine jetzt generieren
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild><Button className="cyan-glow rounded-xl"><Plus className="h-4 w-4 mr-2" /> Einzeltermin</Button></DialogTrigger>
                  <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle>Neuer Einzeltermin</DialogTitle></DialogHeader>
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
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-20">
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Teamkalender</h1>
            <div className="flex flex-wrap gap-2">
              {isEditor && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsBulkOpen(true)} className="flex-1 min-w-[120px] rounded-xl text-xs border-blue-600 text-blue-700 h-10">
                    <CalendarDays className="h-3 w-3 mr-1" /> Serientermine
                  </Button>
                  <Button size="sm" className="flex-1 min-w-[120px] rounded-xl text-xs h-10" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Einzeltermin
                  </Button>
                </>
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
