
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Role, Player } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCircle, MessageCircle, ChevronRight, Save, Loader2, Banknote, Beer, Package, Trash2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { draftPaymentReminder } from "@/ai/flows/ai-draft-payment-reminder"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PlayersPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { players, addPlayer, updatePlayer, deletePlayer, recordPayment, addExpense, loading, currentUserProfile } = useStore()
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

  // States for Recording Payment
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentPlayer, setPaymentPlayer] = useState<Player | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  // State for Deleting Player
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const displayPlayers = players.filter(p => p.email !== 'kasse@kickoff.de')

  const handleAddPlayer = async () => {
    if (!newName || !newEmail) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte fülle alle Felder aus." })
      return
    }
    await addPlayer(newName, newEmail, newRole)
    setIsAddOpen(false)
    setNewName("")
    setNewEmail("")
    setNewRole("player")
    toast({ title: "Erfolgreich", description: "Spielerprofil wurde angelegt." })
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setEditName(player.name)
    setEditEmail(player.email)
    setEditRole(player.role)
    setIsEditOpen(true)
  }

  const handleOpenPayment = (player: Player) => {
    setPaymentPlayer(player)
    setPaymentAmount("")
    setIsPaymentOpen(true)
  }

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (!paymentPlayer || isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte gib einen gültigen Betrag ein." })
      return
    }
    recordPayment(paymentPlayer.id, amount)
    setIsPaymentOpen(false)
  }

  const handleQuickAdd = (playerId: string, playerName: string, type: 'beer' | 'crate') => {
    addExpense(playerId, type)
    toast({ 
      title: "Buchung erfolgreich", 
      description: `${type === 'beer' ? 'Ein Bier' : 'Eine Kiste'} für ${playerName} verbucht.` 
    })
  }

  const savePlayerChanges = () => {
    if (!editingPlayer || !editName || !editEmail) return
    updatePlayer(editingPlayer.id, {
      name: editName,
      email: editEmail,
      role: editRole
    })
    setIsEditOpen(false)
    toast({ title: "Aktualisiert" })
  }

  const handleDeleteRequest = (player: Player) => {
    if (player.id === currentUserProfile.id) return
    setPlayerToDelete(player)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return
    await deletePlayer(playerToDelete.id)
    setIsDeleteConfirmOpen(false)
    setPlayerToDelete(null)
  }

  const handleDraftReminder = async (player: any) => {
    if (player.balance >= 0) return
    setDrafting(player.id)
    try {
      const result = await draftPaymentReminder({ playerName: player.name, outstandingAmount: Math.abs(player.balance) })
      toast({ title: `Erinnerung für ${player.name}`, description: result.reminderMessage })
    } catch (error) {
      toast({ variant: "destructive", title: "KI-Fehler" })
    } finally {
      setDrafting(null)
    }
  }

  const AddPlayerDialogTrigger = ({ variant = "default" }: { variant?: "default" | "mobile" }) => (
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogTrigger asChild>
        <Button size={variant === "mobile" ? "icon" : "default"} variant={variant === "mobile" ? "ghost" : "default"} className={cn("rounded-xl", variant !== "mobile" && "cyan-glow")}>
          <UserPlus className={cn("h-4 w-4", variant === "mobile" ? "h-6 w-6" : "mr-2")} />
          {variant !== "mobile" && "Neuer Spieler"}
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
            <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" placeholder="Z.B. Max Mustermann" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">E-Mail</Label>
            <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" placeholder="spieler@beispiel.de" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Rolle</Label>
            <Select value={newRole} onValueChange={(v: Role) => setNewRole(v)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Spieler</SelectItem>
                <SelectItem value="auditor">Kassenprüfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted/30 p-3 rounded-xl flex gap-3 items-start col-span-4 mt-2">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Der Spieler kann sich mit dieser E-Mail registrieren.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddPlayer} className="rounded-xl w-full">Profil anlegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      <MobileNavTrigger 
        userRole="auditor" 
        rightElement={<AddPlayerDialogTrigger variant="mobile" />} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Spielerverwaltung</h1>
          <AddPlayerDialogTrigger />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden mb-2">
            <h1 className="text-2xl font-bold text-primary font-headline">Spieler</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayPlayers.map((player) => (
              <Card key={player.id} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={player.role === 'auditor' ? 'default' : 'secondary'} className="rounded-lg">
                        {player.role === 'auditor' ? 'Kassenprüfer' : 'Spieler'}
                      </Badge>
                      {player.id !== currentUserProfile.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full" onClick={() => handleDeleteRequest(player)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 min-h-[60px]">
                    <h3 className="text-xl font-bold text-foreground truncate">{player.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px] rounded-lg bg-amber-100 text-amber-700" onClick={() => handleQuickAdd(player.id, player.name, 'beer')}>
                        <Beer className="h-3 w-3 mr-1" /> Bier
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px] rounded-lg bg-primary/10 text-primary" onClick={() => handleQuickAdd(player.id, player.name, 'crate')}>
                        <Package className="h-3 w-3 mr-1" /> Kiste
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border mt-auto">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Kontostand</p>
                      <p className={cn("text-lg font-bold", player.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {player.balance.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="rounded-xl hover:bg-emerald-500 hover:text-white h-10 w-10 border-emerald-200 text-emerald-600" onClick={() => handleOpenPayment(player)}>
                        <Banknote className="h-4 w-4" />
                      </Button>
                      {player.balance < 0 && (
                        <Button size="icon" variant="outline" className="rounded-xl hover:bg-primary hover:text-white h-10 w-10" onClick={() => handleDraftReminder(player)} disabled={drafting === player.id}>
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
              <DialogTitle>Spieler bearbeiten</DialogTitle>
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
                    <SelectValue placeholder="Rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Spieler</SelectItem>
                    <SelectItem value="auditor">Kassenprüfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={savePlayerChanges} className="rounded-xl w-full">Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Zahlung erfassen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-amount" className="text-right text-xs">Betrag (€)</Label>
                <Input id="payment-amount" type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRecordPayment} className="rounded-xl w-full bg-emerald-600 hover:bg-emerald-700">Verbuchen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Spieler löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Bist du sicher, dass du <strong>{playerToDelete?.name}</strong> löschen möchtest?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlayer} className="bg-destructive hover:bg-destructive/90 text-white">Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
