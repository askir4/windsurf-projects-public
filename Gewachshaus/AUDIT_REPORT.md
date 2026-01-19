<div align="center">

# 🔒 Sicherheitsaudit Report

**Code-Review und Sicherheitsanalyse**

[![Security](https://img.shields.io/badge/Security-Audit-orange?style=for-the-badge&logo=shield&logoColor=white)]()
[![Date](https://img.shields.io/badge/Datum-2026--01--19-blue?style=for-the-badge)]()

</div>

---

## 📋 Inhaltsverzeichnis

- [📊 Zusammenfassung](#-zusammenfassung)
- [✅ Implementierte Sicherheitsmaßnahmen](#-implementierte-sicherheitsmaßnahmen)
- [⚠️ Identifizierte Risiken](#️-identifizierte-risiken)
- [📋 Empfehlungen](#-empfehlungen)
- [🔍 Detaillierte Analyse](#-detaillierte-analyse)

---

## 📊 Zusammenfassung

| Kategorie | Status |
|-----------|--------|
| **Authentifizierung** | ✅ Implementiert |
| **Autorisierung** | ✅ Rollenbasiert |
| **Rate Limiting** | ✅ Aktiv |
| **Security Headers** | ✅ Vorhanden |
| **Passwort-Hashing** | ✅ scrypt |
| **HTTPS** | ⚠️ Optional |
| **Session-Persistenz** | ⚠️ In-Memory |

### Systemübersicht

| Komponente | Technologie |
|------------|-------------|
| **Server** | `server-simple.js` (Node.js HTTP) |
| **Datenbank** | `data.json` (JSON-Datei) |
| **Sessions** | In-Memory Map |
| **E-Mail** | Nodemailer (SMTP) |

---

## ✅ Implementierte Sicherheitsmaßnahmen

### 🛡️ Authentifizierung & Sessions

| Feature | Beschreibung | Status |
|---------|-------------|--------|
| **Passwort-Hashing** | scrypt mit Salt (64 Bytes) | ✅ |
| **Session-Cookies** | HttpOnly, SameSite=Lax | ✅ |
| **Secure-Flag** | Bei HTTPS automatisch | ✅ |
| **Session-Timeout** | 24 Stunden | ✅ |
| **Legacy-Hash-Migration** | SHA256 → scrypt bei Login | ✅ |

### 🚦 Rate Limiting

| Typ | Limit | Zeitfenster |
|-----|-------|-------------|
| **Allgemein** | 100 Requests | 1 Minute |
| **Login-Versuche** | 10 Versuche | 10 Minuten |

### 📋 Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=15552000 (nur bei HTTPS)
```

### 🔐 Weitere Maßnahmen

| Feature | Beschreibung |
|---------|-------------|
| **Body Limit** | Maximale Request-Größe: 1 MB |
| **CORS** | Konfigurierbare Origins |
| **Atomisches Schreiben** | Verhindert Datenverlust |
| **Audit-Logs** | Alle Admin-Aktionen protokolliert |
| **Timing-Safe Compare** | Für Passwort-Vergleiche |

---

## ⚠️ Identifizierte Risiken

### 🔴 Hohes Risiko

| Risiko | Beschreibung | Auswirkung |
|--------|-------------|------------|
| **Standard-Credentials** | `admin/admin123` bei Erstinstallation | Unbefugter Zugriff |
| **Kein HTTPS erzwungen** | Daten im Klartext übertragbar | Abhören möglich |

### 🟠 Mittleres Risiko

| Risiko | Beschreibung | Auswirkung |
|--------|-------------|------------|
| **Sessions nicht persistent** | Verlust bei Server-Neustart | Benutzer müssen neu einloggen |
| **SMTP-Credentials in data.json** | Passwort in Datei gespeichert | Bei Zugriff kompromittiert |
| **Kein CSP-Header** | Content Security Policy fehlt | XSS-Risiko erhöht |

### 🟡 Niedriges Risiko

| Risiko | Beschreibung | Auswirkung |
|--------|-------------|------------|
| **SESSION_SECRET Standard** | Fester Wert im Code | Vorhersagbare Sessions |
| **Keine Passwort-Komplexität** | Nur Mindestlänge 8 Zeichen | Schwache Passwörter möglich |

---

## 📋 Empfehlungen

### 🔴 Kritisch (Sofort umsetzen)

| # | Empfehlung | Aufwand |
|---|------------|---------|
| 1 | **Admin-Passwort ändern** nach Erstinstallation | ⭐ |
| 2 | **SESSION_SECRET** per Umgebungsvariable setzen | ⭐ |
| 3 | **HTTPS aktivieren** (Nginx/Caddy als Reverse Proxy) | ⭐⭐ |

### 🟠 Wichtig (Zeitnah umsetzen)

| # | Empfehlung | Aufwand |
|---|------------|---------|
| 4 | **CSP-Header** hinzufügen | ⭐⭐ |
| 5 | **Firewall** konfigurieren (nur 80/443 öffentlich) | ⭐ |
| 6 | **Automatische Backups** von `data.json` einrichten | ⭐ |

### 🟡 Optional (Bei Bedarf)

| # | Empfehlung | Aufwand |
|---|------------|---------|
| 7 | Session-Persistenz (Redis/SQLite) | ⭐⭐⭐ |
| 8 | Separate Konfigurationsdatei für Secrets | ⭐⭐ |
| 9 | Passwort-Komplexitätsregeln | ⭐⭐ |
| 10 | 2-Faktor-Authentifizierung | ⭐⭐⭐ |

---

## 🔍 Detaillierte Analyse

### Authentifizierung

```
┌─────────────────────────────────────────────────────────────┐
│                    Login-Prozess                            │
├─────────────────────────────────────────────────────────────┤
│  1. Rate Limit prüfen (max 10/10min pro IP)                │
│  2. Benutzer in data.json suchen                            │
│  3. Passwort mit scrypt verifizieren                        │
│  4. Legacy-Hash (SHA256) bei Bedarf migrieren               │
│  5. Session erstellen (UUID v4)                             │
│  6. Cookie setzen (HttpOnly, SameSite=Lax)                  │
│  7. Audit-Log schreiben                                     │
└─────────────────────────────────────────────────────────────┘
```

### Passwort-Hashing

| Algorithmus | Parameter |
|-------------|-----------|
| **scrypt** | Salt: 16 Bytes (random) |
| | Key Length: 64 Bytes |
| | Format: `scrypt$<salt>$<hash>` |

### CORS-Konfiguration

```
┌─────────────────────────────────────────────────────────────┐
│  ALLOWED_ORIGINS gesetzt?                                   │
│     │                                                       │
│     ├── Ja ──► Nur diese Origins erlaubt                    │
│     │                                                       │
│     └── Nein ──► Origin = Host prüfen (same-origin)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Risiko-Matrix

```
        │ Niedrig    Mittel     Hoch
────────┼─────────────────────────────
 Kritisch │            │         │ Standard-Creds
        │            │         │ Kein HTTPS
────────┼─────────────────────────────
 Hoch    │            │ Session- │
        │            │ Persistenz│
────────┼─────────────────────────────
 Mittel  │ SESSION_  │ SMTP in   │
        │ SECRET    │ data.json │
────────┼─────────────────────────────
 Niedrig │ Passwort- │ Kein CSP  │
        │ Komplexität│           │
```

---

## 🛠️ Implementierungshinweise

### HTTPS mit Caddy (einfachste Methode)

```bash
# Caddy installieren
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

```
# /etc/caddy/Caddyfile
gewachshaus.example.com {
    reverse_proxy localhost:3001
}
```

### SESSION_SECRET generieren

```bash
# Sicheren Schlüssel generieren
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# In Umgebungsvariable setzen
export SESSION_SECRET=<generierter_schlüssel>
```

---

<div align="center">

**Letzte Aktualisierung:** 2026-01-19

**[← Zurück zur README](README.md)**

</div>
