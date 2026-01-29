<div align="center">

# Server-Installation und Konfiguration

**Vollständige Anleitung für das Backend-Setup**

</div>

---

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Installation & Start](#installation--start)
- [Datenhaltung](#datenhaltung)
- [API-Endpunkte](#api-endpunkte)
- [E-Mail & SMTP](#e-mail--smtp)
- [Sicherheit](#sicherheit)

---

## Voraussetzungen

| Komponente | Version | Beschreibung |
|------------|---------|--------------|
| **Node.js** | 18+ | JavaScript Runtime |
| **npm** | 9+ | Paketmanager (mit Node.js) |

### Optionale Komponenten

| Komponente | Zweck |
|------------|-------|
| **Node-RED** | Sensor-Integration über WebSocket |
| **SMTP-Server** | E-Mail-Versand für Alarme |

---

## Installation & Start

### Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Server starten
npm start
```

### Startoptionen

| Befehl | Beschreibung |
|--------|-------------|
| `npm start` | Normaler Start |
| `npm run dev` | Entwicklungsmodus |
| `npm run start:daemon` | Als Hintergrundprozess (Raspberry Pi) |
| `npm run start:status` | Status des Daemon prüfen |
| `npm run start:logs` | Logs des Daemon anzeigen |
| `npm run start:stop` | Daemon stoppen |

### Zugriff

```text
Weboberfläche:  http://localhost:3001
Health-Check:   http://localhost:3001/api/health
```

---

## Datenhaltung

### Übersicht

Der Server verwendet eine einfache JSON-Datei als Datenbank.

```text
data.json
├── users          # Benutzerkonten
├── zones          # Hochbeete/Zonen
├── plants         # Pflanzen
├── forumPosts     # Forum-Beiträge
├── settings       # Allgemeine Einstellungen
├── colorScheme    # Farbschema
├── emailConfig    # E-Mail-Konfiguration
├── emailLogs      # Versandprotokoll
├── logs           # System-Logs
└── auditLogs      # Audit-Logs
```

### Sicherheitsmerkmale

| Feature | Beschreibung |
|---------|-------------|
| **Atomisches Schreiben** | Schreiben in temporäre Datei, dann Umbenennen |
| **Backup bei Fehlern** | Automatische Sicherung vor Überschreiben |
| **Debounced Saving** | Verzögertes Speichern zur Lastreduzierung |

---

## API-Endpunkte

### Authentifizierung

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `POST` | `/api/auth/login` | Benutzer anmelden | ❌ |
| `POST` | `/api/auth/logout` | Benutzer abmelden | ✅ |
| `GET` | `/api/auth/me` | Aktueller Benutzer | ✅ |
| `POST` | `/api/auth/change-password` | Passwort ändern | ✅ |

### Daten

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/data` | Alle Daten abrufen | ❌ |
| `POST` | `/api/data` | Daten speichern | ✅ |

### Zonen & Pflanzen

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/zones` | Alle Zonen | ❌ |
| `POST` | `/api/zones` | Zone erstellen | ✅ |
| `GET` | `/api/plants` | Alle Pflanzen | ❌ |
| `POST` | `/api/plants` | Pflanze hinzufügen | ✅ |
| `PUT` | `/api/plants/:id` | Pflanze aktualisieren | ✅ |
| `DELETE` | `/api/plants/:id` | Pflanze löschen | ✅ |

### Forum

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/forum/posts` | Alle Beiträge | ❌ |
| `POST` | `/api/forum/posts` | Beitrag erstellen | ❌* |
| `POST` | `/api/forum/posts/:id/comments` | Kommentar hinzufügen | ❌* |

> *Gäste können posten, aber der Autor wird als "Gast" angezeigt.

### Benutzerverwaltung (Admin)

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/users` | Alle Benutzer | 🔐 Admin |
| `POST` | `/api/users` | Benutzer erstellen | 🔐 Admin |
| `PUT` | `/api/users/:id` | Benutzer bearbeiten | 🔐 Admin |
| `DELETE` | `/api/users/:id` | Benutzer löschen | 🔐 Admin |
| `POST` | `/api/users/:id/reset-password` | Passwort zurücksetzen | 🔐 Admin |

### E-Mail-Konfiguration (Admin)

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/email/smtp` | SMTP-Einstellungen abrufen |
| `POST` | `/api/email/smtp` | SMTP-Einstellungen speichern |
| `POST` | `/api/email/test` | Test-E-Mail senden |
| `GET` | `/api/email/templates` | Alle Templates |
| `POST` | `/api/email/templates` | Template erstellen |
| `PUT` | `/api/email/templates/:id` | Template bearbeiten |
| `DELETE` | `/api/email/templates/:id` | Template löschen |
| `GET` | `/api/email/config` | E-Mail-Konfiguration |
| `POST` | `/api/email/config` | E-Mail-Konfiguration speichern |
| `GET` | `/api/email/logs` | Versandprotokoll |

### Farbschema

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/colors` | Aktuelles Farbschema | ❌ |
| `POST` | `/api/colors` | Farbschema speichern | 🔐 Admin |
| `POST` | `/api/colors/reset` | Auf Standard zurücksetzen | 🔐 Admin |

### System

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/health` | Health-Check |
| `GET` | `/api/logs` | System-Logs (Admin) |
| `GET` | `/api/audit-logs` | Audit-Logs (Admin) |

---

## E-Mail & SMTP

### SMTP-Konfiguration

Die SMTP-Einstellungen werden im Admin Panel unter **E-Mail → SMTP-Einstellungen** konfiguriert.

| Feld | Beschreibung | Beispiel |
|------|-------------|----------|
| **Host** | SMTP-Server | `smtp.gmail.com` |
| **Port** | SMTP-Port | `587` (TLS) oder `465` (SSL) |
| **Benutzer** | E-Mail-Adresse | `alarm@example.com` |
| **Passwort** | App-Passwort | `xxxx xxxx xxxx xxxx` |
| **Verschlüsselung** | TLS oder SSL | TLS (empfohlen) |
| **Absender** | Von-Adresse | `Gewächshaus <alarm@example.com>` |

### Beispiel-Konfigurationen

#### Gmail

```text
Host:     smtp.gmail.com
Port:     587
TLS:      Ja
Benutzer: deine-email@gmail.com
Passwort: App-Passwort (16 Zeichen)
```

> Wichtig: Bei Gmail 2-Faktor-Authentifizierung aktivieren und [App-Passwort](https://myaccount.google.com/apppasswords) erstellen.

#### Eigener Server

```text
Host:     mail.example.com
Port:     587
TLS:      Ja
Benutzer: alarm@example.com
Passwort: Dein Passwort
```

### Template-Platzhalter

E-Mail-Templates unterstützen folgende Platzhalter:

| Platzhalter | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `{sensor_name}` | Name des Sensors | `Temperatur` |
| `{sensor_value}` | Aktueller Wert | `35.2` |
| `{timestamp}` | Zeitstempel | `2026-01-19 14:30:00` |
| `{threshold}` | Schwellwert | `30` |
| `{alarm_type}` | Art des Alarms | `Überschreitung Maximum` |
| `{details}` | Zusätzliche Details | `Zone: Hochbeet 1` |

### Beispiel-Template

```html
<h2>Alarm: {sensor_name}</h2>

<p>Der Sensor <strong>{sensor_name}</strong> hat einen kritischen Wert erreicht.</p>

<table>
  <tr><td>Aktueller Wert:</td><td><strong>{sensor_value}</strong></td></tr>
  <tr><td>Schwellwert:</td><td>{threshold}</td></tr>
  <tr><td>Zeitpunkt:</td><td>{timestamp}</td></tr>
</table>

<p>{details}</p>
```

---

## Sicherheit

### Implementierte Maßnahmen

| Feature | Beschreibung |
|---------|-------------|
| **Rate Limiting** | Max. 100 Requests/Minute pro IP |
| **Auth Rate Limiting** | Max. 10 Login-Versuche / 10 Min |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, etc. |
| **Body Limit** | Maximale Request-Größe: 1 MB |
| **Session Cookies** | HttpOnly, SameSite=Lax, Secure (HTTPS) |
| **Password Hashing** | scrypt mit Salt |
| **CORS** | Konfigurierbare Origins |

### Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=15552000 (nur bei HTTPS)
```

### Empfehlungen für Produktion

| Priorität | Empfehlung | Beschreibung |
|-----------|------------|-------------|
| **Kritisch** | HTTPS aktivieren | Nginx/Caddy als Reverse Proxy |
| **Kritisch** | SESSION_SECRET setzen | Eigener geheimer Schlüssel |
| **Kritisch** | Admin-Passwort ändern | Kein Standard-Passwort verwenden |
| **Hoch** | Firewall konfigurieren | Nur Port 80/443 öffentlich |
| **Mittel** | Backup erstellen | Regelmäßiges Backup von `data.json` |
| **Mittel** | Logging überwachen | Logs auf verdächtige Aktivitäten prüfen |

### Performance-Optimierung

| Maßnahme | Beschreibung |
|-----------|-------------|
| **Debounced Saving** | Verzögertes Speichern zur Reduzierung der I/O-Last |
| **Atomisches Schreiben** | Verhindert Datenkorruption bei Abstürzen |
| **In-Memory Caching** | Sessions und Rate Limits im Speicher |
| **Body Limit** | Maximale Request-Größe: 1 MB |

### Monitoring und Logging

#### Log-Level

| Level | Beschreibung | Verwendung |
|-------|-------------|------------|
| **INFO** | Allgemeine Informationen | Server-Start, API-Aufrufe |
| **WARN** | Warnungen | Fehlgeschlagene Login-Versuche |
| **ERROR** | Fehler | Server-Fehler, Exceptions |
| **DEBUG** | Debug-Informationen | Nur in Entwicklung |

#### Health-Check

Der Health-Check Endpunkt (`/api/health`) liefert:

```json
{
  "status": "ok",
  "timestamp": "2026-01-19T14:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "memory": {
    "used": "45MB",
    "total": "512MB"
  }
}
```

---

<div align="center">

**[← Zurück zur README](README.md)**

</div>
