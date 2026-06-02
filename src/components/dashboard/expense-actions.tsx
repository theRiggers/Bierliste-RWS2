"use client"

import { useState } from "react"
import { Beer, Package, PlusCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BEER_PRICE, CRATE_PRICE } from "@/lib/store"

export function ExpenseActions({ isAdmin = false }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAdd = (type: 'beer' | 'crate') => {
    setLoading(type)
    // Simulate API call
    setTimeout(() => {
      setLoading(null)
      toast({
        title: "Erfolgreich eingetragen!",
        description: `Dein ${type === 'beer' ? 'Bier' : 'Kasten'} wurde verbucht.`,
      })
    }, 800)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="overflow-hidden border-none shadow-lg glass-card relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Beer className="h-24 w-24 text-primary rotate-12" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Beer className="h-5 w-5" />
            Einzelnes Bier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground mb-4">{BEER_PRICE.toFixed(2)} €</p>
          <Button 
            className="w-full h-12 rounded-xl text-lg font-bold cyan-glow transition-all active:scale-95" 
            size="lg"
            onClick={() => handleAdd('beer')}
            disabled={!!loading}
          >
            {loading === 'beer' ? <PlusCircle className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            Bier eintragen
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-lg glass-card relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Package className="h-24 w-24 text-accent -rotate-12" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            Ganze Kiste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground mb-4">{CRATE_PRICE.toFixed(2)} €</p>
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl text-lg font-bold border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all active:scale-95" 
            size="lg"
            onClick={() => handleAdd('crate')}
            disabled={!!loading}
          >
            {loading === 'crate' ? <PlusCircle className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            Kiste eintragen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}