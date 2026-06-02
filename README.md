# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden (Jamie Rigden).
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen für den Kassenprüfer.
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## Installation auf dem Handy (WICHTIG!)
Die Bierliste ist eine **Progressive Web App (PWA)**. Das bedeutet, man muss sie nicht im App Store suchen, sondern installiert sie direkt über den Browser:

### iPhone (Safari)
1. Öffne die URL deiner App in **Safari**.
2. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben).
3. Wähle **"Zum Home-Bildschirm"**.
4. Die App erscheint nun mit Logo auf deinem Homescreen.

### Android (Chrome)
1. Öffne die URL in **Chrome**.
2. Tippe oben rechts auf die **drei Punkte**.
3. Wähle **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**.

## Fehlerbehebung: "Publish" Error
Wenn beim Veröffentlichen (Publish) der Fehler **"There was an error enabling firebaseapphosting.googleapis.com"** erscheint:
1. **Kurz warten**: Manchmal braucht Google Cloud einen Moment, um die API-Aktivierung zu verarbeiten. Versuche es nach 5 Minuten erneut.
2. **Blaze-Plan**: Firebase App Hosting benötigt zwingend den **Blaze-Plan** (Pay-as-you-go). In deinem Screenshot ist ein Billing-Account verknüpft, das ist schon mal gut.
3. **Berechtigungen**: Stelle sicher, dass du in der Firebase Console als **Inhaber (Owner)** eingetragen bist.
4. **Manueller Check**: Gehe in die Google Cloud Console (console.cloud.google.com) für dein Projekt und suche nach "APIs & Dienste". Suche dort nach "Firebase App Hosting API" und versuche sie manuell zu aktivieren.

## Kosten & Betrieb
Die App nutzt den **Firebase Spark Plan** für die Datenbank und **App Hosting** für den Betrieb.
- **Datenbank**: Dauerhaft kostenlos bis zu hohen Limits.
- **App Hosting**: Nutzt den Blaze-Plan, bleibt aber innerhalb der kostenlosen Kontingente für kleine Teams meist kostenfrei.

## Konfiguration
In der Datei `src/lib/store.tsx` findest du die folgenden wichtigen Einstellungen:
- `BEER_PRICE`: Preis für ein einzelnes Bier.
- `CRATE_PRICE`: Preis für eine ganze Kiste.
- `PAYPAL_ME_LINK`: Der offizielle PayPal-Account der Kasse (Jamie Rigden).

## Fehlerbehebung: Login
Falls beim Login "Domain nicht autorisiert" erscheint:
1. Kopiere die URL deiner App.
2. Gehe in die Firebase Console unter **Authentication > Settings > Authorized Domains**.
3. Füge die URL dort hinzu.
