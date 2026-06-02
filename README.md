
# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren (Initial)

Um das Terminal zu öffnen:
1. Drücke **`F1`** (oder `Strg` + `Shift` + `P`).
2. Tippe **"Terminal"** ein.
3. Wähle **"Terminal: Create New Terminal"**.

### Befehle für den ersten Export:
Kopiere diese Befehle **einzeln** in das Terminal und bestätige jeden mit **Enter**:

1. `git init`
2. `git add .`
3. `git commit -m "Initialer Export"`
4. `git branch -M main`
5. `git remote add origin https://github.com/theRiggers/Bierliste-RWS2`
6. `git push -u origin main`

## 🔑 Authentifizierung bei GitHub (Fehler "Authentication failed")

GitHub verlangt im Terminal ein **Personal Access Token (PAT)** anstelle deines Passworts.

**So erstellst du ein Token:**
1. Gehe auf GitHub zu [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
2. Klicke auf **"Generate new token (classic)"**.
3. Gib ihm einen Namen (z.B. "Firebase Studio") und wähle unter "Scopes" das Häkchen bei **`repo`** aus.
4. Klicke unten auf **"Generate token"**.
5. **WICHTIG**: Kopiere das Token sofort (es wird nur einmal angezeigt!).

**So nutzt du das Token im Terminal:**
Wenn du nach dem `git push` Befehl nach dem Passwort gefragt wirst, füge einfach das kopierte Token ein (Rechtsklick ins Terminal zum Einfügen). 
*Hinweis: Man sieht keine Zeichen während des Einfügens, das ist normal.*

**Alternative (Token direkt im Link hinterlegen):**
Falls die Abfrage nicht klappt, nutze diesen Befehl (ersetze `DEIN_TOKEN` durch dein kopiertes Token):
`git remote set-url origin https://DEIN_TOKEN@github.com/theRiggers/Bierliste-RWS2.git`
Danach kannst du einfach wieder `git push` eingeben.

## 🔄 Neue Änderungen zu GitHub übertragen (Update-Workflow)

Wenn wir neue Features eingebaut haben, musst du sie manuell zu GitHub "pushen":

1. `git add .`
2. `git commit -m "Beschreibung der Änderung"`
3. `git push`

## 🌍 Hosting nach Frankfurt verschieben (europe-west3)
Standardmäßig wird die App oft in den USA gehostet. So ziehst du um:

1. Gehe in die [Firebase Console](https://console.firebase.google.com/).
2. Wähle dein Projekt aus.
3. Gehe links auf **App Hosting**.
4. Klicke auf die drei Punkte beim bestehenden Backend und wähle **Löschen**.
5. Klicke auf **Create Backend** und verbinde dein GitHub-Repo neu.
6. **WICHTIG**: Wähle im Schritt "Region" unbedingt **europe-west3 (Frankfurt)** aus.
