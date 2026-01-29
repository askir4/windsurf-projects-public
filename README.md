# Windsurf-Projects

Eine Sammlung von Softwareprojekten für verschiedene Anwendungsbereiche.
## Disclaimer
Dieser Projekte wurden für die Schule erstellt. Es geht hier um das erlernen von Technik. Da wir allerdings keine Entwickler sind, haben wir in diesen Projekten auf KI zurückgegriffen. Der Code hier sollte also nur verwendet, werden, wenn ihn vorher reviwed und verstanden hat. 
## Projektübersicht

Dieses Repository enthält vier Hauptprojekte:

### 1. Berichtshefte-Faker

**Python Desktop-Anwendung zur automatischen Erstellung von Ausbildungsberichten**

- **Technologie**: Python 3.10+, Tkinter, python-docx
- **Zweck**: Automatische Generierung von Ausbildungsberichten aus Word-Vorlagen
- **Hauptfunktionen**: 
  - Vorlagen-Management mit Platzhalter-Erkennung
  - Dynamische Formularerstellung
  - Word-Export (.docx)
- **Installation**: `pip install -r requirements.txt` und `python main.py`

### 2. Gewächshaus

**Intelligente Gewächshausverwaltung mit Präzisionsdüngung**

- **Technologie**: Node.js, Vanilla JavaScript, HTML5, CSS3
- **Zweck**: Webanwendung zur Steuerung von Gewächshausanlagen
- **Hauptfunktionen**:
  - Interaktive Hochbeet-Verwaltung
  - Sensor-Integration (Temperatur, Feuchtigkeit, etc.)
  - Alarm-System mit E-Mail-Benachrichtigung
  - Community Forum
- **Installation**: `npm install` und `npm start`
- **Zugriff**: http://localhost:3001

### 3. LAPS

**Sicheres Passwort-Anfrage-System für Microsoft LAPS + Active Directory**

- **Technologie**: Node.js, TypeScript, React, SQLite
- **Zweck**: Sichere Verwaltung von lokalen Administrator-Passwörtern
- **Hauptfunktionen**:
  - Passwort-Anfragen mit Genehmigungs-Workflow
  - Active Directory Integration
  - Vollständiger Audit-Trail
  - JWT-basierte Authentifizierung
- **Installation**: `npm install` und `npm run dev`
- **Zugriff**: Backend: http://localhost:3001, Frontend: http://localhost:5173

### 4. Rezepte

**Self-hosted Recipe Management für Raspberry Pi**

- **Technologie**: Node.js, React, SQLite3, Tailwind CSS
- **Zweck**: Rezeptverwaltungs-Website für den Heimgebrauch
- **Hauptfunktionen**:
  - CRUD-Operationen für Rezepte
  - Bild-Upload mit Optimierung
  - Responsive Design
  - Such- und Filterfunktionen
- **Installation**: `npm install`, Frontend-Build mit `cd client && npm run build`, dann `npm start`
- **Zugriff**: http://localhost:3001

## Systemvoraussetzungen

### Allgemeine Anforderungen
- **Node.js**: 18+ LTS (für JavaScript/TypeScript Projekte)
- **Python**: 3.10+ (für Berichtshefte-Faker)
- **RAM**: Mindestens 2 GB
- **Speicher**: Mindestens 1 GB freier Speicherplatz

### Projektspezifische Anforderungen

#### Berichtshefte-Faker
```bash
# Python-Abhängigkeiten
pip install python-docx tkcalendar pyinstaller
```

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

### Python-Projekt (Berichtshefte-Faker)
```
Berichtshefte-Faker/
├── main.py                 # Einstiegspunkt
├── gui/                    # Benutzeroberfläche
│   ├── main_window.py
│   ├── template_manager.py
│   └── report_form.py
├── core/                   # Geschäftslogik
│   ├── template_handler.py
│   ├── report_generator.py
│   └── word_exporter.py
└── requirements.txt        # Python-Abhängigkeiten
```

### Node.js Projekte
```
[projekt]/
├── package.json           # Projekt-Konfiguration
├── server.js              # Backend-Server
├── frontend/              # React-Anwendung (LAPS, Rezepte)
├── client/                # Frontend (Rezepte)
├── backend/               # Backend (LAPS)
└── node_modules/          # Abhängigkeiten
```

## Datenbanken

| Projekt | Datenbank | Speicherort |
|---------|-----------|-------------|
| LAPS | SQLite | `backend/database.sqlite` |
| Rezepte | SQLite | `recipes.db` |
| Gewächshaus | JSON | `data.json` |
| Berichtshefte-Faker | Dateisystem | `templates/`, `output/` |

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

#### Python Module
```bash
# Module neu installieren
pip uninstall python-docx tkcalendar
pip install python-docx tkcalendar
```

## Lizenz

Die Projekte unterliegen unterschiedlichen Lizenzen:

- **Berichtshefte-Faker**: Private Nutzung für Ausbildungszwecke
- **Gewächshaus**: MIT License
- **LAPS**: Intern / Proprietär
- **Rezepte**: MIT License

## Support

Bei Fragen zu spezifischen Projekten:

- **Berichtshefte-Faker**: Python-Dokumentation und Tkinter-Referenzen
- **Gewächshaus**: Node.js-Dokumentation und Raspberry Pi Guides
- **LAPS**: Active Directory und LDAP-Dokumentation
- **Rezepte**: React- und SQLite-Dokumentation

---

Erstellt im Januar 2026 | Vielfältige Technologie-Stacks
