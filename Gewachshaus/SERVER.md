# Server-Installation und Konfiguration

## Inhalt
- Voraussetzungen
- Installation und Start
- Datenhaltung
- API Endpunkte (Auszug)
- SMTP und E-Mail
- Sicherheit

---

## Voraussetzungen
- Node.js 14+
- npm

---

## Installation und Start

```bash
npm install
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

- Alle Daten in `data.json`
- Atomisches Speichern (tmp + rename)
- Backup bei Fehlern

Wichtige Bereiche:
- forumPosts
- settings
- emailConfig (SMTP, Templates, Default, Empfaenger)
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

### SMTP und E-Mail (Admin)
- GET /api/email/smtp
- POST /api/email/smtp
- POST /api/email/test

### Templates (Admin)
- GET /api/email/templates
- POST /api/email/templates
- PUT /api/email/templates/:id
- DELETE /api/email/templates/:id

### E-Mail Konfiguration (Admin)
- GET /api/email/config
- POST /api/email/config

### E-Mail Logs (Admin)
- GET /api/email/logs?limit=100

### Alarm Versand (intern)
- POST /api/email/alarms/send

---

## SMTP und Platzhalter

Verfuegbare Platzhalter in Templates:
- {sensor_name}
- {sensor_value}
- {timestamp}
- {threshold}
- {alarm_type}
- {details}

---

## Sicherheit

- Rate Limiting (In-Memory)
- Security Headers
- Body Limit (1MB)

Hinweis: SMTP Zugangsdaten werden in `data.json` gespeichert. Die UI zeigt Passwoerter nicht an und sendet sie nur bei Aenderung.
