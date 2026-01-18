# 🌱 Gewächshaus - Raspberry Pi Setup

Optimierte Version für Raspberry Pi und ressourcenbeschränkte Systeme.

## Vorteile der vereinfachten Version

| Feature | Alt | Neu |
|---------|-----|-----|
| Abhängigkeiten | 8 npm Pakete | **0 npm Pakete** |
| Servercode | 1251 Zeilen | **~400 Zeilen** |
| RAM-Verbrauch | ~150MB | **~30MB** |
| Startzeit | 3-5 Sekunden | **<1 Sekunde** |
| Native Kompilierung | sqlite3, bcrypt | **Keine** |

## Schnellstart

### 1. Dateien kopieren

```bash
# Auf dem Raspberry Pi
mkdir -p ~/gewachshaus
cd ~/gewachshaus

# Nur diese Dateien werden benötigt:
# - server-simple.js
# - index.html
# - start.sh
# - assets/ (optional)
```

### 2. Server starten

```bash
# Direkt starten
node server-simple.js

# Oder mit Startskript
chmod +x start.sh
./start.sh start
```

### 3. Zugriff

- **URL:** http://raspberry-pi-ip:3001
- **Login:** admin / admin123

## Systemd Service (Autostart)

```bash
# Service-Datei kopieren
sudo cp gewachshaus.service /etc/systemd/system/

# Pfade anpassen (falls nicht /home/pi/gewachshaus)
sudo nano /etc/systemd/system/gewachshaus.service

# Service aktivieren
sudo systemctl daemon-reload
sudo systemctl enable gewachshaus
sudo systemctl start gewachshaus

# Status prüfen
sudo systemctl status gewachshaus
```

## Startskript Befehle

```bash
./start.sh start    # Server starten
./start.sh stop     # Server stoppen
./start.sh restart  # Neustart
./start.sh status   # Status anzeigen
./start.sh daemon   # Mit Auto-Restart laufen
./start.sh logs     # Logs anzeigen
```

## Konfiguration

Umgebungsvariablen (optional):

```bash
export PORT=3001              # Server-Port
export ADMIN_USER=admin       # Admin-Benutzername
export ADMIN_PASS=admin123    # Admin-Passwort
export SESSION_SECRET=xxx     # Session-Geheimnis
```

## Datenbank

Die Daten werden in `data.json` gespeichert:
- Automatische Speicherung alle 30 Sekunden
- Backup bei Korruption
- Einfach zu sichern/wiederherstellen

### Backup

```bash
cp data.json data.backup.json
```

### Wiederherstellen

```bash
cp data.backup.json data.json
./start.sh restart
```

## Troubleshooting

### Server startet nicht

```bash
# Prüfen ob Port frei ist
sudo lsof -i :3001

# Node.js Version prüfen (mindestens v14)
node --version

# Logs prüfen
cat server.log
```

### Hoher Speicherverbrauch

```bash
# Speicher prüfen
./start.sh status

# Garbage Collection manuell auslösen
node --expose-gc server-simple.js
```

### Verbindungsprobleme

```bash
# Firewall prüfen
sudo ufw allow 3001

# Von anderem Gerät testen
curl http://raspberry-pi-ip:3001/api/health
```

## Minimal-Installation

Für absolute Minimalinstallation nur diese Dateien:

```
gewachshaus/
├── server-simple.js    # Server
├── index.html          # Web UI
└── data.json           # (wird automatisch erstellt)
```

Das ist alles! Keine npm install nötig.

## Upgrade von alter Version

```bash
# Alte Daten sichern
cp fertilizer.db fertilizer.db.backup

# Neue Dateien kopieren
cp server-simple.js ~/gewachshaus/
cp index.html ~/gewachshaus/

# Starten
./start.sh restart
```

Die alte SQLite-Datenbank wird nicht automatisch migriert. 
Bei Bedarf können die Daten manuell in data.json übertragen werden.
