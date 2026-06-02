
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileNavTrigger } from "@/components/layout/sidebar"
import { useStore } from "@/lib/store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Search, Loader2, Beer, Package, Banknote, Trash2, ShoppingCart, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
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
import { Button } from "@/components/ui/button"

export default function HistoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const { user, loading: authLoading } = useUser()
  const { expenses, payments, treasuryExpenses, membershipTransactions, currentUserProfile, deleteExpense, deletePayment, deleteTreasuryExpense, deleteMembershipTransaction, loading: storeLoading } = useStore()
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, category: 'expense' | 'payment' | 'treasury' | 'membershipTransaction' } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login")
    }
  }, [mounted, authLoading, user, router])

  const combinedHistory = useMemo(() => {
    const formattedExpenses = expenses.map(e => ({
      id: e.id,
      playerId: e.playerId,
      playerName: e.playerName,
      type: e.itemType,
      amount: -e.cost,
      date: e.date,
      category: 'expense' as const
    }));

    const formattedPayments = payments.map(p => ({
      id: p.id,
      playerId: p.playerId,
      playerName: p.playerName,
      type: 'payment',
      amount: p.amount,
      date: p.date,
      category: 'payment' as const
    }));

    const formattedTreasury = treasuryExpenses.map(t => ({
      id: t.id,
      playerId: 'bierliste',
      playerName: 'Bierliste (Gesamt)',
      type: 'treasury',
      description: t.description,
      amount: -t.amount,
      date: t.date,
      category: 'treasury' as const
    }));

    const formattedMembership = membershipTransactions.map(m => ({
      id: m.id,
      playerId: 'mannschaft',
      playerName: 'Mannschaftskasse',
      type: m.type,
      description: m.description,
      amount: m.type === 'expense' ? -m.amount : m.amount,
      date: m.date,
      category: 'membershipTransaction' as const
    }));

    return [...formattedExpenses, ...formattedPayments, ...formattedTreasury, ...formattedMembership].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, payments, treasuryExpenses, membershipTransactions]);

  if (!mounted || authLoading || storeLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !currentUserProfile) return null

  const isAuditor = currentUserProfile.role === 'auditor'

  const formatDate = (date: string | Date, pattern: string) => {
    return format(new Date(date), pattern, { locale: de })
  }

  const filteredHistory = combinedHistory.filter(item => {
    const searchString = (item.playerName + (item.category === 'treasury' || item.category === 'membershipTransaction' ? (item as any).description : '')).toLowerCase()
    const matchesSearch = searchString.includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.category === filterType
    return matchesSearch && matchesFilter
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'beer': return <Beer className="h-4 w-4" />;
      case 'crate': return <Package className="h-4 w-4" />;
      case 'payment': return <Banknote className="h-4 w-4" />;
      case 'treasury': return <ShoppingCart className="h-4 w-4" />;
      case 'membershipTransaction':
      case 'sponsor':
      case 'donation':
      case 'other':
      case 'expense': return <TrendingUp className="h-4 w-4" />;
      default: return null;
    }
  }

  const getTypeLabel = (item: any) => {
    switch(item.type) {
      case 'beer': return 'Bier';
      case 'crate': return 'Kiste';
      case 'payment': return 'Zahlung';
      case 'treasury': return item.description || 'Bierkasse-Ausgabe';
      case 'sponsor': return 'Sponsor';
      case 'donation': return 'Spende';
      case 'expense': return item.description || 'M-Kasse Ausgabe';
      case 'other': return 'Einnahme M-Kasse';
      default: return item.type;
    }
  }

  const handleDeleteRequest = (id: string, category: 'expense' | 'payment' | 'treasury' | 'membershipTransaction') => {
    setItemToDelete({ id, category })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!itemToDelete) return
    if (itemToDelete.category === 'expense') {
      deleteExpense(itemToDelete.id)
    } else if (itemToDelete.category === 'payment') {
      deletePayment(itemToDelete.id)
    } else if (itemToDelete.category === 'treasury') {
      deleteTreasuryExpense(itemToDelete.id)
    } else {
      deleteMembershipTransaction(itemToDelete.id)
    }
    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  return (
    <div className="flex flex-col md:flex-row h-svh bg-background overflow-hidden">
      <Sidebar userRole={currentUserProfile.role} />
      <MobileNavTrigger userRole={currentUserProfile.role} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white border-b border-border sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-primary font-headline">Transaktionsverlauf</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="md:hidden">
            <h1 className="text-2xl font-bold text-primary font-headline mb-4">Verlauf</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Suche..." 
                className="pl-10 h-12 md:h-10 rounded-xl bg-white text-base md:text-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40 h-12 md:h-10 rounded-xl bg-white text-base md:text-sm">
                  <SelectValue placeholder="Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="expense">Getränke</SelectItem>
                  <SelectItem value="payment">Zahlungen</SelectItem>
                  <SelectItem value="treasury">Bierliste (Abrechnung)</SelectItem>
                  <SelectItem value="membershipTransaction">Mannschaftskasse (Transaktionen)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="divide-y divide-border md:hidden">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center active:bg-muted/20 group">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        item.amount > 0 ? "bg-emerald-100 text-emerald-600" : 
                        item.category === 'treasury' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                      )}>
                        {getIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{item.playerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date, 'dd.MM.yy HH:mm')} • {getTypeLabel(item)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold whitespace-nowrap ml-2",
                        item.amount > 0 ? "text-emerald-600" : "text-destructive"
                      )}>
                        {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)} €
                      </span>
                      {isAuditor && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRequest(item.id, item.category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground italic">
                    Keine Einträge gefunden.
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">Datum</TableHead>
                      <TableHead className="font-bold">Spieler / Zweck</TableHead>
                      <TableHead className="font-bold">Typ</TableHead>
                      <TableHead className="text-right font-bold">Betrag</TableHead>
                      {isAuditor && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.date, 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.playerName}
                          {(item.category === 'treasury' || item.category === 'membershipTransaction') && <span className="block text-xs text-muted-foreground font-normal">{getTypeLabel(item)}</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1",
                              item.amount > 0 ? "bg-emerald-100 text-emerald-800" : 
                              item.category === 'treasury' ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"
                            )}>
                              {getIcon(item.type)}
                              {getTypeLabel(item)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          item.amount > 0 ? "text-emerald-600" : "text-destructive"
                        )}>
                          {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)} €
                        </TableCell>
                        {isAuditor && (
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteRequest(item.id, item.category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eintrag wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Der Kontostand wird automatisch korrigiert.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
