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

**Warum steht beim Publish "us-central"?**
Das App Hosting Backend wird beim ersten Mal oft standardmäßig in den USA erstellt. Da deine Datenbank aber in Europa liegt, "reist" jede Anfrage über den Atlantik. 

**So verschiebst du den Web-Server nach Deutschland:**
1. Gehe in die [Firebase Console](https://console.firebase.google.com/).
2. Navigiere zu **App Hosting**.
3. Lösche das bestehende Backend (falls es in `us-central` liegt).
4. Erstelle ein neues Backend und wähle im Setup-Prozess als Region **`europe-west3` (Frankfurt)**.
5. Verbinde es erneut mit deinem GitHub/Repository. Danach ist auch der Web-Server in Deutschland.

## Installation auf dem Handy
Die Bierliste ist eine **Progressive Web App (PWA)**.

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
