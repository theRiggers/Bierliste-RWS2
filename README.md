# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren (Initial)

Da die Tastenkombinationen im Browser oft von Chrome abgefangen werden, nutze diesen Weg um das Terminal zu öffnen:
1. Drücke **`F1`** (oder `Strg` + `Shift` + `P`).
2. Tippe oben im Suchfeld **"Terminal"** ein.
3. Wähle **"Terminal: Create New Terminal"**.

Kopiere diese Befehle **einzeln** in das Terminal und bestätige jeden mit **Enter**:

1. `git init`
2. `git add .`
3. `git commit -m "Initialer Export"`
4. `git branch -M main`
5. `git remote add origin https://github.com/theRiggers/Bierliste-RWS2`
6. `git push -u origin main`

*Hinweis: Falls GitHub nach einem Passwort fragt, musst du ein **Personal Access Token (PAT)** verwenden.*

## 🔄 Neue Änderungen zu GitHub übertragen (Update-Workflow)

Wenn wir neue Features eingebaut haben, musst du sie manuell zu GitHub "pushen", damit die App aktualisiert wird:

1. `git add .`
2. `git commit -m "Beschreibung der Änderung"`
3. `git push`

Nach dem `git push` startet Firebase automatisch das Deployment der neuen Version.

## 🌍 Hosting nach Frankfurt verschieben (europe-west3)
Standardmäßig wird die App oft in den USA gehostet. So ziehst du um:

1. Gehe in die [Firebase Console](https://console.firebase.google.com/).
2. Wähle dein Projekt aus.
3. Gehe links auf **App Hosting**.
4. Klicke auf die drei Punkte beim bestehenden Backend und wähle **Löschen**.
5. Klicke auf **Create Backend** und verbinde dein GitHub-Repo neu.
6. **WICHTIG**: Wähle im Schritt "Region" unbedingt **europe-west3 (Frankfurt)** aus.

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Zahlungs-Import**: PayPal-Texte kopieren und automatisch verbuchen lassen.
- **Beitragskasse**: Verwaltung von monatlichen Vereinsbeiträgen.
