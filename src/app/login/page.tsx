
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth"
import { useAuth, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Beer, Mail, Lock, Loader2, AlertCircle, Copy, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  const redirectProcessed = useRef(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<{code: string, message: string} | null>(null)
  const [hostname, setHostname] = useState("")

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname)
    }
  }, [])

  // Verarbeitet das Ergebnis der Google-Umleitung
  useEffect(() => {
    if (redirectProcessed.current) return
    
    const handleRedirect = async () => {
      try {
        // getRedirectResult ist der entscheidende Teil nach der Rückkehr von Google
        const result = await getRedirectResult(auth)
        if (result?.user) {
          // Nutzer ist erfolgreich eingeloggt
          router.push("/")
          return
        }
      } catch (err: any) {
        console.error("Redirect Error:", err)
        if (err.code === 'auth/unauthorized-domain') {
          setError({
            code: err.code,
            message: "Diese Domain ist nicht für die Google-Anmeldung autorisiert."
          })
        } else if (err.code !== 'auth/popup-closed-by-user') {
          setError({
            code: err.code,
            message: "Anmeldung fehlgeschlagen: " + err.message
          })
        }
      } finally {
        setIsProcessingRedirect(false)
        redirectProcessed.current = true
      }
    }
    
    handleRedirect()
  }, [auth, router])

  // Zusätzlicher Check: Wenn useUser einen Nutzer findet, leiten wir weiter
  useEffect(() => {
    if (user && !isProcessingRedirect) {
      router.push("/")
    }
  }, [user, isProcessingRedirect, router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      // WICHTIG: Redirect für mobiles Web
      await signInWithRedirect(auth, provider)
    } catch (err: any) {
      setError({
        code: err.code,
        message: "Login konnte nicht gestartet werden."
      })
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
        toast({ title: "Konto erstellt", description: "Willkommen!" })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      let msg = "Fehler bei der Anmeldung."
      if (err.code === 'auth/invalid-credential') msg = "E-Mail oder Passwort falsch."
      if (err.code === 'auth/email-already-in-use') msg = "E-Mail bereits registriert."
      setError({ code: err.code, message: msg })
    } finally {
      setLoading(false)
    }
  }

  const copyHostname = () => {
    navigator.clipboard.writeText(hostname)
    toast({ title: "Kopiert", description: "Domain in die Zwischenablage kopiert." })
  }

  // Ladezustand anzeigen
  if (authLoading || isProcessingRedirect) {
    return (
      <div className="flex h-svh items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-xs w-full">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative bg-white p-4 rounded-3xl shadow-xl flex items-center justify-center h-full w-full">
              <Beer className="h-10 w-10 text-primary animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-primary font-headline">Bierliste RWS2</p>
            <p className="text-sm font-medium text-muted-foreground">Anmeldung wird geprüft...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="space-y-1 bg-primary pb-8 pt-10 text-center">
          <div className="mx-auto bg-white p-3 rounded-2xl shadow-lg w-fit mb-4">
            <Beer className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-white">Bierliste RWS2</CardTitle>
          <CardDescription className="text-white/80">Eure digitale Mannschaftskasse</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-xl border-2 animate-in fade-in zoom-in">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Anmeldefehler</AlertTitle>
              <AlertDescription className="text-xs space-y-4">
                <p>{error.message}</p>
                {error.code === 'auth/unauthorized-domain' && (
                  <div className="mt-2 space-y-2">
                    <p className="font-semibold text-foreground">Lösung:</p>
                    <p>Füge diese Domain in der Firebase Console unter "Authorized Domains" hinzu:</p>
                    <div className="p-2 bg-muted rounded-lg flex items-center justify-between gap-2 overflow-hidden border">
                      <code className="text-[10px] font-mono truncate flex-1">{hostname}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyHostname}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl border-2 hover:bg-muted font-bold transition-all flex items-center justify-center gap-3" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Mit Google anmelden
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Oder E-Mail</span></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="E-Mail" className="h-12 rounded-xl pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Passwort" className="h-12 rounded-xl pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? "Registrieren" : "Anmelden")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-8 justify-center">
          <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Bereits ein Konto? Login" : "Neu hier? Konto erstellen"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
