# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden (Jamie Rigden).
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen für den Kassenprüfer.
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## WICHTIG: Entwicklung vs. Live
Die URL, die auf `.cloudworkstations.dev` endet, ist **privat**. Sie funktioniert nur auf deinem Rechner/Browser, wo du eingeloggt bist. Andere Personen (Spieler) erhalten dort den Fehler **"401: Permission Denied"**.

**Um die App zu teilen:**
1. Klicke in Firebase Studio oben rechts auf den blauen **"Publish"** Button.
2. Nach dem erfolgreichen Deployment erhältst du eine öffentliche URL (z.B. `dein-projekt.web.app`).
3. **Nur diese öffentliche URL** funktioniert auf den Handys der Spieler.

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

## Fehlerbehebung: "Publish" Error
Wenn beim Veröffentlichen der Fehler **"There was an error enabling firebaseapphosting.googleapis.com"** erscheint:
1. **Blaze-Plan**: Firebase App Hosting benötigt zwingend den **Blaze-Plan** (Pay-as-you-go). Dieser ist für kleine Apps kostenlos, muss aber in der Firebase Console aktiviert werden.
2. **Kurz warten**: Die Aktivierung der Google-Dienste kann bis zu 10 Minuten dauern.
3. **Manuelle Aktivierung**: Gehe in die Firebase Console unter "Build" -> "App Hosting" und klicke auf "Get Started".

## Konfiguration
In der Datei `src/lib/store.tsx`:
- `BEER_PRICE`: Preis für ein Bier.
- `CRATE_PRICE`: Preis für eine Kiste.
- `PAYPAL_ME_LINK`: Der PayPal-Account (Jamie Rigden).
