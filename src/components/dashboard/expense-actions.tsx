
"use client"

import { useState } from "react"
import { Beer, Package, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"

interface ExpenseActionsProps {
  isAdmin?: boolean;
  currentUserId: string;
}

export function ExpenseActions({ isAdmin = false, currentUserId }: ExpenseActionsProps) {
  const { toast } = useToast()
  const { addExpense, settings } = useStore()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAdd = (type: 'beer' | 'crate') => {
    setLoading(type)
    
    // Simulate a brief delay for better UX feel
    setTimeout(() => {
      addExpense(currentUserId, type)
      setLoading(null)
      toast({
        title: "Erfolgreich!",
        description: `${type === 'beer' ? 'Bier' : 'Kasten'} verbucht.`,
      })
    }, 400)
  }

  return (
    <div className="grid gap-3 md:gap-4 md:grid-cols-2">
      <Card className="overflow-hidden border-none shadow-lg glass-card relative group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Beer className="h-16 md:h-24 w-16 md:w-24 text-primary rotate-12" />
        </div>
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-primary text-lg">
            <Beer className="h-5 w-5" />
            Bier
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p className="text-2xl md:text-3xl font-bold text-foreground mb-4">{settings.beerPrice.toFixed(2)} €</p>
          <Button 
            className="w-full h-14 md:h-12 rounded-xl text-lg font-bold cyan-glow transition-all active:scale-95 flex items-center justify-center gap-2" 
            onClick={() => handleAdd('beer')}
            disabled={!!loading}
          >
            {loading === 'beer' ? <PlusCircle className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            Bier eintragen
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-lg glass-card relative group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Package className="h-16 md:h-24 w-16 md:w-24 text-accent -rotate-12" />
        </div>
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-primary text-lg">
            <Package className="h-5 w-5" />
            Ganze Kiste
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p className="text-2xl md:text-3xl font-bold text-foreground mb-4">{settings.cratePrice.toFixed(2)} €</p>
          <Button 
            variant="outline"
            className="w-full h-14 md:h-12 rounded-xl text-lg font-bold border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all active:scale-95 flex items-center justify-center gap-2" 
            onClick={() => handleAdd('crate')}
            disabled={!!loading}
          >
            {loading === 'crate' ? <PlusCircle className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            Kiste eintragen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
