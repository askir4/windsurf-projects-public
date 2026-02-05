# Windsurf-Projects

A collection of software projects for various application areas.
## Disclaimer

This project was created for school. It's about learning technology. However, since we are not developers, we relied on AI for this project. The code here should only be used if it has been reviewed and understood beforehand.

## Project Overview

This repository contains three main projects and additional side-projects:

### 1. Greenhouse

**Smart Greenhouse Management with Precision Fertilization**

- **Technology**: Node.js 14+, Vanilla JavaScript, HTML5, CSS3
- **Version**: 3.0.0
- **Purpose**: Web application for controlling greenhouse systems
- **Main Features**:
  - Interactive raised bed management
  - Sensor integration (temperature, humidity, etc.)
  - Alarm system with email notification
  - Community forum
  - Admin panel with user management
  - Node-RED integration via WebSocket
- **Installation**: `npm install` and `npm start`
- **Development**: `npm run dev` (with auto-reload)
- **Access**: http://localhost:3001
- **Documentation**: See `Gewaechshaus/README.md` for details

### 2. LAPS

**Secure Password Request System for Microsoft LAPS + Active Directory**

- **Technology**: Node.js 18+, TypeScript, React, SQLite
- **Version**: 1.0.0
- **Purpose**: Secure management of local administrator passwords
- **Main Features**:
  - Password requests with approval workflow
  - Active Directory integration
  - Complete audit trail
  - JWT-based authentication
  - Frontend with React + TypeScript
- **Installation**: `npm install` and `npm run dev`
- **Access**: Backend: http://localhost:3001, Frontend: http://localhost:5173
- **Documentation**: See `LAPS/README.md` for details

### 3. Recipes

**Self-hosted Recipe Management for Raspberry Pi**

- **Technology**: Node.js 16+, Express, SQLite3, React
- **Version**: 1.0.0
- **Purpose**: Recipe management website for home use
- **Main Features**:
  - CRUD operations for recipes
  - Image upload with optimization
  - Responsive design with Tailwind CSS
  - Search and filter functions
  - Raspberry Pi optimized
- **Installation**: `npm install`, Frontend build with `cd client && npm run build`, then `npm start`
- **Access**: http://localhost:3001
- **Documentation**: See `Rezepte/README.md` and `Rezepte/README_PI_SETUP.md` for details

### 4. Side-Projects

Additional experimental and learning projects:

#### RFID-Lock

- **Technology**: Arduino, MFRC522 RFID Module
- **Purpose**: RFID-based lock system for educational purposes
- **Status**: Educational/Prototype
- **Documentation**: See `side-quests/RFID-Lock/README.md`

#### Temperature-Warning-ESP

- **Technology**: ESP32 (planned)
- **Purpose**: Temperature monitoring with warning function
- **Status**: In planning

## System Requirements

### General Requirements
- **Node.js**: 18+ LTS (recommended for all JavaScript/TypeScript projects)
- **RAM**: Minimum 2 GB
- **Storage**: Minimum 1 GB free disk space

### Project-specific Requirements

#### Greenhouse
```bash
# Minimal dependencies
npm install  # Only nodemailer
```

#### LAPS
```bash
# Backend + Frontend
npm install
cd backend && npm install
cd frontend && npm install
```

#### Recipes
```bash
# Backend + Frontend
npm install
cd client && npm install
```

## Quick Start

### Select and start project

```bash
# Change to desired project directory
cd [project-name]

# Install dependencies (if not already done)
npm install  # or pip install -r requirements.txt

# Start project
npm start     # or python main.py
```

### Standard Ports

| Project | Port | Access |
|---------|------|---------|
| Greenhouse | 3001 | http://localhost:3001 |
| LAPS Backend | 3001 | http://localhost:3001 |
| LAPS Frontend | 5173 | http://localhost:5173 |
| Recipes | 3001 | http://localhost:3001 |

## Development Workflows

### Development with Auto-Reload

```bash
# Greenhouse
npm run dev

# LAPS
npm run dev

# Recipes
npm run dev  # if nodemon configured
```

### Production

```bash
# Greenhouse (as daemon)
npm run start:daemon

# LAPS
npm run build
npm start

# Recipes
cd client && npm run build
cd .. && npm start
```

## Architecture Overview

### Greenhouse Project
```text
Gewaechshaus/
├── server-simple.js       # Main server (v3.0.0)
├── index.html             # Web interface
├── styles.css              # Styling
├── script.js               # Frontend logic
├── auth.js                 # Authentication
├── color-manager.js        # Color scheme management
├── log-utils.js            # Logging utilities
├── data.json               # Data storage
├── start.sh                # Daemon start script
└── assets/                 # Images and icons
```

### LAPS Project
```text
LAPS/
├── package.json            # Workspace configuration (v1.0.0)
├── backend/                 # Node.js Backend
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   └── database.sqlite
└── frontend/                # React Frontend
    ├── package.json
    ├── src/
    ├── tsconfig.json
    └── build/
```

### Recipes Project
```text
Rezepte/
├── package.json            # Backend configuration (v1.0.0)
├── server.js               # Express server
├── database.js             # SQLite database
├── recipes.db              # Recipe data
├── client/                 # React Frontend
│   ├── package.json
│   ├── src/
│   └── build/
├── uploads/                # Image uploads
└── README_PI_SETUP.md      # Raspberry Pi Setup Guide
```

### Side-Projects

#### RFID-Lock Project
```text
side-quests/RFID-Lock/
├── README.md               # Project documentation
├── read-rfid.ino           # Main program
├── rfid-lock.ino           # Extension (Placeholder)
```

#### Temperature-Warning-ESP Project
```text
side-quests/Temperatur-Warnung-ESP/
├── (in planning)
```

## Databases

| Project | Database | Storage Location |
|---------|-----------|-----------------|
| LAPS | SQLite | `backend/database.sqlite` |
| Recipes | SQLite | `recipes.db` |
| Greenhouse | JSON | `data.json` |

## Security Notes

### Production Use
1. **Change default passwords**: All projects use demo passwords
2. **Use HTTPS**: Especially for LAPS and Greenhouse
3. **Configure firewall**: Only open ports when necessary
4. **Regular backups**: Secure databases and configurations
5. **Updates**: Keep dependencies up to date

### Active Directory Integration (LAPS)
- Create service account with minimal rights
- Secure LDAP connections via TLS
- Choose strong JWT secrets

## Troubleshooting

### Common Problems

#### Port already in use

```bash
# Find process
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

#### Permission issues (Raspberry Pi)

```bash
# Correct ownership
sudo chown -R $USER:$USER /path/to/project

# Ensure write permissions
chmod -R 755 /path/to/project
```

#### Node.js Dependencies

```bash
# Reinstall if problems occur
rm -rf node_modules package-lock.json
npm install
```

## License

The projects are subject to different licenses:

- **Greenhouse**: MIT License
- **LAPS**: Internal / Proprietary
- **Recipes**: MIT License

## Support

For questions about specific projects:

- **Greenhouse**: Node.js documentation and Raspberry Pi Guides
- **LAPS**: Active Directory and LDAP documentation
- **Recipes**: React and SQLite documentation

---

Created in February 2026 | Diverse Technology Stacks
