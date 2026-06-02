# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren

### 1. Terminal öffnen
Da die Tastenkombinationen im Browser oft von Chrome abgefangen werden, nutze diesen Weg:
1. Drücke **`F1`** (oder `Strg` + `Shift` + `P`).
2. Tippe oben im Suchfeld **"Terminal"** ein.
3. Wähle **"Terminal: Create New Terminal"**.

### 2. Befehle eingeben
Kopiere diese Befehle **einzeln** in das Terminal und bestätige jeden mit **Enter**:

1. `git init`
2. `git add .`
3. `git commit -m "Initialer Export"`
4. `git branch -M main`
5. `git remote add origin https://github.com/theRiggers/Bierliste-RWS2`
6. `git push -u origin main`

### ⚠️ Troubleshooting
- **"command not found"**: Falls eine Meldung wie `__vsc_prompt_cmd_original` erscheint, **ignoriere sie**. Das ist ein Anzeigefehler. Wenn `{main}` im Terminal steht, hat es funktioniert.
- **Authentifizierung**: Wenn GitHub nach einem Passwort fragt, musst du ein **Personal Access Token** verwenden, kein normales Passwort.

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
