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

## Kosten & Betrieb
Die App nutzt den **Firebase Spark Plan**. Dieser ist **dauerhaft kostenlos**, solange die täglichen Limits (50.000 Lesezugriffe/Tag) nicht überschritten werden. Für eine Fußballmannschaft ist dies völlig ausreichend.

### URLs & Domains
- **Kostenlose URLs**: Firebase stellt dir automatisch Adressen wie `dein-projekt.web.app` bereit. Diese sind kostenlos.
- **Eigene Domain**: Du kannst eine eigene Domain (z.B. `bierliste-rws2.de`) verbinden. Das Hosting bei Firebase bleibt kostenlos, du zahlst lediglich die jährliche Gebühr für die Domain an deinen Registrar (ca. 10€/Jahr).

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
