# Windsurf-Projects

Eine Sammlung von Softwareprojekten für verschiedene Anwendungsbereiche.
## Disclaimer

Diese Projekte wurden für die Schule erstellt. Es geht hier um das erlernen von Technik. Da wir allerdings keine Entwickler sind, haben wir in diesen Projekten auf KI zurückgegriffen. Der Code hier sollte also nur verwendet werden, wenn er vorher reviewed und verstanden wurde.

## Projektübersicht

Dieses Repository enthält drei Hauptprojekte:

### 1. Gewächshaus

**Intelligente Gewächshausverwaltung mit Präzisionsdüngung**

- **Technologie**: Node.js 14+, Vanilla JavaScript, HTML5, CSS3
- **Zweck**: Webanwendung zur Steuerung von Gewächshausanlagen
- **Hauptfunktionen**:
  - Interaktive Hochbeet-Verwaltung
  - Sensor-Integration (Temperatur, Feuchtigkeit, etc.)
  - Alarm-System mit E-Mail-Benachrichtigung
  - Community Forum
  - Admin Panel mit Benutzerverwaltung
  - Node-RED Integration über WebSocket
- **Installation**: `npm install` und `npm start`
- **Entwicklung**: `npm run dev` (mit Auto-Reload)
- **Zugriff**: http://localhost:3001
- **Dokumentation**: Siehe `Gewaechshaus/README.md` für Details

### 2. LAPS

**Sicheres Passwort-Anfrage-System für Microsoft LAPS + Active Directory**

- **Technologie**: Node.js, TypeScript, React, SQLite
- **Zweck**: Sichere Verwaltung von lokalen Administrator-Passwörtern
- **Hauptfunktionen**:
  - Passwort-Anfragen mit Genehmigungs-Workflow
  - Active Directory Integration
  - Vollständiger Audit-Trail
  - JWT-basierte Authentifizierung
  - Frontend mit React + TypeScript
- **Installation**: `npm install` und `npm run dev`
- **Zugriff**: Backend: http://localhost:3001, Frontend: http://localhost:5173
- **Dokumentation**: Siehe `LAPS/README.md` für Details

### 3. Rezepte

**Self-hosted Recipe Management für Raspberry Pi**

- **Technologie**: Node.js 16+, Express, SQLite3, React
- **Zweck**: Rezeptverwaltungs-Website für den Heimgebrauch
- **Hauptfunktionen**:
  - CRUD-Operationen für Rezepte
  - Bild-Upload mit Optimierung
  - Responsive Design mit Tailwind CSS
  - Such- und Filterfunktionen
  - Raspberry Pi optimiert
- **Installation**: `npm install`, Frontend-Build mit `cd client && npm run build`, dann `npm start`
- **Zugriff**: http://localhost:3001
- **Dokumentation**: Siehe `Rezepte/README.md` und `Rezepte/README_PI_SETUP.md` für Details

## Systemvoraussetzungen

### Allgemeine Anforderungen
- **Node.js**: 16+ LTS (für alle JavaScript/TypeScript Projekte)
- **RAM**: Mindestens 2 GB
- **Speicher**: Mindestens 1 GB freier Speicherplatz

### Projektspezifische Anforderungen

#### Gewächshaus
```bash
# Minimale Abhängigkeiten
npm install  # Nur nodemailer
```

#### LAPS
```bash
# Backend + Frontend
npm install
cd backend && npm install
cd frontend && npm install
```

#### Rezepte
```bash
# Backend + Frontend
npm install
cd client && npm install
```

## Quick Start

### Projekt auswählen und starten

```bash
# Ins gewünschte Projektverzeichnis wechseln
cd [projekt-name]

# Abhängigkeiten installieren (falls noch nicht geschehen)
npm install  # oder pip install -r requirements.txt

# Projekt starten
npm start     # oder python main.py
```

### Standard-Ports

