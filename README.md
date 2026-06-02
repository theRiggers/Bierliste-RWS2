# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen für den Kassenprüfer.
- **KI-Zahlungs-Import**: PayPal-Texte kopieren und automatisch verbuchen lassen.
- **Beitragskasse**: Verwaltung von monatlichen Vereinsbeiträgen (Aug-Mai) und Jahresbeiträgen.
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## WICHTIG: Entwicklung vs. Live
Die URL, die auf `.cloudworkstations.dev` endet, ist **privat**. Sie funktioniert nur auf deinem Rechner/Browser, wo du eingeloggt bist. Andere Personen (Spieler) erhalten dort den Fehler **"401: Permission Denied"**.

**Um die App zu teilen:**
1. Klicke in Firebase Studio oben rechts auf den blauen **"Publish"** Button.
2. Nach dem erfolgreichen Deployment erhältst du eine öffentliche URL (z.B. `dein-projekt.web.app`).
3. **Nur diese öffentliche URL** funktioniert auf den Handys der Spieler.

## Region & Standorte (Wichtig für Latenz)
Es gibt zwei verschiedene Standorte in deinem Projekt:
1. **Firestore (Datenbank)**: Hier liegen deine Daten (Spieler, Stände). Dieser Ort ist fest (z.B. `europe-west`).
2. **App Hosting (Web-Server)**: Das ist der Ort, von dem die Webseite geladen wird. 

### Warum steht beim Publish "us-central"?
Das App Hosting Backend wird beim ersten Mal oft standardmäßig in den USA erstellt. Da deine Datenbank aber in Europa liegt, "reist" jede Anfrage über den Atlantik, was die App etwas langsamer machen kann.

### So verschiebst du den Web-Server nach Deutschland (Frankfurt):
Da die Region nach der Erstellung nicht mehr geändert werden kann, musst du das Hosting-Backend einmal neu anlegen:

1.  Gehe in die [Firebase Console](https://console.firebase.google.com/).
2.  Wähle dein Projekt aus.
3.  Navigiere im Menü links zu **App Hosting**.
4.  Klicke bei deinem aktuellen Backend auf die drei Punkte (rechts) und wähle **Backend löschen**. (Keine Sorge: Deine Daten in der Datenbank bleiben erhalten!)
5.  Klicke auf **Get Started** oder **Neues Backend erstellen**.
6.  Verbinde dein GitHub-Repository erneut.
7.  **WICHTIG**: Im Schritt "Region auswählen" (meist der zweite oder dritte Schritt), wähle **`europe-west3` (Frankfurt)** aus der Liste aus.
8.  Schließe das Setup ab. Nach ein paar Minuten ist deine App nun auf einem Server in Deutschland gehostet.

## Installation auf dem Handy
Die Bierliste ist eine **Progressive Web App (PWA)平衡**.

### iPhone (Safari)
1. Öffne die **öffentliche URL** in **Safari**.
2. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben).
3. Wähle **"Zum Home-Bildschirm"**.

### Android (Chrome)
1. Öffne die URL in **Chrome**.
2. Tippe oben rechts auf die **drei Punkte**.
3. Wähle **"App installieren"**.

## Konfiguration
In der Datei `src/lib/store.tsx`:
- `BEER_PRICE`: Preis für ein Bier (1.50€).
- `CRATE_PRICE`: Preis für eine Kiste (35.00€).
- `MONTHLY_FEE`: Monatsbeitrag (15.00€).
- `ANNUAL_FEE`: Jahresbeitrag (150.00€).
- `PAYPAL_ME_LINK`: Der zentrale PayPal-Account für Zahlungen.
