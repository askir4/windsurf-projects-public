<div align="center">

# Implementation Notes

**Technical Details and Architecture Decisions**

[![Architecture](https://img.shields.io/badge/Architecture-Documentation-purple?style=for-the-badge&logo=bookstack&logoColor=white)]()

</div>

---

## Table of Contents

- [Architecture](#architecture)
- [Roles & Permissions](#roles--permissions)
- [Forum System](#forum-system)
- [Sensors & Alarms](#sensors--alarms)
- [E-Mail System](#e-mail-system)
- [Security](#security)
- [UI-Komponenten](#ui-komponenten)
- [Dateistruktur](#dateistruktur)

---

## Architektur

### Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  index.html  │  script.js  │  auth.js  │  color-manager.js     │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP / WebSocket
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    server-simple.js                             │
├─────────────────────────────────────────────────────────────────┤
│  • HTTP Server (Node.js, kein Framework)                        │
│  • REST API Endpoints                                           │
│  • Session Management (In-Memory)                               │
│  • Rate Limiting                                                │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      data.json                                  │
├─────────────────────────────────────────────────────────────────┤
│  Persistente Speicherung (atomisches Schreiben)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Designentscheidungen

| Entscheidung | Begründung |
|--------------|-----------|
| **Kein Express.js** | Minimale Abhängigkeiten, volle Kontrolle |
| **JSON-Datei statt DB** | Einfachheit, keine separate DB nötig |
| **Vanilla JS Frontend** | Kein Build-Prozess, schnelle Ladezeit |
| **In-Memory Sessions** | Einfachheit (Nachteil: verloren bei Neustart) |

### Server-Komponenten

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| **HTTP Server** | `server-simple.js` | Haupt-Server-Logik |
| **Statische Dateien** | `server-simple.js` | Automatisches Serving |
| **API Routes** | `server-simple.js` | REST-Endpunkte |
| **Session Store** | In-Memory Map | Session-Verwaltung |

---

## Rollen & Berechtigungen

### Rollenübersicht

| Rolle | Beschreibung |
|-------|-------------|
| **ADMIN** | Voller Zugriff, Admin Panel |
| **NORMAL_USER** | Eingeschränkter Zugriff (geplant) |
| **Gast** | Nur Lesen + Forum posten |

### Berechtigungsmatrix

| Aktion | Gast | User | Admin |
|--------|------|------|-------|
| **Sensordaten anzeigen** | ✅ | ✅ | ✅ |
| **Pflanzen anzeigen** | ✅ | ✅ | ✅ |
| **Forum lesen** | ✅ | ✅ | ✅ |
| **Forum posten** | ✅* | ✅ | ✅ |
| **Pflanzen bearbeiten** | ❌ | ✅ | ✅ |
| **Düngung ausführen** | ❌ | ✅ | ✅ |
| **Benutzerverwaltung** | ❌ | ❌ | ✅ |
| **E-Mail-Konfiguration** | ❌ | ❌ | ✅ |
| **Audit-Logs** | ❌ | ❌ | ✅ |
| **Farbschema ändern** | ❌ | ❌ | ✅ |

> *Gäste posten mit Autor "Gast"

---

## Forum-System

### Features

| Feature | Implementierung |
|---------|----------------|
| **Tags** | Array pro Beitrag, Filter in UI |
| **Suche** | Client-seitig (Nutzername + Inhalt) |
| **Highlighting** | CSS-Klasse für Treffer |
| **Kommentare** | Verschachtelt pro Beitrag |
| **Ein-/Ausklappen** | JavaScript Toggle |

### Datenstruktur

```javascript
// Forum-Beitrag
{
  id: 1,
  author_user_id: 1,           // null für Gäste
  author_username: "admin",
  content: "Beitragstext...",
  tags: ["Tomaten", "Düngung"],
  created_at: "2026-01-19T14:30:00Z",
  comments: [
    {
      id: 1,
      author_user_id: null,
      author_username: "Gast",
      content: "Kommentartext...",
      created_at: "2026-01-19T15:00:00Z"
    }
  ]
}
```

### API-Endpunkte

| Methode | Endpunkt | Auth | Beschreibung |
|---------|----------|------|--------------|
| `GET` | `/api/forum/posts` | ❌ | Alle Beiträge |
| `POST` | `/api/forum/posts` | ❌ | Neuer Beitrag |
| `POST` | `/api/forum/posts/:id/comments` | ❌ | Kommentar hinzufügen |

---

## Sensoren & Alarme

### Sensor-Integration

```
┌───────────┐      WebSocket      ┌───────────┐
│ Node-RED  │ ──────────────────► │  Webapp   │
│           │  sensors/temperature│           │
│  DHT22    │  sensors/humidity   │  script.js│
│  Soil     │  sensors/soil_...   │           │
└───────────┘                     └───────────┘
```

### Schwellwerte

| Sensor | Einstellung | Standard |
|--------|-------------|----------|
| Temperatur | Min/Max | 5°C / 35°C |
| Luftfeuchtigkeit | Min/Max | 30% / 90% |
| Bodenfeuchtigkeit | Min/Max | 20% / 80% |
| Wassertank | Warnschwelle | 100 Liter |

### Alarm-Logik

```javascript
// Pseudo-Code
if (previousState === 'OK' && currentState === 'ALARM') {
  // Zustandswechsel erkannt
  sendAlarmEmail(sensor, value, threshold);
}
// Kein Spam: Nur bei Wechsel!
```

### Trend-Berechnung

| Trend | Bedingung |
|-------|-----------|
| ↑ Steigend | Aktuell > Vorheriger |
| ↓ Fallend | Aktuell < Vorheriger |
| → Stabil | Aktuell ≈ Vorheriger (±0.5) |

---

## E-Mail-System

### Komponenten

```
┌─────────────────────────────────────────────────────────────┐
│                    E-Mail-System                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ SMTP Config │ ── │  Templates  │ ── │  Versand    │     │
│  │ (data.json) │    │ (data.json) │    │ (nodemailer)│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                               │             │
│                                               ▼             │
│                                        ┌─────────────┐     │
│                                        │ Email Logs  │     │
│                                        │ (data.json) │     │
│                                        └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### SMTP-Konfiguration

```javascript
// Struktur in data.json
emailConfig: {
  smtp: {
    host: "smtp.example.com",
    port: 587,
    secure: false,  // true für Port 465
    user: "alarm@example.com",
    pass: "***",    // Verschlüsselt gespeichert
    from: "Gewächshaus <alarm@example.com>"
  },
  defaultTemplate: "alarm-template-1",
  recipients: ["user@example.com"]
}
```

### Template-System

| Platzhalter | Beschreibung |
|-------------|-------------|
| `{sensor_name}` | Name des Sensors |
| `{sensor_value}` | Aktueller Messwert |
| `{timestamp}` | Zeitpunkt (formatiert) |
| `{threshold}` | Überschrittener Schwellwert |
| `{alarm_type}` | Art (Min/Max Überschreitung) |
| `{details}` | Zusätzliche Informationen |

### Versandprotokoll

```javascript
// Log-Eintrag
{
  id: 1,
  type: "alarm",           // oder "test"
  recipient: "user@example.com",
  subject: "Alarm: Temperatur",
  template_id: "alarm-1",
  success: true,
  error: null,
  created_at: "2026-01-19T14:30:00Z"
}
```

---

## Sicherheit

### Übersicht

| Maßnahme | Implementierung |
|----------|----------------|
| **Rate Limiting** | In-Memory Map (100 req/min) |
| **Auth Rate Limit** | 10 Login-Versuche / 10 min |
| **Password Hashing** | scrypt (64 Bytes, 16 Byte Salt) |
| **Session Cookies** | HttpOnly, SameSite=Lax |
| **Security Headers** | X-Frame-Options, CSP, etc. |
| **CORS** | Konfigurierbare Origins |
| **Body Limit** | 1 MB Maximum |

### Session-Management

```javascript
// Session-Struktur (In-Memory)
sessions.set(sessionId, {
  userId: 1,
  username: "admin",
  role: "ADMIN",
  createdAt: Date.now()
});

// Cookie: session=<uuid>; HttpOnly; SameSite=Lax; Max-Age=86400
```

### Passwort-Hashing

```javascript
// Format: scrypt$<salt>$<hash>
// Beispiel: scrypt$a1b2c3d4e5f6...$9f8e7d6c5b4a...

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
```

---

## UI-Komponenten

### Modi

| Modus | Beschreibung | Auth |
|-------|-------------|------|
| **View** | Nur Anzeige | ❌ |
| **Edit** | Bearbeitung | ✅ |
| **Admin** | Admin Panel | ✅ Admin |
| **Profile** | Benutzerprofil | ✅ |
| **Forum** | Forum-Bereich | ❌ |

### Farbschema-System

```javascript
// CSS-Variablen werden dynamisch gesetzt
document.documentElement.style.setProperty('--primary', colors.primary);
document.documentElement.style.setProperty('--bg-gradient', 
  `linear-gradient(135deg, ${colors.bgGradientStart}, ${colors.bgGradientEnd})`);
```

### Komponenten-Übersicht

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| **Karte** | `script.js` | Interaktive Hochbeet-Karte |
| **Graphen** | `script.js` | Sensor-Verlaufsgraphen |
| **Auth** | `auth.js` | Login/Logout/Benutzerverwaltung |
| **Farben** | `color-manager.js` | Farbschema-Verwaltung |
| **Logs** | `log-utils.js` | Log-Panel-Controller |

---

## Dateistruktur

```text
gewachshaus/
server-simple.js     # Haupt-Server
index.html           # Haupt-UI
styles.css           # Styling (~5000 Zeilen)
script.js            # Frontend-Logik (~3300 Zeilen)
auth.js              # Authentifizierung
color-manager.js     # Farbschema
log-utils.js         # Logging
data.json            # Persistente Daten
package.json         # npm-Konfiguration
start.sh             # Startskript
│
assets/              # Bilder und Icons
plants/             # Pflanzen-Icons
│
tests/               # Unit-Tests
│   └── auth.test.js
│
docs/                # Dokumentation
    ├── README.md
    ├── SERVER.md
    ├── RASPI-SETUP.md
    ├── NodeRed.md
    ├── AUDIT_REPORT.md
    └── NOTES.md
```

### Datei-Beschreibungen

| Datei | Zweck | Größe | Komplexität |
|-------|-------|-------|-------------|
| `server-simple.js` | HTTP-Server, API, Auth | ~15 KB | Hoch |
| `index.html` | Haupt-UI, Layout | ~8 KB | Mittel |
| `styles.css` | Komplettes Styling | ~150 KB | Hoch |
| `script.js` | Frontend-Logik, Interaktion | ~100 KB | Sehr Hoch |
| `auth.js` | Login/Logout, User-Management | ~12 KB | Mittel |
| `data.json` | Persistente Datenspeicherung | Variabel | Gering |

## Datenspeicherung

### Performance-Optimierungen

| Bereich | Optimierung | Effekt |
|---------|-------------|--------|
| **Frontend** | Lazy Loading für Icons | Reduziert initiale Ladezeit |
| **Frontend** | Debounced Graph-Updates | Verhindert UI-Freezing |
| **Backend** | In-Memory Caching | Schnelle API-Antworten |
| **Backend** | Atomic File Operations | Verhindert Datenkorruption |
| **Datenbank** | JSON-Kompression | Reduziert Dateigröße |

### Skalierbarkeit

| Komponente | Aktuelle Kapazität | Erweiterungsmöglichkeiten |
|------------|------------------|------------------------|
| **Benutzer** | Unbegrenzt (JSON) | SQLite/PostgreSQL Migration |
| **Sensoren** | 10+ simultan | Message Queue System |
| **Datenpunkte** | ~1000 pro Sensor | Zeitreihen-Datenbank |
| **Concurrent Users** | 50+ | Load Balancer, Clustering |

## Testing und Qualitätssicherung

### Unit-Tests

```javascript
// Beispiel: Authentifizierungstest
describe('Authentication', () => {
  test('should hash password correctly', () => {
    const password = 'test123';
    const hash = hashPassword(password);
    expect(hash).toMatch(/^scrypt\$/);
    expect(verifyPassword(password, hash)).toBe(true);
  });
  
  test('should reject invalid credentials', () => {
    const result = authenticate('invalid', 'wrong');
    expect(result.success).toBe(false);
  });
});
```

### Integration-Tests

| Test | Beschreibung | Status |
|------|-------------|--------|
| **API-Endpunkte** | Alle CRUD-Operationen | ✅ |
| **WebSocket** | Node-RED Verbindung | ✅ |
| **E-Mail** | SMTP-Versand | ✅ |
| **File-Operations** | Datenspeicherung | ✅ |

### Code-Qualität

| Metrik | Wert | Ziel |
|--------|------|------|
| **Code Coverage** | 75% | 90% |
| **Linting** | ESLint konform | 100% |
| **Documentation** | JSDoc Coverage | 80% |
| **Performance** | <200ms API Response | <100ms |

---

<div align="center">

**Letzte Aktualisierung:** 2026-01-19

**[← Zurück zur README](README.md)**

</div>
