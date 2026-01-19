# Raspberry Pi Setup

## Inhalt
- Installation
- Start
- Autostart
- Troubleshooting

---

## Installation

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

cd ~/gewachshaus
npm install
```

---

## Start

```bash
node server-simple.js
```

Alternativ mit Startskript:
```bash
chmod +x start.sh
./start.sh start
./start.sh status
./start.sh logs
```

Zugriff: http://raspberry-pi-ip:3001
Login: admin / admin123

---

## Autostart (systemd)

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

## Troubleshooting

```bash
node --version
./start.sh status
cat server.log
```
