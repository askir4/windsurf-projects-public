# LAPS Portal

**Secure Password Request System for Microsoft LAPS + Active Directory**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Internal-red?style=for-the-badge)]()

A secure web application for requesting and approving local administrator passwords for Windows clients via Microsoft LAPS (Local Administrator Password Solution) in combination with Active Directory.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Overview

The LAPS Portal provides a secure, audited solution for managing local administrator passwords in Windows environments. Users can request passwords for specific computers, while administrators can review and approve these requests.

### Use Cases

- **IT Helpdesk**: Technicians need temporary administrator access
- **Maintenance Work**: Planned system maintenance with elevated rights
- **Emergency Access**: Quick approval for critical system issues
- **Compliance**: Complete logging of all password accesses

## Features

### User Portal

| Feature | Description |
|---------|-------------|
| **Password Requests** | Create with mandatory justification (min. 20 characters) |
| **Hostname Validation** | Verification against Active Directory |
| **Status Tracking** | Open / Approved / Rejected / Expired |
| **Time-limited Display** | Default: 10 minutes visibility |
| **History** | View own past requests |

### Admin-Portal

| Feature | Description |
|---------|-------------|
| **Request Queue** | All open requests clearly displayed |
| **Approval Workflow** | Accept/Reject with comment |
| **Detail Review** | User, hostname, time, justification |
| **AD Validation** | Computer found, LAPS available |
| **Bulk Actions** | Process multiple requests simultaneously |

### Audit & Logging

| Feature | Description |
|---------|-------------|
| **Complete Audit Trail** | All actions logged |
| **Advanced Filters** | By event type, user, hostname, time period |
| **CSV Export** | External analysis and reporting |
| **Integrity Logs** | System events and errors |

### Security

| Feature | Implementation |
|---------|----------------|
| **AD-based Authentication** | Integration with Active Directory |
| **JWT Token Sessions** | Secure session management |
| **Rate Limiting** | Protection against abuse |
| **Encrypted Storage** | Temporary passwords encrypted |
| **Log Security** | No passwords in logs |
| **HTTPS Ready** | SSL/TLS support |

## Architecture

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│ Active Directory│
│   React + TS    │     │  Express + TS   │     │   LDAP/LAPS     │
│   TailwindCSS   │     │    SQLite DB    │     │                 │
│   JWT Auth      │     │   Rate Limiting  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|------------|-------------|---------|-------|
| **Frontend** | React | 18+ | User Interface |
| **Frontend** | TypeScript | 5+ | Type Safety |
| **Frontend** | TailwindCSS | 3+ | Styling |
| **Backend** | Node.js | 18+ | Runtime |
| **Backend** | Express | 4+ | Web Framework |
| **Backend** | TypeScript | 5+ | Type Safety |
| **Database** | SQLite | 3+ | Data Storage |
| **Auth** | JWT | - | Session Management |
| **LDAP** | ldapjs | 3+ | AD Integration |

### Data Flow

1. **User Login** → AD Authentication → JWT Token
2. **Password Request** → Validation → Queue Entry
3. **Admin Review** → AD Check → Decision
4. **Password Release** → Encrypted Storage
5. **Audit Logging** → All steps logged

## Prerequisites

### System Requirements

| Component | Minimum Requirement | Recommended |
|------------|-------------------|------------|
| **Node.js** | 18.x LTS | 20.x LTS |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 1 GB | 2 GB |
| **Operating System** | Windows Server 2019+ | Windows Server 2022+ |

### Active Directory Requirements

| Requirement | Description |
|-------------|-------------|
| **LAPS configured** | Microsoft LAPS installed on clients |
| **Service Account** | Account with LAPS read rights |
| **Admin Group** | AD group for admin role |
| **LDAP Access** | Port 389/636 reachable from server |
| **Computer Objects** | LAPS attributes present |

## Installation

### 1. Clone Repository

```bash
# Clone repository
git clone <repository-url>
cd LAPS

# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Development Environment

```bash
# Copy environment variables
cd backend
cp .env.example .env

# Adjust .env file (see configuration)
nano .env
```

### 4. Start Development Server

```bash
# From main directory
npm run dev
```

**Access:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Configuration

### Environment Variables (backend/.env)

| Variable | Description | Default |
|----------|-------------|----------|
| `AD_URL` | LDAP URL of Domain Controller | `ldap://dc01.domain.local` |
| `AD_BASE_DN` | Base DN of Domain | `DC=domain,DC=local` |
| `AD_USERNAME` | Service account for LAPS access | - |
| `AD_PASSWORD` | Password of service account | - |
| `AD_ADMIN_GROUP` | AD group for admin role | `GG_LAPS_Request_Admins` |
| `PASSWORD_DISPLAY_MINUTES` | Password display duration | `10` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per hour | `10` |

### AD Service-Account Permissions

The service account needs:
- Read rights on computer objects
- Read rights on LAPS attributes (`ms-Mcs-AdmPwd`, `ms-Mcs-AdmPwdExpirationTime`)

```powershell
# Example: Delegate LAPS read rights
Set-AdmPwdReadPasswordPermission -OrgUnit "OU=Workstations,DC=domain,DC=local" -AllowedPrincipals "svc_laps_reader"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout

### Password Requests
- `POST /api/requests` - Create new request
- `GET /api/requests/my` - Own requests
- `GET /api/requests/:id/password` - Get password (only if approved)
- `GET /api/requests/queue` - Admin: Open requests
- `POST /api/requests/:id/review` - Admin: Approve/Reject

### Audit
- `GET /api/audit` - Audit logs with filters
- `GET /api/audit/export` - CSV export

## Security Notes

Important security recommendations for production use:

1. **Production Environment**: Change all secrets in the `.env` file - never use default values!
2. **HTTPS**: Always use HTTPS in production. A reverse proxy like Nginx or IIS is recommended.
3. **Reverse Proxy**: For Windows Auth/SSO integration, a reverse proxy is the best solution.
4. **Backup**: Create regular backups of the SQLite database - preferably automated.
5. **Monitoring**: Monitor audit logs for suspicious activity.
6. **Network Security**: Limit network access to trusted IPs.

### Production Tips

- Set strong JWT secrets (minimum 32 characters)
- Configure rate limiting according to your user profile
- Enable AD validation for all computer requests
- Document your permission structure

## Database Schema

```sql
-- Password Requests
password_requests (
  id, requester_id, requester_name, hostname,
  justification, status, created_at, reviewed_by,
  reviewer_comment, computer_found, laps_available
)

-- Audit Logs
audit_logs (
  id, timestamp, event_type, user_id, user_name,
  hostname, request_id, details, client_ip, success
)

-- Encrypted Passwords (temporary)
encrypted_passwords (
  request_id, encrypted_password, iv,
  created_at, expires_at
)
```

## License

Internal / Proprietary

This project is intended for internal company use and is subject to internal license conditions.

## Support

For questions or problems, please contact the IT team:

- **Technical Problems**: System administrators
- **AD Integration**: Identity Management Team
- **Permission Questions**: Security Team

**Contact Information:**
- Internal Ticket System: [Link to Ticket System]
- Email: it-support@company.de
- Emergency Hotline: [Phone Number]
