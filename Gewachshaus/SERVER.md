# 🌾 Server-Installation und Konfiguration

## 📋 Voraussetzungen
- Node.js (Version 14 oder höher)
- npm oder yarn
- SQLite3 (wird automatisch installiert)

## 🚀 Installation

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Server starten
```bash
# Entwicklung mit Auto-Reload
npm run dev

# Produktionsmodus
npm start
```

### 2a. Raspberry Pi Startskript (optional)
```bash
npm run start:daemon   # Auto-Restart aktiv
npm run start:status   # Status anzeigen
npm run start:logs     # Live-Logs
```

### 3. Server konfigurieren
Der Server läuft standardmäßig auf `http://localhost:3001`

## 📊 API-Endpunkte

### Daten abrufen
```http
GET /api/data
```
Gibt alle Zonen, Slots und Pflanzen zurück.

### Daten speichern
```http
POST /api/data
Content-Type: application/json

{
  "zones": [...],
  "slots": [...],
  "plants": [...]
}
```

### Logs abrufen
```http
GET /api/logs?level=INFO&limit=100
```
Gibt Logs zurück, optional gefiltert nach Level.

### Logs speichern
```http
POST /api/logs
Content-Type: application/json

{
  "level": "INFO",
  "message": "Nachricht",
  "data": {...}
}
```

## 🗄️ Datenbankstruktur

### Zones
- `zone_id` (INTEGER, PRIMARY KEY)
- `name` (TEXT)
- `x`, `y`, `width`, `height` (REAL)
- `rows`, `cols` (INTEGER)
- `color` (TEXT)
- `created_at`, `updated_at` (DATETIME)

### Slots
- `slot_id` (INTEGER, PRIMARY KEY)
- `zone_id` (INTEGER, FOREIGN KEY)
- `x`, `y`, `width`, `height` (REAL)
- `row`, `col` (INTEGER)
- `plant_id` (INTEGER)
- `occupied` (BOOLEAN)

### Plants
- `plant_id` (INTEGER, PRIMARY KEY)
- `name` (TEXT)
- `custom_name` (TEXT)
- `slot_id` (INTEGER, FOREIGN KEY)
- `nitrogen`, `phosphorus`, `potassium` (REAL)
- `notes`, `harvest_events` (TEXT, JSON)
- `created_at`, `updated_at` (DATETIME)

### Logs
- `id` (INTEGER, PRIMARY KEY)
- `level` (TEXT: DEBUG, INFO, WARN, ERROR)
- `message` (TEXT)
- `data` (TEXT, JSON)
- `timestamp` (DATETIME)

### Settings
- `key` (TEXT, UNIQUE)
- `value` (TEXT)
- `updated_at` (DATETIME)

## 🔧 Konfiguration

### Server-Konfiguration
Die Server-Konfiguration kann im Frontend unter "Server-Einstellungen" konfiguriert werden:

- **Server-URL**: `http://localhost:3001`
- **Auto-Sync**: Alle 30 Sekunden
- **Logging-Level**: DEBUG, INFO, WARN, ERROR

### Umgebungsvariablen
- `PORT`: Server-Port (Standard: 3001)
- `NODE_ENV`: Umgebung (development/production)

## 📝 Logging

### Log-Level
- **DEBUG**: Detaillierte Debug-Informationen
- **INFO**: Allgemeine Informationen
- **WARN**: Warnungen
- **ERROR**: Fehlermeldungen

### Log-Ziele
- **Lokal**: Browser Console und LocalStorage
- **Server**: SQLite-Datenbank
- **Remote**: Optionaler externer Log-Service

## 🔒 Sicherheit

### CORS
Der Server ist für Cross-Origin-Anfragen konfiguriert.

### Validierung
Alle Eingabedaten werden serverseitig validiert.

### Transaktionen
Datenbankoperationen verwenden Transaktionen für Datenintegrität.

## 🚀 Bereitstellung

### Entwicklung
```bash
npm run dev
```

### Produktion
```bash
npm start
```

### Mit PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name "fertilizer-server"
```

## 📱 Frontend-Anbindung

### Server aktivieren
Im Frontend unter "Server-Einstellungen" die Server-Verbindung aktivieren.

### Automatische Synchronisation
Daten werden automatisch alle 30 Sekunden mit dem Server synchronisiert.

### Manuelle Synchronisation
Über die Entwickler-Konsole können Daten manuell synchronisiert werden:
```javascript
// Daten vom Server laden
app.syncWithServer();

// Daten an Server senden
app.saveToServer();
```

## 🔍 Fehlersuche

### Logs überprüfen
```bash
# Server-Logs
curl http://localhost:3001/api/logs

# Fehler-Logs
curl http://localhost:3001/api/logs?level=ERROR
```

### Datenbank prüfen
```bash
sqlite3 fertilizer.db ".schema"
sqlite3 fertilizer.db "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;"
```

---

**🌾 Server-Dokumentation - Version 1.0.0**