| Projekt | Port | Zugriff |
|---------|------|---------|
| Gewächshaus | 3001 | http://localhost:3001 |
| LAPS Backend | 3001 | http://localhost:3001 |
| LAPS Frontend | 5173 | http://localhost:5173 |
| Rezepte | 3001 | http://localhost:3001 |

## Entwicklungs-Workflows

### Entwicklung mit Auto-Reload

```bash
# Gewächshaus
npm run dev

# LAPS
npm run dev

# Rezepte
npm run dev  # falls nodemon konfiguriert
```

### Produktion

```bash
# Gewächshaus (als Daemon)
npm run start:daemon

# LAPS
npm run build
npm start

# Rezepte
cd client && npm run build
cd .. && npm start
```

## Architektur-Übersicht

### Gewächshaus Projekt
```text
Gewaechshaus/
├── server-simple.js       # Haupt-Server
├── index.html             # Web-Interface
├── styles.css              # Styling
├── script.js               # Frontend-Logik
├── auth.js                 # Authentifizierung
├── color-manager.js        # Farbschema-Verwaltung
├── log-utils.js            # Logging-Utilities
├── data.json               # Datenspeicherung
└── assets/                 # Bilder und Icons
```

### LAPS Projekt
```text
LAPS/
├── package.json            # Workspace-Konfiguration
├── backend/                 # Node.js Backend
│   ├── package.json
│   ├── server.js
│   └── database.sqlite
└── frontend/                # React Frontend
    ├── package.json
    ├── src/
    └── build/
```

### Rezepte Projekt
```text
Rezepte/
├── package.json            # Backend-Konfiguration
├── server.js               # Express-Server
├── database.js             # SQLite-Datenbank
├── recipes.db              # Rezept-Daten
├── client/                 # React Frontend
│   ├── package.json
│   ├── src/
│   └── build/
└── uploads/                # Bild-Uploads
```

## Datenbanken

| Projekt | Datenbank | Speicherort |
|---------|-----------|-------------|
| LAPS | SQLite | `backend/database.sqlite` |
| Rezepte | SQLite | `recipes.db` |
| Gewächshaus | JSON | `data.json` |

## Sicherheitshinweise

### Produktionseinsatz
1. **Standard-Passwörter ändern**: Alle Projekte verwenden Demo-Passwörter
2. **HTTPS verwenden**: Insbesondere für LAPS und Gewächshaus
3. **Firewall konfigurieren**: Ports nur bei Bedarf freigeben
4. **Regelmäßige Backups**: Datenbanken und Konfigurationen sichern
5. **Updates**: Abhängigkeiten aktuell halten

### Active Directory Integration (LAPS)
- Service-Account mit minimalen Rechten erstellen
- LDAP-Verbindungen über TLS absichern
- JWT-Secrets stark wählen

## Troubleshooting

### Häufige Probleme

#### Port bereits belegt

```bash
# Prozess finden
sudo lsof -i :3001

# Prozess beenden
sudo kill -9 <PID>

# Oder anderen Port verwenden
PORT=8080 npm start
```

#### Berechtigungsprobleme (Raspberry Pi)

```bash
# Besitz korrigieren
sudo chown -R $USER:$USER /pfad/zum/projekt

# Schreibrechte sicherstellen
chmod -R 755 /pfad/zum/projekt
```

#### Node.js Abhängigkeiten

```bash
# Neu installieren bei Problemen
rm -rf node_modules package-lock.json
npm install
```

## Lizenz

Die Projekte unterliegen unterschiedlichen Lizenzen:

- **Gewächshaus**: MIT License
- **LAPS**: Intern / Proprietär
- **Rezepte**: MIT License

## Support

Bei Fragen zu spezifischen Projekten:

- **Gewächshaus**: Node.js-Dokumentation und Raspberry Pi Guides
- **LAPS**: Active Directory und LDAP-Dokumentation
- **Rezepte**: React- und SQLite-Dokumentation

---

Erstellt im Januar 2026 | Vielfältige Technologie-Stacks
