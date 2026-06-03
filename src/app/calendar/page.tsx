
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, TeamEvent } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Trophy, Users, Info, ExternalLink, MapPin, Clock, Globe, CalendarDays, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter, startOfDay } from "date-fns"
import { de } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

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
  
  // Bulk Add State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkDates, setBulkDates] = useState<Date[]>([])
  const [bulkTitle, setBulkTitle] = useState("Training")
  const [bulkLocation, setBulkLocation] = useState("")
  const [sameTimeForAll, setSameTimeForAll] = useState(true)
  const [globalTime, setGlobalTime] = useState("19:00")
  const [individualTimes, setIndividualTimes] = useState<Record<string, string>>({})
  
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
    if (bulkDates.length === 0 || !bulkTitle) return
    setIsSubmitting(true)
    try {
      for (const date of bulkDates) {
        const dateStr = format(date, 'yyyy-MM-dd')
        const timeStr = sameTimeForAll ? globalTime : (individualTimes[dateStr] || globalTime)
        const combinedDate = new Date(`${dateStr}T${timeStr}`)
        
        await addTeamEvent({
          title: bulkTitle,
          type: 'training',
          date: combinedDate.toISOString(),
          location: bulkLocation,
        })
      }
      setIsBulkOpen(false)
      setBulkDates([])
      toast({ title: `${bulkDates.length} Termine erstellt` })
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
            {isEditor && (
              <>
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-blue-600 text-blue-700 hover:bg-blue-50">
                      <CalendarDays className="h-4 w-4 mr-2" /> Serientermine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-3xl rounded-3xl h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-4 md:p-6 pb-2 shrink-0 border-b md:border-none">
                      <DialogTitle className="text-xl md:text-2xl">Serientermine hinzufügen</DialogTitle>
                      <DialogDescription className="text-xs md:text-sm">Wähle Tage aus und erstelle mehrere Trainings in einem Schritt.</DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1">
                      <div className="p-4 md:p-6 space-y-8">
                        {/* Mobile Step Indicator or just flow */}
                        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                          {/* Calendar Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-bold flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">1</span>
                                Daten im Kalender wählen
                              </Label>
                              <Badge variant="secondary" className="rounded-lg text-[10px]">
                                {bulkDates.length} Tage gewählt
                              </Badge>
                            </div>
                            <div className="flex justify-center bg-muted/20 p-4 rounded-2xl border border-dashed">
                              <Calendar
                                mode="multiple"
                                selected={bulkDates}
                                onSelect={(dates) => setBulkDates(dates || [])}
                                className="rounded-xl bg-white shadow-sm w-fit scale-90 sm:scale-100"
                                locale={de}
                              />
                            </div>
                          </div>
                          
                          {/* Settings Section */}
                          <div className="space-y-6">
                            <Label className="text-sm font-bold flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">2</span>
                              Details festlegen
                            </Label>
                            
                            <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground ml-1">Titel</Label>
                                <Input 
                                  value={bulkTitle} 
                                  onChange={e => setBulkTitle(e.target.value)} 
                                  placeholder="Z.B. Training"
                                  className="h-11 rounded-xl bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground ml-1">Ort (Optional)</Label>
                                <Input 
                                  value={bulkLocation} 
                                  onChange={e => setBulkLocation(e.target.value)} 
                                  placeholder="Z.B. Kunstrasen"
                                  className="h-11 rounded-xl bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-4 bg-white p-4 rounded-2xl border border-primary/10 shadow-sm">
                              <div className="flex items-center justify-between pb-2 border-b">
                                <div className="space-y-0.5">
                                  <Label htmlFor="same-time-mobile" className="cursor-pointer text-sm font-bold">Gleiche Uhrzeit?</Label>
                                  <p className="text-[10px] text-muted-foreground">Einmalig festlegen für alle Tage.</p>
                                </div>
                                <Switch id="same-time-mobile" checked={sameTimeForAll} onCheckedChange={setSameTimeForAll} />
                              </div>
                              
                              {sameTimeForAll ? (
                                <div className="space-y-2 pt-2">
                                  <Label className="text-xs text-muted-foreground ml-1">Startzeit</Label>
                                  <Input 
                                    type="time" 
                                    value={globalTime} 
                                    onChange={e => setGlobalTime(e.target.value)} 
                                    className="h-11 rounded-xl text-lg font-bold"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-3 pt-2">
                                  <Label className="text-[10px] text-primary uppercase font-bold tracking-wider">Individuelle Zeiten je Tag</Label>
                                  <div className="grid gap-2">
                                    {bulkDates.sort((a, b) => a.getTime() - b.getTime()).map((date) => {
                                      const ds = format(date, 'yyyy-MM-dd')
                                      return (
                                        <div key={ds} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold truncate capitalize">{format(date, 'EEEE', { locale: de })}</p>
                                            <p className="text-[10px] text-muted-foreground">{format(date, 'dd. MMMM', { locale: de })}</p>
                                          </div>
                                          <Input 
                                            type="time" 
                                            className="w-28 h-9 rounded-lg text-sm bg-white font-medium" 
                                            value={individualTimes[ds] || globalTime}
                                            onChange={(e) => setIndividualTimes(prev => ({ ...prev, [ds]: e.target.value }))}
                                          />
                                        </div>
                                      )
                                    })}
                                    {bulkDates.length === 0 && (
                                      <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed">
                                        <p className="text-xs italic text-muted-foreground">Wähle zuerst Daten im Kalender aus.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 md:p-6 bg-muted/50 border-t shrink-0">
                      <Button 
                        onClick={handleBulkAdd} 
                        disabled={isSubmitting || bulkDates.length === 0} 
                        className="w-full h-14 md:h-12 rounded-2xl font-bold text-lg md:text-base cyan-glow"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        ) : (
                          <Plus className="mr-2 h-5 w-5" />
                        )}
                        {bulkDates.length} Termine jetzt erstellen
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
            <div className="flex flex-wrap gap-2">
               {settings.fupaLink && (
                  <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] rounded-xl text-[10px] border-blue-600 text-blue-700 h-9">
                    <a href={settings.fupaLink} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3 mr-1" /> FuPa.net
                    </a>
                  </Button>
                )}
                {settings.footballDeLink && (
                  <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] rounded-xl text-[10px] h-9">
                    <a href={settings.footballDeLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> Fußball.de
                    </a>
                  </Button>
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
