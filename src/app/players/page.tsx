
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Role, Player } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCircle, ChevronRight, Save, Loader2, Trash2, Banknote, Check, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { de } from "date-fns/locale"

const AVAILABLE_ROLES: { id: Role, label: string }[] = [
  { id: 'player', label: 'Spieler' },
  { id: 'coach', label: 'Trainer' },
  { id: 'assistant_coach', label: 'Co-Trainer' },
  { id: 'admin', label: 'Admin' },
  { id: 'kassenwart', label: 'Kassenwart' },
  { id: 'strafenwart', label: 'Strafenwart' },
];

export default function PlayersPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { players, addPlayer, updatePlayer, deletePlayer, recordPayment, loading, currentUserProfile } = useStore()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRoles, setNewRoles] = useState<Role[]>(["player"])

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRoles, setEditRoles] = useState<Role[]>([])

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentPlayer, setPaymentPlayer] = useState<Player | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (loading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUserProfile) return null;

  const isAdmin = currentUserProfile.roles.includes('admin')
  const isKassenwart = currentUserProfile.roles.includes('kassenwart') || isAdmin

  if (!isAdmin && !isKassenwart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const displayPlayers = players.filter(p => p.email !== 'kasse@kickoff.de')

  const handleAddPlayer = async () => {
    if (!newName || !newEmail || newRoles.length === 0) return
    await addPlayer(newName, newEmail, newRoles)
    setIsAddOpen(false)
    setNewName(""); setNewEmail(""); setNewRoles(["player"])
    toast({ title: "Erfolgreich" })
  }

  const savePlayerChanges = () => {
    if (!editingPlayer || !editName || !editEmail || editRoles.length === 0) return
    updatePlayer(editingPlayer.id, { name: editName, email: editEmail, roles: editRoles })
    setIsEditOpen(false)
    toast({ title: "Aktualisiert" })
  }

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return
    try {
      await deletePlayer(playerToDelete.id)
      toast({ title: "Spieler gelöscht" })
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler beim Löschen" })
    } finally {
      setIsDeleteConfirmOpen(false)
      setPlayerToDelete(null)
    }
  }

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!paymentPlayer || isNaN(amount) || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await recordPayment(paymentPlayer.id, amount);
      setIsPaymentOpen(false);
      setPaymentAmount("");
      setPaymentPlayer(null);
      toast({ title: "Zahlung verbucht" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const exportDebtList = () => {
    const debtors = players.filter(p => p.balance < 0 && p.email !== 'kasse@kickoff.de');
    if (debtors.length === 0) {
      toast({ title: "Keine Schulden", description: "Alle Konten sind ausgeglichen oder im Plus." });
      return;
    }

    const dateStr = format(new Date(), 'dd.MM.yyyy', { locale: de });
    let text = `🍻 *Getränkekasse - Offene Schulden*\n(Stand: ${dateStr})\n\n`;

    debtors.sort((a, b) => a.balance - b.balance).forEach(p => {
      text += `• ${p.name}: ${p.balance.toFixed(2).replace('.', ',')} €\n`;
    });

    const totalDebt = debtors.reduce((sum, p) => sum + p.balance, 0);
    text += `\n*Gesamtsumme offen: ${Math.abs(totalDebt).toFixed(2).replace('.', ',')} €*`;
    text += `\n\nBitte zeitnah begleichen! 🤝`;

    navigator.clipboard.writeText(text);
    toast({ title: "Liste kopiert", description: "Der WhatsApp-Text ist in der Zwischenablage." });
  };

  const toggleRole = (role: Role, list: Role[], setter: (roles: Role[]) => void) => {
    if (list.includes(role)) {
      if (list.length > 1) {
        setter(list.filter(r => r !== role));
      }
    } else {
      setter([...list, role]);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRoles={currentUserProfile.roles} />
      <MobileNavTrigger userRoles={currentUserProfile.roles} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Spieler & Konten</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportDebtList} className="rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50">
              <Share2 className="h-4 w-4 mr-2" /> Schuldenliste exportieren
            </Button>
            {isAdmin && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="cyan-glow rounded-xl"><UserPlus className="h-4 w-4 mr-2" /> Neuer Spieler</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Neuer Spieler</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>E-Mail</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                    <div className="space-y-3">
                      <Label>Rollen (Mehrfachauswahl möglich)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_ROLES.map(role => (
                          <div key={role.id} className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Checkbox 
                              id={`role-${role.id}`} 
                              checked={newRoles.includes(role.id)}
                              onCheckedChange={() => toggleRole(role.id, newRoles, setNewRoles)}
                            />
                            <label htmlFor={`role-${role.id}`} className="text-xs font-medium leading-none cursor-pointer flex-1">
                              {role.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleAddPlayer} className="w-full h-11 rounded-xl">Anlegen</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-primary font-headline">Spieler</h1>
              {isAdmin && (
                <Button size="sm" className="cyan-glow rounded-xl" onClick={() => setIsAddOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Neu
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={exportDebtList} className="w-full rounded-xl border-emerald-600 text-emerald-700 h-10 text-xs">
              <Share2 className="h-3 w-3 mr-2" /> Schuldenliste exportieren
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayPlayers.map((player) => (
              <Card key={player.id} className="border-none shadow-md rounded-2xl bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary"><UserCircle className="h-8 w-8" /></div>
                    <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                      {player.roles.map(r => (
                        <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'} className="text-[9px] uppercase px-1.5 py-0">
                          {AVAILABLE_ROLES.find(ar => ar.id === r)?.label || r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{player.name}</h3>
                  <div className="flex items-center justify-between py-3 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Konto</p>
                      <p className={cn("text-lg font-bold", player.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {player.balance.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isKassenwart && player.balance < 0 && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Zahlung verbuchen"
                          onClick={() => { setPaymentPlayer(player); setPaymentAmount(Math.abs(player.balance).toString()); setIsPaymentOpen(true); }}
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => { setPlayerToDelete(player); setIsDeleteConfirmOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => { setEditingPlayer(player); setEditName(player.name); setEditEmail(player.email); setEditRoles(player.roles); setIsEditOpen(true); }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Spieler bearbeiten</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><Label>E-Mail</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
              <div className="space-y-3">
                <Label>Rollen</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_ROLES.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={`edit-role-${role.id}`} 
                        checked={editRoles.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id, editRoles, setEditRoles)}
                      />
                      <label htmlFor={`edit-role-${role.id}`} className="text-xs font-medium leading-none cursor-pointer flex-1">
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={savePlayerChanges} className="w-full h-11 rounded-xl">Speichern</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Schulden begleichen</DialogTitle>
              <DialogDescription>Zahlung für {paymentPlayer?.name} erfassen.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Betrag (€)</Label>
                <Input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRecordPayment} disabled={isSubmitting} className="w-full rounded-xl h-11 bg-emerald-600">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Verbuchen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[90vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Spieler wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du {playerToDelete?.name} wirklich aus der Liste entfernen? Dies kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
