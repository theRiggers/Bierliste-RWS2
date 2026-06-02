# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren

Benutze das **Terminal innerhalb von Firebase Studio**. Kopiere die Befehle einzeln (ohne das `>`) und drücke jeweils Enter.

### Befehle:
```bash
git init
git add .
git commit -m "Initialer Export der Bierliste"
git branch -M main
git remote add origin https://github.com/theRiggers/Bierliste-RWS2
git push -u origin main
```

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen.
- **KI-Zahlungs-Import**: PayPal-Texte kopieren und automatisch verbuchen lassen.
- **Beitragskasse**: Verwaltung von monatlichen Vereinsbeiträgen (Aug-Mai).
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## 🌍 Live-Schaltung (Hosting nach Frankfurt verschieben)
Standardmäßig wird die App oft in den USA gehostet. So ziehst du auf einen deutschen Server um:

1. Gehe in die [Firebase Console](https://console.firebase.google.com/).
2. Wähle dein Projekt aus.
3. Gehe links auf **App Hosting**.
4. Falls dort ein Backend existiert, klicke auf die drei Punkte und wähle **Löschen**.
5. Klicke auf **Get Started** oder **Create Backend**.
6. Verbinde dein GitHub-Repository.
7. **WICHTIG**: Wähle im Schritt "Region" unbedingt **europe-west3 (Frankfurt)** aus.
8. Schließe das Setup ab. Deine App lädt nun blitzschnell aus Deutschland.
