
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth"
import { useAuth, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Beer, Mail, Lock, Loader2, AlertCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<{code: string, message: string} | null>(null)
  const [hostname, setHostname] = useState("")

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname)
    }
  }, [])

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push("/")
    } catch (err: any) {
      console.error(err)
      setError({
        code: err.code,
        message: err.code === 'auth/unauthorized-domain' 
          ? "Diese Domain ist nicht autorisiert." 
          : "Login fehlgeschlagen"
      })
    } finally {
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
        toast({ title: "Konto erstellt", description: "Du wurdest automatisch angemeldet." })
        router.push("/")
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        router.push("/")
      }
    } catch (err: any) {
      console.error(err)
      let msg = err.message
      if (err.code === 'auth/unauthorized-domain') {
        msg = "Diese Domain ist nicht autorisiert."
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Diese E-Mail wird bereits verwendet."
      } else if (err.code === 'auth/weak-password') {
        msg = "Das Passwort ist zu schwach (min. 6 Zeichen)."
      } else if (err.code === 'auth/invalid-credential') {
        msg = "Ungültige Login-Daten."
      }
      setError({ code: err.code, message: msg })
    } finally {
      setLoading(false)
    }
  }

  const copyHostname = () => {
    navigator.clipboard.writeText(hostname)
    toast({ title: "Kopiert", description: "Domain wurde in die Zwischenablage kopiert." })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="space-y-1 bg-primary/5 pb-8 pt-10 text-center">
          <div className="mx-auto bg-primary p-3 rounded-2xl shadow-lg w-fit mb-4">
            <Beer className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-primary">Kickoff Kasse</CardTitle>
          <CardDescription>Melde dich an, um deine Getränke zu verwalten.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription className="text-xs space-y-2">
                <p>{error.message}</p>
                {error.code === 'auth/unauthorized-domain' && (
                  <div className="mt-2 p-2 bg-destructive-foreground/10 rounded border border-destructive/20">
                    <p className="font-semibold mb-1">Bitte füge diese Domain hinzu:</p>
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] bg-white/50 p-1 rounded">
                      <span className="truncate">{hostname}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyHostname}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="mt-2 text-[9px]">
                      Konsole -> Auth -> Einstellungen -> Autorisierte Domains
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="E-Mail Adresse" 
                  className="pl-10 h-12 rounded-xl" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Passwort" 
                  className="pl-10 h-12 rounded-xl" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold cyan-glow" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? "Jetzt registrieren" : "Anmelden")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Oder</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-2 hover:bg-muted" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Mit Google anmelden
          </Button>
        </CardContent>
        <CardFooter className="pb-8 pt-2 flex flex-col gap-4">
          <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Bereits ein Konto? Hier anmelden" : "Noch kein Konto? Hier registrieren"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
