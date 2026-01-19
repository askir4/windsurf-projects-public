# Gewachshaus - Raspberry Pi Setup

Optimierte Version fuer Raspberry Pi und ressourcenbeschraenkte Systeme.

## Schnellstart

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

cd ~/gewachshaus
npm install
node server-simple.js
```

Zugriff: http://raspberry-pi-ip:3001
Login: admin / admin123

---

## Startskript

```bash
chmod +x start.sh
./start.sh start
./start.sh status
./start.sh logs
```

---

## Systemd Service (Autostart)

```bash
sudo cp gewachshaus.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gewachshaus
sudo systemctl start gewachshaus
```

---

## Konfiguration (optional)

```bash
export PORT=3001
export ADMIN_USER=admin
export ADMIN_PASS=admin123
export SESSION_SECRET=xxx
```

SMTP und E-Mail Templates werden im Admin Panel konfiguriert.

---

## Daten

`data.json` wird automatisch erstellt und gespeichert.
Backup:
```bash
cp data.json data.backup.json
```

---

## Troubleshooting

```bash
node --version
./start.sh status
cat server.log
```
