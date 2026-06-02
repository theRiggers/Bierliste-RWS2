"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MOCK_PLAYERS } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, UserCircle, MessageCircle, MoreHorizontal, TrendingDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { draftPaymentReminder } from "@/ai/flows/ai-draft-payment-reminder"
import { useToast } from "@/hooks/use-toast"

export default function PlayersPage() {
  const { toast } = useToast()
  const [players, setPlayers] = useState(MOCK_PLAYERS)
  const [drafting, setDrafting] = useState<string | null>(null)

  const handleDraftReminder = async (player: typeof MOCK_PLAYERS[0]) => {
    if (player.balance >= 0) return
    
    setDrafting(player.id)
    try {
      const result = await draftPaymentReminder({
        playerName: player.name,
        outstandingAmount: Math.abs(player.balance)
      })
      
      toast({
        title: `Erinnerung für ${player.name}`,
        description: result.reminderMessage,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "KI konnte keine Nachricht entwerfen."
      })
    } finally {
      setDrafting(null)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Spielerverwaltung</h1>
          <Button className="rounded-xl cyan-glow">
            <UserPlus className="mr-2 h-4 w-4" />
            Neuer Spieler
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Card key={player.id} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <Badge variant={player.role === 'auditor' ? 'default' : 'secondary'} className="rounded-lg">
                      {player.role === 'auditor' ? 'Kassenprüfer' : 'Spieler'}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.email}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Kontostand</p>
                      <p className={`text-lg font-bold ${player.balance < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {player.balance.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {player.balance < 0 && (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="rounded-xl hover:bg-primary hover:text-white"
                          onClick={() => handleDraftReminder(player)}
                          disabled={drafting === player.id}
                        >
                          <MessageCircle className={`h-4 w-4 ${drafting === player.id ? 'animate-pulse' : ''}`} />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="rounded-xl">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}