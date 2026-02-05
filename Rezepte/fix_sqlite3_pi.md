# 🔧 SQLite3 Architecture Fix for Raspberry Pi

## 🚨 Problem: `invalid ELF header`

The error means that sqlite3 was compiled for a different CPU architecture (x86 instead of ARM).

---

## 🛠️ Solution 1: Recompile sqlite3 (recommended)

### 1. Install build tools
```bash
sudo apt update
sudo apt install -y build-essential python3-dev
```

### 2. Reinstall Node.js (if needed)
```bash
# Uninstall current version
sudo apt remove nodejs npm

# Node.js 18.x für ARM neu installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Überprüfen
node --version
npm --version
```

### 3. sqlite3 neu kompilieren
```bash
cd /home/lionsin4/Rezepte

# Alte sqlite3 löschen
rm -rf node_modules/sqlite3
npm cache clean --force

# sqlite3 neu installieren mit rebuild
npm install sqlite3 --build-from-source

# Oder alle Module neu installieren
rm -rf node_modules package-lock.json
npm install
```

### 4. Testen
```bash
node -e "require('sqlite3'); console.log('✅ sqlite3 funktioniert!')"
```

---

## 🛠️ Lösung 2: Alternative sqlite3 Pakete

### 1. better-sqlite3 (oft stabiler auf ARM)
```bash
# sqlite3 entfernen
npm uninstall sqlite3

# better-sqlite3 installieren
npm install better-sqlite3

# In server.js anpassen:
# const sqlite3 = require('sqlite3'); → const Database = require('better-sqlite3');
```

### 2. server.js für better-sqlite3 anpassen
```bash
cp server.js server.js.backup
nano server.js
```

**Änderungen in server.js:**
```javascript
// Alt:
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Neu:
const Database = require('better-sqlite3');
const db = new Database(dbPath);
console.log('Connected to SQLite database');

// Alle db.run() → db.exec()
// Alle db.get() → db.prepare().get()
// Alle db.all() → db.prepare().all()
```

---

## 🛠️ Lösung 3: Docker (professionell)

### 1. Docker installieren
```bash
# Docker für Raspberry Pi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker lionsin4

# Docker Compose
sudo pip3 install docker-compose
```

### 2. Dockerfile erstellen
```bash
nano Dockerfile
```

**Dockerfile Inhalt:**
```dockerfile
FROM node:18-bullseye-slim

WORKDIR /app

# Build-Tools für sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

### 3. docker-compose.yml erstellen
```bash
nano docker-compose.yml
```

**docker-compose.yml Inhalt:**
```yaml
version: '3.8'
services:
  recipe-app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
      - ./recipes.db:/app/recipes.db
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

### 4. Docker starten
```bash
docker-compose up -d
```

---

## 🔍 Fehlerbehebung

### 1. Architektur prüfen
```bash
# CPU-Architektur
uname -m
# Sollte: armv7l oder aarch64

# Node.js Architektur
node -e "console.log(process.arch)"
# Sollte: arm
```

### 2. Module prüfen
```bash
# sqlite3 Binary prüfen
file node_modules/sqlite3/build/Release/node_sqlite3.node
# Sollte: ELF 32-bit LSB ... ARM ...

# Falsch: ELF 64-bit LSB ... x86-64 ...
```

### 3. Logs prüfen
```bash
# Detaillierte Fehler
npm install sqlite3 --verbose

# Build-Logs
npm rebuild sqlite3 --verbose
```

---

## 🚀 Schnell-Test

```bash
# 1. Projekt neu aufsetzen
cd /home/lionsin4
rm -rf Rezepte
git clone <dein-repo> Rezepte
cd Rezepte

# 2. Node.js neu installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Module neu installieren
npm install --build-from-source

# 4. Testen
node server.js
```

---

## ✅ Erfolgreich wenn:

- `node -e "require('sqlite3')"` läuft ohne Fehler
- `node server.js` startet erfolgreich
- App ist unter `http://localhost:3001` erreichbar

---

## 📱 Frontend separat starten

```bash
# In neuem Terminal
cd /home/lionsin4/Rezepte/client
npm start
```

---

## 🎯 Empfehlung

**Lösung 1** (sqlite3 neu kompilieren) ist meistens erfolgreich.
**Lösung 3** (Docker) ist die professionellste und reproduzierbarste Lösung.
