<div align="center">

# Greenhouse Webapp

**Smart Greenhouse Management with Precision Fertilization**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()

*Learning Field 7 - Precision Fertilization with Individual Control*

<img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/leaflet.svg" width="120" alt="Logo">

</div>

---
## Disclaimer
This project was created for school. It's about learning technology. However, since we are not developers, we relied on AI for this project. The code here should only be used if it has been reviewed and understood beforehand. 
---
## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [License](#license)

---

## Project Overview

The Greenhouse Webapp is a comprehensive solution for intelligent management of greenhouse systems with precision fertilization. The system enables monitoring and control of raised beds, integration of sensor data, and automatic alarm notifications for critical values.

### Core Features

- **Raised Bed Management**: Interactive map with drag & drop editor
- **Plant Management**: Detailed plant profiles with fertilization plans
- **Sensor Integration**: Real-time data from temperature, humidity, soil moisture, and water tank
- **Alarm System**: Automatic email notification for threshold violations
- **Community Forum**: Exchange platform for users with tags and search
- **RFID Door Access**: Secure door control with ESP32 and RFID cards, learning mode, offline support
- **Admin Panel**: Comprehensive management interface for users, settings, and logs

## Features

### Raised Beds & Plant Management

| Feature | Description |
|---------|-------------|
| **Interactive Map** | Drag & Drop editor with zoom and pan |
| **Plant Picker** | Icon selection with search function |
| **Todo System** | Manage tasks per plant |
| **Multi-selection** | `Shift + Click` for group fertilization |
| **Responsive Design** | Optimized for desktop and mobile |

### Community Forum

| Feature | Description |
|---------|-------------|
| **Tags & Filters** | Categorize and filter posts |
| **Full-text Search** | Search by user or content |
| **Highlighting** | Matches are highlighted |
| **Comments** | Collapsible discussions |

### RFID Door Access

Secure access control for greenhouse doors with ESP32 and RFID cards.

| Feature | Description |
|---------|-------------|
| **Device Management** | Register and manage ESP32 door controllers |
| **Card Management** | Add, edit, and assign RFID cards to devices |
| **Learning Mode** | Automatic card registration via physical scan |
| **Offline Support** | Local card storage on ESP32 for offline access |
| **Access Logs** | Complete audit trail of all access attempts |
| **Simulation** | Test access without hardware via web interface |

### Sensors & Monitoring

| Sensor | Description |
|--------|-------------|
| Temperature | Real-time measurement with trend display |
| Humidity | Percentage display |
| Soil Moisture | Moisture level per zone |
| Water Tank | Fill level and temperature |

### Graphs & Trends

- **Time periods:** 1h, 6h, 24h, 7d, 30d
- **Live updates** via WebSocket
- **Trend arrows** for quick overview

### Alarm System & E-Mail

| Feature | Description |
|---------|-------------|
| **Thresholds** | Min/Max configurable per sensor |
| **SMTP Integration** | Own mail server or provider |
| **Templates** | Customizable email templates |
| **Placeholders** | `{sensor_name}`, `{value}`, `{timestamp}` |
| **Delivery Log** | All emails traceable |

---

## System Requirements

### Minimal Requirements
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (installed with Node.js)
- **RAM**: Minimum 512 MB
- **Storage**: 100 MB free disk space

### Recommended Configuration
- **Node.js** 20 LTS or newer
- **RAM**: 1 GB or more
- **Storage**: 1 GB free disk space for logs and data

### Supported Platforms
- **Linux**: Ubuntu 20.04+, Debian 11+, Raspberry Pi OS
- **Windows**: Windows 10+ (WSL recommended)
- **macOS**: macOS 11+ (Intel/Apple Silicon)

## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (installed with Node.js)

### Installation

```bash
# Clone repository
git clone https://github.com/yourname/gewachshaus.git
cd gewachshaus

# Install dependencies
npm install

# Adjust configuration (optional)
cp .env.example .env
nano .env

# Start server
npm start
```

### Access

| URL | Description |
|-----|-------------|
| `http://localhost:3001` | Web interface |
| `http://localhost:3001/api/health` | Health check |

### Default Login

| Field | Value |
|------|------|
| **User** | `admin` |
| **Password** | `admin123` |

> Important: Change password after first login!

### Development

Additional commands are available for developers:

```bash
npm run dev           # Development mode with auto-reload
npm run start:daemon  # As background process (Raspberry Pi)
npm run start:status  # Check daemon status
npm run start:logs    # Show daemon logs
npm run start:stop    # Stop daemon
npm run test          # Run unit tests
```

### Docker (Optional)

For container-based installation:

```bash
docker build -t gewachshaus .
docker run -p 3001:3001 -v $(pwd)/data.json:/app/data.json gewachshaus
```

---

## Architecture

```text
gewachshaus/
├── server-simple.js   # HTTP server (Node.js)
├── index.html         # Main UI
├── styles.css         # Styling
├── script.js          # Frontend logic
├── auth.js            # Authentication
├── color-manager.js   # Color scheme management
├── log-utils.js       # Logging utilities
├── data.json          # Persistent data
├── assets/            # Icons and images
└── esp32-rfid-door/   # ESP32 firmware for RFID access control
    ├── esp32-rfid-door.ino
    ├── config.h
    └── ...
```

### Technology Stack

| Component | Technology |
|------------|-------------|
| **Backend** | Node.js (HTTP server, no framework) |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Database** | JSON file (atomic writing) |
| **E-Mail** | Nodemailer (SMTP) |
| **Sensors** | Node-RED via WebSocket |

---

## Configuration

### Environment Variables

The application can be configured via environment variables:

| Variable | Default | Description |
|----------|----------|--------------|
| `PORT` | `3001` | Server port |
| `ADMIN_USER` | `admin` | Administrator username |
| `ADMIN_PASS` | `admin123` | Administrator password |
| `SESSION_SECRET` | - | Secret key for sessions |
| `ALLOWED_ORIGINS` | - | Allowed CORS origins (comma-separated) |
| `NODE_ENV` | `development` | Runtime environment |

#### Example: `.env` file

```env
# Server configuration
PORT=3001
NODE_ENV=production

# Admin account
ADMIN_USER=admin
ADMIN_PASS=secure_password_123

# Security
SESSION_SECRET=my_secret_key_xyz

# Optional: CORS
ALLOWED_ORIGINS=http://192.168.1.100:3001,https://my-domain.com
```

### Admin Panel Functions

| Area | Functions |
|---------|-----------|
| Users | Create, edit, delete, reset password |
| Audit Logs | Track all user actions |
| Node-RED | Configure WebSocket connection |
| Alarms | Set sensor thresholds |
| E-Mail | Manage SMTP, templates, recipients |
| Design | Adjust color scheme (live preview) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [SERVER.md](SERVER.md) | Server setup, API endpoints, email configuration |
| [RASPI-SETUP.md](RASPI-SETUP.md) | Raspberry Pi installation & autostart |
| [NodeRed.md](NodeRed.md) | Node-RED integration, topics & payloads |
| [NOTES.md](NOTES.md) | Technical implementation details |
| [AUDIT_REPORT.md](AUDIT_REPORT.md) | Security audit & recommendations |
| [report.md](report.md) | Code review and technical analysis |

---

## Contributing

Contributions are welcome! Please create a fork and submit a pull request.

1. Create a fork
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push branch (`git push origin feature/new-feature`)
5. Create pull request

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Greenhouse Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Made with care for smart gardening**

</div>
