
"use client"

import { useState } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Role, Player } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCircle, MessageCircle, ChevronRight, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { draftPaymentReminder } from "@/ai/flows/ai-draft-payment-reminder"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PlayersPage() {
  const { toast } = useToast()
  const { players, addPlayer, updatePlayer } = useStore()
  const [drafting, setDrafting] = useState<string | null>(null)
  
  // States for Adding Player
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<Role>("player")

  // States for Editing Player
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<Role>("player")

  const handleAddPlayer = () => {
    if (!newName || !newEmail) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder aus." })
      return
    }
    addPlayer(newName, newEmail, newRole)
    setIsAddOpen(false)
    setNewName("")
    setNewEmail("")
    setNewRole("player")
    toast({ title: "Erfolgreich", description: "Spieler wurde hinzugefügt." })
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setEditName(player.name)
    setEditEmail(player.email)
    setEditRole(player.role)
    setIsEditOpen(true)
  }

  const savePlayerChanges = () => {
    if (!editingPlayer || !editName || !editEmail) return
    updatePlayer(editingPlayer.id, {
      name: editName,
      email: editEmail,
      role: editRole
    })
    setIsEditOpen(false)
    toast({ title: "Aktualisiert", description: "Spielerprofil wurde gespeichert." })
  }

  const handleDraftReminder = async (player: any) => {
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
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      <MobileNavTrigger userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Spielerverwaltung</h1>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl cyan-glow">
                <UserPlus className="mr-2 h-4 w-4" />
                Neuer Spieler
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Neuen Spieler hinzufügen</DialogTitle>
                <DialogDescription>Erstelle ein Profil für ein neues Teammitglied.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">E-Mail</Label>
                  <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Rolle</Label>
                  <Select value={newRole} onValueChange={(v: Role) => setNewRole(v)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Wähle eine Rolle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Spieler</SelectItem>
                      <SelectItem value="auditor">Kassenprüfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPlayer} className="rounded-xl w-full">Spieler erstellen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-primary font-headline">Spieler</h1>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-xl cyan-glow">
              <UserPlus className="h-4 w-4 mr-1" />
              Neu
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  
                  <div className="mb-4 min-h-[60px]">
                    <h3 className="text-xl font-bold text-foreground truncate">{player.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{player.email}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border mt-auto">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Kontostand</p>
                      <p className={cn(
                        "text-lg font-bold",
                        player.balance < 0 ? 'text-destructive' : 'text-emerald-600'
                      )}>
                        {player.balance.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {player.balance < 0 && (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="rounded-xl hover:bg-primary hover:text-white h-10 w-10"
                          onClick={() => handleDraftReminder(player)}
                          disabled={drafting === player.id}
                        >
                          <MessageCircle className={cn("h-4 w-4", drafting === player.id && "animate-pulse")} />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10" onClick={() => handleEditPlayer(player)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Edit Player Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Spielerprofil bearbeiten</DialogTitle>
              <DialogDescription>Verwalte die persönlichen Daten und Berechtigungen.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right text-xs">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right text-xs">E-Mail</Label>
                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right text-xs">Rolle</Label>
                <Select value={editRole} onValueChange={(v: Role) => setEditRole(v)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Wähle eine Rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Spieler</SelectItem>
                    <SelectItem value="auditor">Kassenprüfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={savePlayerChanges} className="rounded-xl w-full">
                <Save className="h-4 w-4 mr-2" />
                Änderungen speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
