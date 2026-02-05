<div align="center">

# Server Installation and Configuration

**Complete Guide for Backend Setup**

</div>

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation & Start](#installation--start)
- [Data Storage](#data-storage)
- [API Endpoints](#api-endpoints)
- [E-Mail & SMTP](#e-mail--smtp)
- [Security](#security)

---

## Prerequisites

| Component | Version | Description |
|------------|---------|--------------|
| **Node.js** | 18+ | JavaScript Runtime |
| **npm** | 9+ | Package Manager (included with Node.js) |

### Optional Components

| Component | Purpose |
|------------|-------|
| **Node-RED** | Sensor integration via WebSocket |
| **SMTP Server** | Email delivery for alarms |

---

## Installation & Start

### Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start
```

### Start Options

| Command | Description |
|--------|-------------|
| `npm start` | Normal start |
| `npm run dev` | Development mode |
| `npm run start:daemon` | As background process (Raspberry Pi) |
| `npm run start:status` | Check daemon status |
| `npm run start:logs` | Show daemon logs |
| `npm run start:stop` | Stop daemon |

### Access

```text
Web interface:  http://localhost:3001
Health check:   http://localhost:3001/api/health
```

---

## Data Storage

### Overview

The server uses a simple JSON file as database.

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

### Security Features

| Feature | Description |
|---------|-------------|
| **Atomic Writing** | Write to temporary file, then rename |
| **Backup on Errors** | Automatic backup before overwriting |
| **Debounced Saving** | Delayed saving to reduce load |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `POST` | `/api/auth/login` | User login | ❌ |
| `POST` | `/api/auth/logout` | User logout | ✅ |
| `GET` | `/api/auth/me` | Current user | ✅ |
| `POST` | `/api/auth/change-password` | Change password | ✅ |

### Data

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/data` | Get all data | ❌ |
| `POST` | `/api/data` | Save data | ✅ |

### Zones & Plants

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/zones` | All zones | ❌ |
| `POST` | `/api/zones` | Create zone | ✅ |
| `GET` | `/api/plants` | All plants | ❌ |
| `POST` | `/api/plants` | Add plant | ✅ |
| `PUT` | `/api/plants/:id` | Update plant | ✅ |
| `DELETE` | `/api/plants/:id` | Delete plant | ✅ |

### Forum

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/forum/posts` | All posts | ❌ |
| `POST` | `/api/forum/posts` | Create post | ❌* |
| `POST` | `/api/forum/posts/:id/comments` | Add comment | ❌* |

> *Guests can post, but author is shown as "Guest".

### User Management (Admin)

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/users` | All users | 🔐 Admin |
| `POST` | `/api/users` | Create user | 🔐 Admin |
| `PUT` | `/api/users/:id` | Edit user | 🔐 Admin |
| `DELETE` | `/api/users/:id` | Delete user | 🔐 Admin |
| `POST` | `/api/users/:id/reset-password` | Reset password | 🔐 Admin |

### Email Configuration (Admin)

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/email/smtp` | Get SMTP settings |
| `POST` | `/api/email/smtp` | Save SMTP settings |
| `POST` | `/api/email/test` | Send test email |
| `GET` | `/api/email/templates` | All templates |
| `POST` | `/api/email/templates` | Create template |
| `PUT` | `/api/email/templates/:id` | Edit template |
| `DELETE` | `/api/email/templates/:id` | Delete template |
| `GET` | `/api/email/config` | Email configuration |
| `POST` | `/api/email/config` | Save email configuration |
| `GET` | `/api/email/logs` | Delivery log |

### Color Scheme

| Method | Endpoint | Description | Auth |
|---------|----------|--------------|------|
| `GET` | `/api/colors` | Current color scheme | ❌ |
| `POST` | `/api/colors` | Save color scheme | 🔐 Admin |
| `POST` | `/api/colors/reset` | Reset to default | 🔐 Admin |

### System

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/logs` | System logs (Admin) |
| `GET` | `/api/audit-logs` | Audit logs (Admin) |

---

## E-Mail & SMTP

### SMTP Configuration

The SMTP settings are configured in the **Admin Panel** under **E-Mail → SMTP Settings**.

| Field | Description | Example |
|------|-------------|----------|
| **Host** | SMTP server | `smtp.gmail.com` |
| **Port** | SMTP port | `587` (TLS) or `465` (SSL) |
| **User** | Email address | `alarm@example.com` |
| **Password** | App password | `xxxx xxxx xxxx xxxx` |
| **Encryption** | TLS or SSL | TLS (recommended) |
| **Sender** | From address | `Greenhouse <alarm@example.com>` |

### Example Configurations

#### Gmail

```text
Host:     smtp.gmail.com
Port:     587
TLS:      Yes
User:     your-email@gmail.com
Password: App password (16 characters)
```

> Important: Enable 2-factor authentication for Gmail and create an [App Password](https://myaccount.google.com/apppasswords).

#### Own Server

```text
Host:     mail.example.com
Port:     587
TLS:      Yes
User:     alarm@example.com
Password: Your password
```

### Template Placeholders

Email templates support the following placeholders:

| Placeholder | Description | Example |
|-------------|-------------|----------|
| `{sensor_name}` | Sensor name | `Temperature` |
| `{sensor_value}` | Current value | `35.2` |
| `{timestamp}` | Timestamp | `2026-01-19 14:30:00` |
| `{threshold}` | Threshold value | `30` |
| `{alarm_type}` | Alarm type | `Maximum exceeded` |
| `{details}` | Additional details | `Zone: Raised Bed 1` |

### Example Template

```html
<h2>Alarm: {sensor_name}</h2>

<p>The sensor <strong>{sensor_name}</strong> has reached a critical value.</p>

<table>
  <tr><td>Current value:</td><td><strong>{sensor_value}</strong></td></tr>
  <tr><td>Threshold:</td><td>{threshold}</td></tr>
  <tr><td>Time:</td><td>{timestamp}</td></tr>
</table>

<p>{details}</p>
```

---

## Security

### Implemented Measures

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Max. 100 requests/minute per IP |
| **Auth Rate Limiting** | Max. 10 login attempts / 10 min |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, etc. |
| **Body Limit** | Maximum request size: 1 MB |
| **Session Cookies** | HttpOnly, SameSite=Lax, Secure (HTTPS) |
| **Password Hashing** | scrypt with salt |
| **CORS** | Configurable origins |

### Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=15552000 (only with HTTPS)
```

### Production Recommendations

| Priority | Recommendation | Description |
|-----------|------------|-------------|
| **Critical** | Enable HTTPS | Nginx/Caddy as reverse proxy |
| **Critical** | Set SESSION_SECRET | Your own secret key |
| **Critical** | Change admin password | Don't use default password |
| **High** | Configure firewall | Only open ports 80/443 publicly |
| **Medium** | Create backups | Regular backup of `data.json` |
| **Medium** | Monitor logging | Check logs for suspicious activity |

### Performance Optimization

| Measure | Description |
|-----------|-------------|
| **Debounced Saving** | Delayed saving to reduce I/O load |
| **Atomic Writing** | Prevents data corruption on crashes |
| **In-Memory Caching** | Sessions and rate limits in memory |
| **Body Limit** | Maximum request size: 1 MB |

### Monitoring and Logging

#### Log Levels

| Level | Description | Usage |
|-------|-------------|------------|
| **INFO** | General information | Server start, API calls |
| **WARN** | Warnings | Failed login attempts |
| **ERROR** | Errors | Server errors, exceptions |
| **DEBUG** | Debug information | Only in development |

#### Health Check

The health check endpoint (`/api/health`) returns:

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
