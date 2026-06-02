# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen für den Kassenprüfer.
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## Installation auf dem Handy (WICHTIG!)
Die Bierliste ist eine **Progressive Web App (PWA)**. Das bedeutet, man muss sie nicht im App Store suchen, sondern installiert sie direkt über den Browser:

### iPhone (Safari)
1. Öffne die URL deiner App in **Safari**.
2. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil).
3. Wähle **"Zum Home-Bildschirm"**.
4. Die App erscheint nun mit Logo auf deinem Homescreen.

### Android (Chrome)
1. Öffne die URL in **Chrome**.
2. Tippe oben rechts auf die **drei Punkte**.
3. Wähle **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**.

## Kosten & Betrieb
Die App nutzt den **Firebase Spark Plan**. Dieser ist **dauerhaft kostenlos**, solange die täglichen Limits (50.000 Lesezugriffe/Tag) nicht überschritten werden. Für eine Fußballmannschaft ist dies völlig ausreichend.

## Konfiguration
In der Datei `src/lib/store.tsx` findest du die folgenden wichtigen Einstellungen:
- `BEER_PRICE`: Preis für ein einzelnes Bier.
- `CRATE_PRICE`: Preis für eine ganze Kiste.
- `PAYPAL_ME_LINK`: Der offizielle PayPal-Account der Kasse.
