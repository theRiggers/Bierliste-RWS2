# Bierliste RWS2 🍻

Die digitale Getränkekasse für den Verein. Modern, sicher und KI-gestützt.

## 🚀 Projekt zu GitHub exportieren

Da dies eine private Entwicklungsumgebung ist, musst du den Code manuell zu GitHub pushen:

### 1. Terminal in Firebase Studio öffnen
Schau auf deinen Bildschirm oben rechts über das Dashboard deiner App. Dort siehst du eine kleine Leiste mit Icons:
- Klicke auf das **Terminal-Icon** (das mittlere Icon mit dem Symbol `>_`). 
- Jetzt öffnet sich unten ein schwarzes Fenster (das Terminal).
- (Optional: Das Icon ganz links mit dem Ordner-Symbol öffnet die Dateiliste wieder).

### 2. GitHub Repository erstellen
Gehe auf [GitHub](https://github.com/new) und erstelle ein neues, leeres Repository (ohne README oder .gitignore).

### 3. Befehle im Terminal ausführen
Kopiere diese Zeilen nacheinander in das schwarze Terminal-Fenster unten und drücke jeweils Enter:

```bash
git init
git add .
git commit -m "Initialer Export der Bierliste"
git branch -M main
git remote add origin DEINE_GITHUB_URL_HIER
git push -u origin main
```
*(Ersetze `DEINE_GITHUB_URL_HIER` mit dem Link deines neuen Repositories, z.B. `https://github.com/nutzer/bierliste.git`)*

## Features
- **Einfache Buchung**: Bier oder Kisten mit einem Klick erfassen.
- **Paypal-Integration**: Direkter Link zum Bezahlen von Schulden.
- **KI-Berichte**: Automatische Analysen und Zahlungserinnerungen.
- **KI-Zahlungs-Import**: PayPal-Texte kopieren und automatisch verbuchen lassen.
- **Beitragskasse**: Verwaltung von monatlichen Vereinsbeiträgen (Aug-Mai) und Jahresbeiträgen.
- **Mobile First**: Optimiert für die Nutzung als App auf dem Homescreen.

## WICHTIG: Entwicklung vs. Live
Die URL, die auf `.cloudworkstations.dev` endet, ist **privat**. Sie funktioniert nur für dich. Andere Personen erhalten den Fehler **"401: Permission Denied"**.

**Um die App zu teilen:**
1. Klicke oben rechts auf den blauen **"Publish"** Button.
2. Nach dem erfolgreichen Deployment erhältst du eine öffentliche URL (z.B. `dein-projekt.web.app`).
3. **Nur diese öffentliche URL** funktioniert auf den Handys der Spieler.
