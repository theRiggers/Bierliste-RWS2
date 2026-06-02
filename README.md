# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren

Da dies eine private Entwicklungsumgebung ist, musst du den Code manuell zu GitHub pushen. Benutze dazu das **Terminal innerhalb dieser Webseite (Studio)**.

### 1. Terminal öffnen (Falls noch nicht offen)
- Drücke **`F1`** (oder `Strg` + `Shift` + `P`).
- Tippe oben in das Feld das Wort `Terminal` ein.
- Wähle aus der Liste **"Terminal: Create New Terminal"** aus.
- Es öffnet sich nun unten ein schwarzer Bereich (das Terminal).

### 2. GitHub Repository erstellen
Gehe auf [GitHub](https://github.com/new) und erstelle ein neues, leeres Repository (ohne README oder .gitignore). Kopiere die URL (z.B. `https://github.com/nutzer/bierliste.git`).

### 3. Befehle im Terminal ausführen
Kopiere diese Zeilen nacheinander in das Terminal-Fenster und drücke jeweils Enter:

```bash
git init
git add .
git commit -m "Initialer Export der Bierliste"
git branch -M main
git remote add origin DEINE_GITHUB_URL_HIER
git push -u origin main
```
*(Ersetze `DEINE_GITHUB_URL_HIER` mit dem Link deines neuen Repositories)*

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen.
- **KI-Zahlungs-Import**: PayPal-Texte kopieren und automatisch verbuchen lassen.
- **Beitragskasse**: Verwaltung von monatlichen Vereinsbeiträgen (Aug-Mai).
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## WICHTIG: Entwicklung vs. Live
Die URL, die auf `.cloudworkstations.dev` endet, ist **privat**. Sie funktioniert nur für dich. 

**Um die App zu teilen:**
1. Klicke oben rechts auf den blauen **"Publish"** Button.
2. Nach dem erfolgreichen Deployment erhältst du eine öffentliche URL (z.B. `dein-projekt.web.app`).

### Hosting in Deutschland
Wenn du möchtest, dass die App schneller lädt, kannst du das Hosting-Backend in der Firebase Console löschen und neu anlegen. Wähle dabei als Region **europe-west3 (Frankfurt)** aus.
