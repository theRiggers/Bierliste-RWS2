
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore, Role, Player } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCircle, ChevronRight, Save, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function PlayersPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const { players, addPlayer, updatePlayer, deletePlayer, loading, currentUserProfile } = useStore()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<Role>("player")

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<Role>("player")

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  useEffect(() => { setMounted(true) }, [])

  if (loading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdmin = currentUserProfile?.role === 'admin'

  if (!currentUserProfile || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const displayPlayers = players.filter(p => p.email !== 'kasse@kickoff.de')

  const handleAddPlayer = async () => {
    if (!newName || !newEmail) return
    await addPlayer(newName, newEmail, newRole)
    setIsAddOpen(false)
    setNewName(""); setNewEmail(""); setNewRole("player")
    toast({ title: "Erfolgreich" })
  }

  const savePlayerChanges = () => {
    if (!editingPlayer || !editName || !editEmail) return
    updatePlayer(editingPlayer.id, { name: editName, email: editEmail, role: editRole })
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

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline">Spielerverwaltung</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="cyan-glow rounded-xl"><UserPlus className="h-4 w-4 mr-2" /> Neuer Spieler</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuer Spieler</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">E-Mail</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Rolle</Label>
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Spieler</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="kassenwart">Kassenwart</SelectItem>
                      <SelectItem value="strafenwart">Strafenwart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddPlayer} className="w-full">Anlegen</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Spieler</h1>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild><Button size="sm" className="cyan-glow rounded-xl"><UserPlus className="h-4 w-4 mr-1" /> Neu</Button></DialogTrigger>
              <DialogContent className="max-w-[90vw] rounded-2xl">
                <DialogHeader><DialogTitle>Neuer Spieler</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>E-Mail</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Rolle</Label>
                    <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Spieler</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="kassenwart">Kassenwart</SelectItem>
                        <SelectItem value="strafenwart">Strafenwart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button onClick={handleAddPlayer} className="w-full">Anlegen</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayPlayers.map((player) => (
              <Card key={player.id} className="border-none shadow-md rounded-2xl bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary"><UserCircle className="h-8 w-8" /></div>
                    <Badge variant={player.role === 'admin' ? 'default' : 'secondary'}>{player.role}</Badge>
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
                        onClick={() => { setEditingPlayer(player); setEditName(player.name); setEditEmail(player.email); setEditRole(player.role); setIsEditOpen(true); }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Spieler bearbeiten</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><Label>E-Mail</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Spieler</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kassenwart">Kassenwart</SelectItem>
                    <SelectItem value="strafenwart">Strafenwart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={savePlayerChanges} className="w-full">Speichern</Button></DialogFooter>
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
