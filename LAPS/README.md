# LAPS Portal

**Sicheres Passwort-Anfrage-System für Microsoft LAPS + Active Directory**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Internal-red?style=for-the-badge)]()

Eine sichere Webanwendung zur Anfrage und Freigabe von lokalen Administrator-Passwörtern für Windows-Clients über Microsoft LAPS (Local Administrator Password Solution) in Kombination mit Active Directory.

---

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Features](#features)
- [Architektur](#architektur)
- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [API-Dokumentation](#api-dokumentation)
- [Sicherheit](#sicherheit)
- [Troubleshooting](#troubleshooting)

---

## Übersicht

Das LAPS Portal bietet eine sichere, auditierte Lösung für die Verwaltung von lokalen Administrator-Passwörtern in Windows-Umgebungen. Benutzer können Passwörter für spezifische Computer anfragen, während Administratoren diese Anfragen prüfen und freigeben können.

### Anwendungsfälle

- **IT-Helpdesk**: Techniker benötigen temporären Administratorzugriff
- **Wartungsarbeiten**: Geplante Systemwartung mit erweiterten Rechten
- **Notfallzugriff**: Schnelle Freigabe bei kritischen Systemproblemen
- **Compliance**: Vollständige Protokollierung aller Passwort-Zugriffe

## Features

### User-Portal

| Feature | Beschreibung |
|---------|-------------|
| **Passwort-Anfragen** | Erstellen mit Pflicht-Begründung (min. 20 Zeichen) |
| **Hostname-Validierung** | Überprüfung gegen Active Directory |
| **Status-Tracking** | Offen / Genehmigt / Abgelehnt / Abgelaufen |
| **Zeitlich begrenzte Anzeige** | Standard: 10 Minuten Sichtbarkeit |
| **Historie** | Eigene vergangene Anfragen einsehen |

### Admin-Portal

| Feature | Beschreibung |
|---------|-------------|
| **Anfragen-Queue** | Alle offenen Anfragen übersichtlich |
| **Genehmigungs-Workflow** | Akzeptieren/Ablehnen mit Kommentar |
| **Detail-Prüfung** | User, Hostname, Zeitpunkt, Begründung |
| **AD-Validierung** | Computer gefunden, LAPS verfügbar |
| **Massenaktionen** | Mehrere Anfragen gleichzeitig bearbeiten |

### Audit & Logging

| Feature | Beschreibung |
|---------|-------------|
| **Vollständiger Audit-Trail** | Alle Aktionen protokolliert |
| **Erweiterte Filter** | Nach Event-Typ, User, Hostname, Zeitraum |
| **CSV-Export** | Externe Auswertung und Reporting |
| **Integritäts-Logs** | Systemereignisse und Fehler |

### Sicherheit

| Feature | Implementierung |
|---------|----------------|
| **AD-basierte Authentifizierung** | Integration mit Active Directory |
| **JWT-Token-Sessions** | Sichere Session-Verwaltung |
| **Rate Limiting** | Schutz vor Missbrauch |
| **Verschlüsselte Speicherung** | Temporäre Passwörter verschlüsselt |
| **Log-Sicherheit** | Keine Passwörter in Logs |
| **HTTPS-Ready** | SSL/TLS Unterstützung

## Architektur

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│ Active Directory│
│   React + TS    │     │  Express + TS   │     │   LDAP/LAPS     │
│   TailwindCSS   │     │    SQLite DB    │     │                 │
│   JWT Auth      │     │   Rate Limiting  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Technologiestack

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| **Frontend** | React | 18+ | User Interface |
| **Frontend** | TypeScript | 5+ | Type Safety |
| **Frontend** | TailwindCSS | 3+ | Styling |
| **Backend** | Node.js | 18+ | Runtime |
| **Backend** | Express | 4+ | Web Framework |
| **Backend** | TypeScript | 5+ | Type Safety |
| **Datenbank** | SQLite | 3+ | Datenspeicherung |
| **Auth** | JWT | - | Session Management |
| **LDAP** | ldapjs | 3+ | AD Integration |

### Datenfluss

1. **User Login** → AD-Authentifizierung → JWT-Token
2. **Passwort-Anfrage** → Validierung → Queue-Eintrag
3. **Admin Review** → AD-Prüfung → Entscheidung
4. **Passwort-Freigabe** → Verschlüsselte Speicherung
5. **Audit-Logging** → Alle Schritte protokolliert

## Voraussetzungen

### Systemanforderungen

| Komponente | Mindestanforderung | Empfohlen |
|------------|-------------------|------------|
| **Node.js** | 18.x LTS | 20.x LTS |
| **RAM** | 2 GB | 4 GB |
| **Speicher** | 1 GB | 2 GB |
| **Betriebssystem** | Windows Server 2019+ | Windows Server 2022+ |

### Active Directory Anforderungen

| Anforderung | Beschreibung |
|-------------|-------------|
| **LAPS konfiguriert** | Microsoft LAPS auf Clients installiert |
| **Service-Account** | Account mit LAPS-Leserechten |
| **Admin-Gruppe** | AD-Gruppe für Admin-Rolle |
| **LDAP-Zugriff** | Port 389/636 von Server erreichbar |
| **Computer-Objekte** | LAPS-Attribute vorhanden |

## Installation

### 1. Repository klonen

```bash
# Repository klonen
git clone <repository-url>
cd LAPS

# Backend-Abhängigkeiten
npm install

# Frontend-Abhängigkeiten
cd frontend
npm install
cd ..
```

### 3. Entwicklungsumgebung einrichten

```bash
# Umgebungsvariablen kopieren
cd backend
cp .env.example .env

# .env Datei anpassen (siehe Konfiguration)
nano .env
```

### 4. Entwicklungsserver starten

```bash
# Aus dem Hauptverzeichnis
npm run dev
```

**Zugriff:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Konfiguration

### Umgebungsvariablen (backend/.env)

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `AD_URL` | LDAP-URL des Domain Controllers | `ldap://dc01.domain.local` |
| `AD_BASE_DN` | Base DN der Domain | `DC=domain,DC=local` |
| `AD_USERNAME` | Service-Account für LAPS-Zugriff | - |
| `AD_PASSWORD` | Passwort des Service-Accounts | - |
| `AD_ADMIN_GROUP` | AD-Gruppe für Admin-Rolle | `GG_LAPS_Request_Admins` |
| `PASSWORD_DISPLAY_MINUTES` | Anzeigedauer des Passworts | `10` |
| `RATE_LIMIT_MAX_REQUESTS` | Max. Anfragen pro Stunde | `10` |

### AD Service-Account Berechtigungen

Der Service-Account benötigt:
- Leserechte auf Computer-Objekte
- Leserechte auf LAPS-Attribute (`ms-Mcs-AdmPwd`, `ms-Mcs-AdmPwdExpirationTime`)

```powershell
# Beispiel: LAPS-Leserechte delegieren
Set-AdmPwdReadPasswordPermission -OrgUnit "OU=Workstations,DC=domain,DC=local" -AllowedPrincipals "svc_laps_reader"
```

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/auth/me` - Aktueller Benutzer
- `POST /api/auth/logout` - Abmeldung

### Passwort-Anfragen
- `POST /api/requests` - Neue Anfrage erstellen
- `GET /api/requests/my` - Eigene Anfragen
- `GET /api/requests/:id/password` - Passwort abrufen (nur bei genehmigt)
- `GET /api/requests/queue` - Admin: Offene Anfragen
- `POST /api/requests/:id/review` - Admin: Genehmigen/Ablehnen

### Audit
- `GET /api/audit` - Audit-Logs mit Filtern
- `GET /api/audit/export` - CSV-Export

## Sicherheitshinweise

Wichtige Sicherheitsempfehlungen für den produktiven Einsatz:

1. **Produktionsumgebung**: Ändern Sie alle Secrets in der `.env` Datei - verwenden Sie niemals die Standardwerte!
2. **HTTPS**: Verwenden Sie immer HTTPS in der Produktion. Ein Reverse Proxy wie Nginx oder IIS wird empfohlen.
3. **Reverse Proxy**: Für Windows Auth/SSO Integration ist ein Reverse Proxy die beste Lösung.
4. **Backup**: Erstellen Sie regelmäßige Backups der SQLite-Datenbank - am besten automatisiert.
5. **Monitoring**: Überwachen Sie die Audit-Logs auf verdächtige Aktivitäten.
6. **Network Security**: Beschränken Sie den Netzwerkzugriff auf vertrauenswürdige IPs.

### Produktionstipps

- Setzen Sie starke JWT-Secrets (mindestens 32 Zeichen)
- Konfigurieren Sie Rate Limiting entsprechend Ihrem Benutzerprofil
- Aktivieren Sie die AD-Validierung für alle Computer-Anfragen
- Dokumentieren Sie Ihre Berechtigungsstruktur

## Datenbank-Schema

```sql
-- Passwort-Anfragen
password_requests (
  id, requester_id, requester_name, hostname,
  justification, status, created_at, reviewed_by,
  reviewer_comment, computer_found, laps_available
)

-- Audit-Logs
audit_logs (
  id, timestamp, event_type, user_id, user_name,
  hostname, request_id, details, client_ip, success
)

-- Verschlüsselte Passwörter (temporär)
encrypted_passwords (
  request_id, encrypted_password, iv,
  created_at, expires_at
)
```

## Lizenz

Intern / Proprietär

Dieses Projekt ist für die interne Nutzung im Unternehmen bestimmt und unterliegt den internen Lizenzbedingungen.

## Support

Bei Fragen oder Problemen wenden Sie sich bitte an das IT-Team:

- **Technische Probleme**: Systemadministratoren
- **AD-Integration**: Identity Management Team
- **Berechtigungsfragen**: Security Team

**Kontaktinformationen:**
- Internes Ticket-System: [Link zum Ticket-System]
- E-Mail: it-support@unternehmen.de
- Notfall-Hotline: [Telefonnummer]
