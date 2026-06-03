
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Settings, Save, Beer, Package, Banknote, Link as LinkIcon, Mail, Scale, Plus, Trash2, Github, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const { toast } = useToast()
  const { settings, updateSettings, fineCatalog, updateFineType, addFineType, deleteFineType, currentUserProfile, loading: storeLoading } = useStore()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State Settings
  const [beerPrice, setBeerPrice] = useState("")
  const [cratePrice, setCratePrice] = useState("")
  const [monthlyFee, setMonthlyFee] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const [paypalMeLink, setPaypalMeLink] = useState("")
  const [clubhouseEmail, setClubhouseEmail] = useState("")
  const [treasuryEmail, setTreasuryEmail] = useState("")

  // Form State Fine Types
  const [newFineName, setNewFineName] = useState("")
  const [newFineAmount, setNewFineAmount] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (settings) {
      setBeerPrice(settings.beerPrice.toString())
      setCratePrice(settings.cratePrice.toString())
      setMonthlyFee(settings.monthlyFee.toString())
      setAnnualFee(settings.annualFee.toString())
      setPaypalMeLink(settings.paypalMeLink)
      setClubhouseEmail(settings.clubhousePaypalEmail)
      setTreasuryEmail(settings.treasuryPaypalEmail)
    }
  }, [settings])

  if (storeLoading || !mounted) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdmin = currentUserProfile?.role === 'admin'
  const isStrafenwart = currentUserProfile?.role === 'strafenwart'

  if (!currentUserProfile || (!isAdmin && !isStrafenwart)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        beerPrice: parseFloat(beerPrice),
        cratePrice: parseFloat(cratePrice),
        monthlyFee: parseFloat(monthlyFee),
        annualFee: parseFloat(annualFee),
        paypalMeLink,
        clubhousePaypalEmail: clubhouseEmail,
        treasuryPaypalEmail: treasuryEmail,
      })
      toast({ title: "Einstellungen gespeichert" })
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler beim Speichern" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddFineType = async () => {
    const val = parseFloat(newFineAmount)
    if (!newFineName || isNaN(val)) return
    setIsSaving(true)
    try {
      await addFineType(newFineName, val)
      setNewFineName("")
      setNewFineAmount("")
      toast({ title: "Strafe hinzugefügt" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateFineAmount = async (id: string, name: string, amountStr: string) => {
    const val = parseFloat(amountStr)
    if (isNaN(val)) return
    await updateFineType(id, name, val)
  }

  const copyGitCommand = () => {
    navigator.clipboard.writeText('git add . && git commit -m "Update" && git push')
    toast({ title: "Befehl kopiert", description: "Füge ihn jetzt im Terminal ein." })
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Administration
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-20">
          <Tabs defaultValue={isAdmin ? "general" : "fines"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 rounded-xl h-12">
              {isAdmin && <TabsTrigger value="general" className="rounded-lg">Preise & PayPal</TabsTrigger>}
              <TabsTrigger value="fines" className="rounded-lg">Strafenkatalog</TabsTrigger>
            </TabsList>

            {isAdmin && (
              <TabsContent value="general" className="space-y-6">
                <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Beer className="h-5 w-5 text-primary" />
                      Preise & Gebühren
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="beer-price">Preis pro Bier (€)</Label>
                      <Input id="beer-price" type="number" step="0.01" value={beerPrice} onChange={(e) => setBeerPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crate-price">Preis pro Kiste (€)</Label>
                      <Input id="crate-price" type="number" step="0.01" value={cratePrice} onChange={(e) => setCratePrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly-fee">Monatsbeitrag (€)</Label>
                      <Input id="monthly-fee" type="number" step="0.01" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annual-fee">Jahresbeitrag (€)</Label>
                      <Input id="annual-fee" type="number" step="0.01" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                      <LinkIcon className="h-5 w-5" />
                      Zahlungswege
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="paypal-me">PayPal.me Link (Optional für App-Start)</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="paypal-me" placeholder="https://paypal.me/DeinName" value={paypalMeLink} onChange={(e) => setPaypalMeLink(e.target.value)} className="pl-10" />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Trage hier deinen PayPal.me Link ein, um den direkten Start der PayPal-App zu forcieren.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treasury-email">PayPal E-Mail Schatzmeister</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="treasury-email" placeholder="email@paypal.com" value={treasuryEmail} onChange={(e) => setTreasuryEmail(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clubhouse-email">PayPal E-Mail Vereinsheim (Marlene)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="clubhouse-email" placeholder="marlene@verein.de" value={clubhouseEmail} onChange={(e) => setClubhouseEmail(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-slate-900 text-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      Änderungen live schalten
                    </CardTitle>
                    <CardDescription className="text-slate-400">Damit neue Features im Internet erscheinen, musst du sie pushen.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-xl font-mono text-xs break-all border border-slate-700 flex items-center justify-between gap-4">
                      <code className="text-slate-300">git add . && git commit -m "Update" && git push</code>
                      <Button size="icon" variant="ghost" onClick={copyGitCommand} className="h-8 w-8 text-slate-400 hover:text-white">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">Kopiere den Befehl und füge ihn in das Terminal ein (F1 {"->"} "Terminal").</p>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full rounded-xl h-12 font-bold cyan-glow">
                  {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  Haupteinstellungen speichern
                </Button>
              </TabsContent>
            )}

            <TabsContent value="fines" className="space-y-6">
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <Scale className="h-5 w-5" />
                    Strafenkatalog verwalten
                  </CardTitle>
                  <CardDescription>Definiere Vergehen und deren Standardpreise.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-5 items-end bg-muted/30 p-4 rounded-xl">
                    <div className="sm:col-span-3 space-y-2">
                      <Label>Neues Vergehen</Label>
                      <Input placeholder="Z.B. Trikot vergessen" value={newFineName} onChange={(e) => setNewFineName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Betrag (€)</Label>
                      <Input type="number" step="0.50" value={newFineAmount} onChange={(e) => setNewFineAmount(e.target.value)} />
                    </div>
                    <Button onClick={handleAddFineType} disabled={isSaving || !newFineName} className="rounded-xl w-full">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="divide-y divide-border pt-4">
                    {fineCatalog.map((fine) => (
                      <div key={fine.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="font-medium text-sm sm:flex-1">{fine.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 w-32">
                            <Input 
                              type="number" 
                              step="0.50" 
                              value={fine.amount} 
                              onChange={(e) => handleUpdateFineAmount(fine.id, fine.name, e.target.value)} 
                              className="h-9 text-right"
                            />
                            <span className="text-sm">€</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteFineType(fine.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
