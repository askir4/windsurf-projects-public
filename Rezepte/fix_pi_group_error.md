# 🔧 Raspberry Pi GROUP Error Fix

## 🚨 Problem: `status=216/GROUP`

The error means that the systemd service is trying to run as a non-existent group.

---

## 🛠️ Solution 1: Fix Group

### 1. Check Current User/Groups
```bash
# Show current user and groups
id lionsin4
# Output e.g.: uid=1000(lionsin4) gid=1000(lionsin4) groups=1000(lionsin4),...

# Show all groups
getent group | grep lionsin4
```

### 2. Service stoppen
```bash
sudo systemctl stop recipe-app.service
sudo systemctl disable recipe-app.service
```

### 3. Service mit korrekter Gruppe erstellen
```bash
sudo nano /etc/systemd/system/recipe-app.service
```

**Korrigierter Inhalt:**
```ini
[Unit]
Description=Recipe App
After=network.target

[Service]
Type=simple
User=lionsin4
# Group=1000 oder Group=lionsin4 oder Group komplett entfernen
WorkingDirectory=/home/lionsin4/Rezepte
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=recipe-app

[Install]
WantedBy=multi-user.target
```

### 4. Service neu starten
```bash
sudo systemctl daemon-reload
sudo systemctl enable recipe-app.service
sudo systemctl start recipe-app.service
sudo systemctl status recipe-app.service
```

---

## 🛠️ Lösung 2: Group komplett entfernen (empfohlen)

### Service ohne Group-Direktive:
```ini
[Unit]
Description=Recipe App
After=network.target

[Service]
Type=simple
User=lionsin4
WorkingDirectory=/home/lionsin4/Rezepte
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**Warum?** systemd verwendet automatisch die primäre Gruppe des Users, wenn keine Group angegeben ist.

---

## 🛠️ Lösung 3: PM2 Methode (einfachste)

### 1. PM2 verwenden
```bash
# PM2 für Autostart einrichten
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u lionsin4 --hp /home/lionsin4

# App mit PM2 starten
cd /home/lionsin4/Rezepte
pm2 start server.js --name "recipe-backend"

# PM2 Konfiguration speichern
pm2 save

# PM2 Service aktivieren
sudo systemctl enable pm2-lionsin4.service
```

### 2. PM2 Status prüfen
```bash
pm2 status
pm2 logs
```

---

## 🔍 Fehlerbehebung

### 1. User existiert?
```bash
# User prüfen
getent passwd lionsin4

# Falls nicht existiert (selten):
sudo adduser lionsin4
```

### 2. Gruppen prüfen
```bash
# Primäre Gruppe prüfen
id -gn lionsin4

# Alle Gruppen prüfen
groups lionsin4
```

### 3. Dateiberechtigungen prüfen
```bash
# Projekt-Owner prüfen
ls -la /home/lionsin4/Rezepte

# Falls falscher Owner:
sudo chown -R lionsin4:lionsin4 /home/lionsin4/Rezepte
```

### 4. Node.js Pfad prüfen
```bash
# Node.js Pfad
which node
# Sollte: /usr/bin/node

# Falls anderer Pfad:
which node >> /home/lionsin4/Rezepte/node_path.txt
# Pfad in Service einfügen
```

---

## 🚀 Testen

### 1. Manueller Test
```bash
# Als lionsin4 User
su - lionsin4
cd /home/lionsin4/Rezepte
node server.js
# Strg+C zum Beenden
```

### 2. Service Test
```bash
sudo systemctl restart recipe-app.service
sudo systemctl status recipe-app.service
```

### 3. Logs ansehen
```bash
# Live-Logs
sudo journalctl -u recipe-app.service -f

# Alle Logs
sudo journalctl -u recipe-app.service
```

---

## 📱 Frontend separat starten

```bash
# PM2 für Frontend
cd /home/lionsin4/Rezepte/client
pm2 start npm --name "recipe-frontend" -- start

# Oder systemd Service
sudo nano /etc/systemd/system/recipe-frontend.service
```

**Frontend Service:**
```ini
[Unit]
Description=Recipe Frontend
After=network.target recipe-app.service

[Service]
Type=simple
User=lionsin4
WorkingDirectory=/home/lionsin4/Rezepte/client
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## ✅ Erfolgreich wenn:

- `sudo systemctl status recipe-app.service` zeigt `active (running)`
- Kein GROUP-Fehler mehr
- App ist unter `http://localhost:3001` erreichbar

---

## 🎯 Empfehlung

**Lösung 2** (Group entfernen) ist die einfachste und meistens erfolgreich.
**Lösung 3** (PM2) ist die professionellste und zuverlässigste Methode.
