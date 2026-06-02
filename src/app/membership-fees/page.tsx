
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, FEE_MONTHS, MONTHLY_FEE, ANNUAL_FEE } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, Banknote, Calendar, CreditCard, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function MembershipFeesPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { players, membershipFees, addMembershipFee, deleteMembershipFee, loading, currentUserProfile } = useStore()
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSeason = currentMonth < 6 ? currentYear - 1 : currentYear;
  
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason.toString())

  useEffect(() => { setMounted(true) }, [])

  const filteredPlayers = useMemo(() => players.filter(p => p.email !== 'kasse@kickoff.de'), [players]);

  if (loading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserProfile || currentUserProfile.role !== 'auditor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const handleToggleFee = (playerId: string, month: number) => {
    const season = parseInt(selectedSeason);
    const existing = membershipFees.find(f => f.playerId === playerId && f.month === month && f.year === season);
    
    if (existing) {
      deleteMembershipFee(existing.id);
      toast({ title: "Zahlung entfernt" });
    } else {
      addMembershipFee(playerId, 'monthly', season, month);
      toast({ title: "Zahlung erfasst" });
    }
  };

  const handleToggleAnnual = (playerId: string) => {
    const season = parseInt(selectedSeason);
    const existing = membershipFees.find(f => f.playerId === playerId && f.type === 'annual' && f.year === season);
    
    if (existing) {
      deleteMembershipFee(existing.id);
      toast({ title: "Jahresbeitrag entfernt" });
    } else {
      addMembershipFee(playerId, 'annual', season);
      toast({ title: "Jahresbeitrag erfasst" });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      <MobileNavTrigger userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Beitragskasse</h1>
            <Badge variant="outline" className="text-xs">15€ / Monat (Aug-Mai) • 150€ / Jahr</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-40 rounded-xl h-10">
                <SelectValue placeholder="Saison wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}/{currentYear % 100}</SelectItem>
                <SelectItem value={currentYear.toString()}>{currentYear}/{(currentYear + 1) % 100}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <Banknote className="h-6 w-6" />
                    Zahlungs-Matrix
                  </CardTitle>
                  <CardDescription>Übersicht der Mannschaftskassenbeiträge für Saison {selectedSeason}/{(parseInt(selectedSeason)+1)%100}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-[180px] font-bold">Spieler</TableHead>
                    <TableHead className="text-center font-bold">Jahreszahler</TableHead>
                    {FEE_MONTHS.map(m => (
                      <TableHead key={m} className="text-center font-bold px-2">{MONTH_NAMES[m]}</TableHead>
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
                        <TableCell className="font-semibold py-4">{player.name}</TableCell>
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
                                  "rounded-lg h-8 w-8 p-0 transition-all",
                                  isPaid && !isAnnual ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "",
                                  isAnnual ? "bg-emerald-200 text-emerald-700 opacity-100" : "hover:bg-muted"
                                )}
                                onClick={() => handleToggleFee(player.id, m)}
                              >
                                {isPaid ? <Check className="h-4 w-4" /> : <X className="h-3 w-3 text-muted-foreground/30" />}
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
        </div>
      </main>
    </div>
  )
}
