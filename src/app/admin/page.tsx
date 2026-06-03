
"use client"

import { useState, useEffect } from "react"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Settings, Save, Beer, Package, Banknote, Link as LinkIcon, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function AdminPage() {
  const { toast } = useToast()
  const { settings, updateSettings, currentUserProfile, loading: storeLoading } = useStore()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [beerPrice, setBeerPrice] = useState("")
  const [cratePrice, setCratePrice] = useState("")
  const [monthlyFee, setMonthlyFee] = useState("")
  const [annualFee, setAnnualFee] = useState("")
  const [paypalMeLink, setPaypalMeLink] = useState("")
  const [clubhouseEmail, setClubhouseEmail] = useState("")
  const [treasuryEmail, setTreasuryEmail] = useState("")

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

  if (!currentUserProfile || currentUserProfile.role !== 'auditor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
        <Button onClick={() => window.location.href = "/"} className="mt-4">Zurück</Button>
      </div>
    )
  }

  const handleSave = async () => {
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
      toast({ title: "Einstellungen gespeichert", description: "Alle Änderungen wurden erfolgreich übernommen." })
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler beim Speichern" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole="auditor" />
      <MobileNavTrigger userRole="auditor" />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Administration
          </h1>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl cyan-glow">
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full pb-20">
          <div className="md:hidden flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary font-headline">Admin</h1>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="rounded-xl">
              <Save className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6">
            <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beer className="h-5 w-5 text-primary" />
                  Preise & Gebühren
                </CardTitle>
                <CardDescription>Passe die Beträge für Getränke und Vereinsbeiträge an.</CardDescription>
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
                  Zahlungswege (PayPal)
                </CardTitle>
                <CardDescription>Konfiguriere die Zieladressen für PayPal-Zahlungen.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="treasury-email">PayPal E-Mail Schatzmeister (Getränke & Beiträge)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="treasury-email" placeholder="email@paypal.com" value={treasuryEmail} onChange={(e) => setTreasuryEmail(e.target.value)} className="pl-10" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Wohin die Spieler ihr Geld für Getränke und Mitgliedschaft senden.</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="clubhouse-email">PayPal E-Mail Vereinsheim (Marlene)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="clubhouse-email" placeholder="marlene@verein.de" value={clubhouseEmail} onChange={(e) => setClubhouseEmail(e.target.value)} className="pl-10" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Zieladresse für die monatliche Kisten-Abrechnung der Mannschaft.</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="paypal-me">PayPal.me Link (für KI-Erinnerungen)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="paypal-me" placeholder="https://paypal.me/DeinName" value={paypalMeLink} onChange={(e) => setPaypalMeLink(e.target.value)} className="pl-10" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Wird von der KI in Zahlungsaufforderungen eingefügt.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden">
             <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl h-12 font-bold">
               {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
               Einstellungen speichern
             </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
