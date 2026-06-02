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

## Server-Standort & Datenschutz
Die Region des Backends wird in der Firebase Console festgelegt:
- **Firestore (Datenbank)**: Der Standort wird bei der Erstellung fest gewählt (z.B. USA) und kann nachträglich nicht verschoben werden.
- **App Hosting (Web-Server)**: Du kannst bei der Einrichtung des Backends in der Console eine Region in Deutschland/Europa wählen (z.B. `europe-west3` Frankfurt), um Latenzen zu minimieren.
- **DSGVO**: Die App nutzt Firebase Authentication und Firestore. Achte darauf, im Google Cloud Account die entsprechenden Datenverarbeitungs-Zusätze zu akzeptieren.

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
