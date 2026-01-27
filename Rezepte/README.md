# Recipe Website

**Self-hosted Recipe Management for Raspberry Pi**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

Eine leichte, selbst gehostete Rezeptverwaltungs-Website, die speziell für den Betrieb auf Raspberry Pi 4 entwickelt wurde. Mit SQLite-Datenbank und modernem Web-Interface für die optimale Haushaltsorganisation.

---

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [API-Dokumentation](#api-dokumentation)
- [Raspberry Pi Setup](#raspberry-pi-setup)
- [Troubleshooting](#troubleshooting)

---

## Übersicht

Die Recipe Website ist eine vollständige Lösung zur Verwaltung Ihrer Kochrezepte. Das System ist für den Heimgebrauch optimiert und läuft zuverlässig auf einem Raspberry Pi 4, sodass Sie Ihre Rezeptsammlung jederzeit im lokalen Netzwerk zugänglich haben.

### Anwendungsfälle

- **Haushaltsorganisation**: Alle Familienrezepte an einem Ort
- **Meal Planning**: Rezepte für die Woche planen und organisieren
- **Kochbuch-Ersatz**: Digitale Alternative zu physischen Kochbüchern
- **Gemeinschafts-Kochen**: Rezepte mit Familie und Freunden teilen
- **Mobile Nutzung**: Rezepte direkt in der Küche auf Smartphone/Tablet

## Features

### Rezeptverwaltung

| Feature | Beschreibung |
|---------|-------------|
| **CRUD-Operationen** | Rezepte anlegen, bearbeiten, löschen |
| **Bild-Upload** | Fotos zu Rezepten hinzufügen |
| **Kategorien** | Rezepte organisieren (Frühstück, Mittagessen, Abendessen, Dessert) |
| **Suche & Filter** | Rezepte nach Name, Zutaten oder Kategorie finden |
| **Zutatenliste** | Detaillierte Zutaten mit Mengenangaben |
| **Kochanleitung** | Schritt-für-Schritt Anleitungen |

### Benutzerinterface

| Feature | Beschreibung |
|---------|-------------|
| **Responsive Design** | Funktioniert auf Desktop, Tablet und Mobile |
| **Moderne UI** | Sauberes, intuitives Design mit Tailwind CSS |
| **Schnelle Ladezeiten** | Optimiert für Raspberry Pi Hardware |
| **Offline-Fähig** | Grundfunktionen auch ohne Internet |
| **Druckansicht** | Rezepte druckbar für Küchennutzung |

### Datenverwaltung

| Feature | Beschreibung |
|---------|-------------|
| **SQLite Datenbank** | Leichte, serverlose Datenbank |
| **Automatische Backups** | Einfache Datensicherung |
| **Daten-Export** | Rezepte als CSV oder JSON exportieren |
| **Bild-Optimierung** | Automatische Bildkomprimierung |
| **Daten-Integrität** | Validierung und Fehlerbehandlung |

## Technologie-Stack

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| **Backend** | Node.js | 18+ | JavaScript Runtime |
| **Backend** | Express.js | 4+ | Web Framework |
| **Datenbank** | SQLite3 | 3+ | Datenspeicherung |
| **Frontend** | React | 18+ | User Interface |
| **Frontend** | Tailwind CSS | 3+ | Styling Framework |
| **Icons** | Lucide React | Latest | Icon Library |
| **File Upload** | Multer | 1+ | Bild-Upload |
| **Image Processing** | Sharp | Latest | Bild-Optimierung |

### Architektur

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│  SQLite DB      │
│   React App     │     │   Express API   │     │   recipes.db    │
│   TailwindCSS   │     │   File Upload   │     │                 │
│   Responsive    │     │   Image Processing│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Installation

### Systemvoraussetzungen

| Komponente | Mindestanforderung | Empfohlen |
|------------|-------------------|------------|
| **Node.js** | 18.x LTS | 20.x LTS |
| **RAM** | 1 GB | 2 GB |
| **Speicher** | 512 MB | 1 GB |
| **Betriebssystem** | Linux/macOS/Windows | Raspberry Pi OS |

### Schnellinstallation

```bash
# 1. Repository klonen
git clone <repository-url>
cd Rezepte

# 2. Abhängigkeiten installieren
npm install

# 3. Frontend bauen
cd client
npm install
npm run build
cd ..

# 4. Server starten
npm start
```

**Zugriff:** http://localhost:3001

## Raspberry Pi Setup

### Detaillierte Installation auf Raspberry Pi 4

Für diejenigen, die die Recipe Website auf einem Raspberry Pi 4 betreiben möchten, habe ich eine detaillierte Anleitung erstellt. Diese ist besonders nützlich für den Heimgebrauch oder kleine Küchen-Setups.

**Hinweis:** Die vollständige Setup-Anleitung finden Sie in der Datei `README_PI_SETUP.md` im selben Verzeichnis. Dort finden Sie auch detaillierte Anleitungen für PM2, Monitoring und Fehlerbehebung speziell für den Raspberry Pi.

### Warum Raspberry Pi?

Der Raspberry Pi 4 ist ideal für dieses Projekt, weil:
- **Kostengünstig**: Geringe Anschaffungs- und Betriebskosten
- **Energieeffizient**: Verbraucht nur wenige Watt
- **Kompakt**: Passt perfekt in die Küche
- **24/7 Betrieb**: Läuft zuverlässig rund um die Uhr
- **Netzwerkfähig**: Alle Geräte im Heimnetz können zugreifen

### Kurzanleitung für Pi-Setup

```bash
# 1. System aktualisieren
sudo apt update && sudo apt upgrade -y

# 2. Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Projekt kopieren und installieren
mkdir -p ~/recipe-website
cp -r /pfad/zum/projekt/* ~/recipe-website/
cd ~/recipe-website
npm install

# 4. Frontend bauen
cd client
npm install
npm run build
cd ..

# 5. Server starten
npm start
```

### Pi-Optimierungen

Für beste Performance auf dem Raspberry Pi:

```bash
# Swap-Speicher erhöhen (wichtig bei 1GB Modellen)
sudo dphys-swapfile swapoff
sudo dphys-swapfile --size 2048
sudo dphys-swapfile swapon

# GPU-Speicher reduzieren
sudo raspi-config
# Advanced Options → Memory Split → 16
```

## Konfiguration

### Anpassungsmöglichkeiten

Die Recipe Website ist flexibel konfigurierbar. Hier sind die wichtigsten Anpassungen:

#### Port ändern

Standardmäßig läuft die Anwendung auf Port 3001. Dies können Sie auf zwei Weisen ändern:

**Methode 1: Umgebungsvariable**
```bash
PORT=8080 npm start
```

**Methode 2: Server.js anpassen**
```javascript
// In server.js die Port-Zeile ändern
const PORT = process.env.PORT || 8080;
```

#### Datenbank-Verwaltung

Die SQLite-Datenbank (`recipes.db`) wird automatisch im Projektverzeichnis erstellt. Für Backups:

```bash
# Backup erstellen
cp recipes.db recipes_backup_$(date +%Y%m%d).db

# Backup wiederherstellen
cp recipes_backup_20231201.db recipes.db
```

#### Bild-Upload-Einstellungen

Standardmäßig sind Bilder auf 5MB beschränkt. Dies können Sie in `server.js` anpassen:

```javascript
// Multer-Konfiguration anpassen
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB statt 5MB
  }
});
```

## API-Dokumentation

### REST-API Endpunkte

Die Recipe Website bietet eine vollständige REST-API für die Integration mit anderen Anwendungen:

| Methode | Endpunkt | Beschreibung | Parameter |
|--------|----------|-------------|------------|
| GET | `/api/recipes` | Alle Rezepte abrufen | `?search=`, `?category=` |
| GET | `/api/recipes/:id` | Einzelnes Rezept | `id` (Path) |
| POST | `/api/recipes` | Neues Rezept erstellen | Multipart Form |
| PUT | `/api/recipes/:id` | Rezept aktualisieren | Multipart Form |
| DELETE | `/api/recipes/:id` | Rezept löschen | `id` (Path) |
| GET | `/api/categories` | Alle Kategorien | - |

### Beispiele für API-Aufrufe

**Rezept suchen:**
```bash
curl "http://localhost:3001/api/recipes?search=pasta"
```

**Nach Kategorie filtern:**
```bash
curl "http://localhost:3001/api/recipes?category=dessert"
```

**Neues Rezept erstellen:**
```bash
curl -X POST -F "title=Apfelkuchen" \
  -F "ingredients=3 Äpfel,200g Mehl" \
  -F "instructions=Äpfel schälen..." \
  -F "category=dessert" \
  -F "image=@apfelkuchen.jpg" \
  http://localhost:3001/api/recipes
```

## Troubleshooting

### Häufige Probleme und Lösungen

Hier sind die häufigsten Probleme, auf die ich bei der Entwicklung gestoßen bin, und wie man sie behebt:

#### Berechtigungsprobleme

Wenn Sie Fehler wie "Permission denied" erhalten, meistens nach dem Kopieren der Projektdateien:

```bash
# Besitz korrigieren
sudo chown -R $USER:$USER ~/recipe-website

# Schreibrechte sicherstellen
chmod -R 755 ~/recipe-website
```

#### Port bereits belegt

Falls Port 3001 bereits von einer anderen Anwendung verwendet wird:

```bash
# Prozess finden, der den Port verwendet
sudo lsof -i :3001

# Prozess beenden (PID aus vorherigem Befehl)
sudo kill -9 <PID>

# Oder anderen Port verwenden
PORT=8080 npm start
```

#### Datenbank gesperrt

Wenn Sie Fehler wie "database is locked" erhalten:

```bash
# Alle Node-Prozesse finden
ps aux | grep node

# Prozesse beenden
sudo pkill -f node

# Warten Sie ein paar Sekunden und starten Sie erneut
npm start
```

#### Frontend wird nicht geladen

Wenn die Website lädt aber keine Rezepte anzeigt:

```bash
# Frontend neu bauen
cd client
npm run build
cd ..

# Server neu starten
npm start
```

#### Bilder werden nicht hochgeladen

Wenn Bild-Uploads nicht funktionieren:

```bash
# Upload-Verzeichnis prüfen
ls -la uploads/
# Falls nicht vorhanden:
mkdir -p uploads
chmod 755 uploads/
```

## Lizenz

MIT License - Feel free to modify and use for personal projects!

Ich habe dieses Projekt entwickelt, um die Rezeptverwaltung zu Hause zu vereinfachen. Sie dürfen es frei verwenden, anpassen und für Ihre eigenen Zwecke einsetzen.

### Was ich mir wünsche
- **Attribution**: Ein kurzer Hinweis auf das ursprüngliche Projekt wäre nett
- **Verbesserungen**: Wenn Sie nützliche Verbesserungen machen, lassen Sie es mich gerne wissen
- **Feedback**: Ich freue mich immer über Feedback und Anregungen

### Keine Garantie
Dies ist ein Hobby-Projekt. Ich bemühe mich um Qualität, kann aber keine Garantie für fehlerfreie Funktion geben.
