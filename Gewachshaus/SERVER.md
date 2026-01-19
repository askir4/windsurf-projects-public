# Server-Installation und Konfiguration

## Voraussetzungen
- Node.js 14+
- npm

## Installation

```bash
npm install
```

## Start

```bash
npm start
```

Optional (Raspberry Pi Startskript):
```bash
npm run start:daemon
npm run start:status
npm run start:logs
```

Standard URL: http://localhost:3001

---

## Datenhaltung

- Daten werden in `data.json` gespeichert
- Atomisches Speichern (tmp + rename)
- Automatische Backups bei Fehlern

### Relevante Bereiche in data.json
- forumPosts
- settings
- emailConfig (SMTP, Templates, Default, Recipients)
- emailLogs

---

## API Endpunkte (Auszug)

### Daten
- GET /api/data
- POST /api/data

### Forum
- GET /api/forum/posts
- POST /api/forum/posts
- POST /api/forum/posts/:id/comments

### SMTP und E-Mail
- GET /api/email/smtp (Admin)
- POST /api/email/smtp (Admin)
- POST /api/email/test (Admin)

### Templates
- GET /api/email/templates (Admin)
- POST /api/email/templates (Admin)
- PUT /api/email/templates/:id (Admin)
- DELETE /api/email/templates/:id (Admin)

### E-Mail Konfiguration
- GET /api/email/config (Admin)
- POST /api/email/config (Admin)

### E-Mail Logs
- GET /api/email/logs?limit=100 (Admin)

### Alarm Versand (intern)
- POST /api/email/alarms/send

---

## Sicherheit

- Rate Limiting (In-Memory)
- CORS Restrictions
- Security Headers

---

## Hinweis

SMTP Zugangsdaten werden serverseitig in `data.json` gespeichert. Die UI zeigt das Passwort nicht an und sendet es nur bei Aenderung.
