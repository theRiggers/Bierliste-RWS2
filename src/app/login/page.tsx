
"use client"

import { useState, useEffect, useCallback } from "react"
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
    let isMounted = true;
    
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user && isMounted) {
          // Erfolgreich eingeloggt, Weiterleitung erfolgt durch den useUser-Effekt unten
          return
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Redirect Error:", err)
          if (err.code === 'auth/unauthorized-domain') {
            setError({
              code: err.code,
              message: "Domain nicht autorisiert. Bitte in der Firebase Console hinzufügen."
            })
          } else {
            setError({
              code: err.code,
              message: "Anmeldung fehlgeschlagen. Bitte versuche es erneut."
            })
          }
        }
      } finally {
        if (isMounted) {
          setIsProcessingRedirect(false)
        }
      }
    }
    
    handleRedirect()
    return () => { isMounted = false }
  }, [auth])

  // Zentrale Weiterleitung, wenn der Nutzer eingeloggt ist
  useEffect(() => {
    if (user && !isProcessingRedirect) {
      router.push("/")
    }
  }, [user, isProcessingRedirect, router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    // WICHTIG: Redirect statt Popup für PWAs auf Handys
    try {
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

  // Während Firebase den Status prüft (Initial oder nach Redirect), zeigen wir den Ladescreen
  if (authLoading || isProcessingRedirect) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <Beer className="h-16 w-16 text-primary animate-bounce" />
            <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-primary">Bierliste RWS2</p>
            <p className="text-sm font-medium text-muted-foreground">Anmeldung wird geprüft...</p>
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
              <AlertTitle className="font-bold">Achtung</AlertTitle>
              <AlertDescription className="text-xs space-y-2">
                <p>{error.message}</p>
                {error.code === 'auth/unauthorized-domain' && (
                  <div className="mt-2 p-2 bg-black/5 rounded border border-black/10">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] bg-white p-1 rounded">
                      <span className="truncate">{hostname}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyHostname}>
                        <Copy className="h-3 w-3" />
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
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <Input type="email" placeholder="E-Mail" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Passwort" className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
