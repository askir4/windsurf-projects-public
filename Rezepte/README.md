# Recipe Website

**Self-hosted Recipe Management for Raspberry Pi**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

A lightweight, self-hosted recipe management website specifically developed for operation on Raspberry Pi 4. With SQLite database and modern web interface for optimal household organization.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Raspberry Pi Setup](#raspberry-pi-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Recipe Website is a complete solution for managing your cooking recipes. The system is optimized for home use and runs reliably on a Raspberry Pi 4, so you can access your recipe collection anytime on your local network.

### Use Cases

- **Household Organization**: All family recipes in one place
- **Meal Planning**: Plan and organize recipes for the week
- **Cookbook Replacement**: Digital alternative to physical cookbooks
- **Community Cooking**: Share recipes with family and friends
- **Mobile Use**: Recipes directly in the kitchen on smartphone/tablet

## Features

### Recipe Management

| Feature | Description |
|---------|-------------|
| **CRUD Operations** | Create, edit, delete recipes |
| **Image Upload** | Add photos to recipes |
| **Categories** | Organize recipes (breakfast, lunch, dinner, dessert) |
| **Search & Filter** | Find recipes by name, ingredients or category |
| **Ingredient List** | Detailed ingredients with quantities |
| **Cooking Instructions** | Step-by-step instructions |

### User Interface

| Feature | Description |
|---------|-------------|
| **Responsive Design** | Works on desktop, tablet and mobile |
| **Modern UI** | Clean, intuitive design with Tailwind CSS |
| **Fast Loading** | Optimized for Raspberry Pi hardware |
| **Offline Capable** | Basic functions work without internet |
| **Print View** | Recipes printable for kitchen use |

### Data Management

| Feature | Description |
|---------|-------------|
| **SQLite Database** | Lightweight, serverless database |
| **Automatic Backups** | Easy data backup |
| **Data Export** | Export recipes as CSV or JSON |
| **Image Optimization** | Automatic image compression |
| **Data Integrity** | Validation and error handling |

## Technology Stack

| Component | Technology | Version | Purpose |
|------------|-------------|---------|-------|
| **Backend** | Node.js | 18+ | JavaScript Runtime |
| **Backend** | Express.js | 4+ | Web Framework |
| **Database** | SQLite3 | 3+ | Data Storage |
| **Frontend** | React | 18+ | User Interface |
| **Frontend** | Tailwind CSS | 3+ | Styling Framework |
| **Icons** | Lucide React | Latest | Icon Library |
| **File Upload** | Multer | 1+ | Image Upload |
| **Image Processing** | Sharp | Latest | Image Optimization |

### Architecture

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│  SQLite DB      │
│   React App     │     │   Express API   │     │   recipes.db    │
│   TailwindCSS   │     │   File Upload   │     │                 │
│   Responsive    │     │   Image Processing│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Installation

### System Requirements

| Component | Minimum Requirement | Recommended |
|------------|-------------------|------------|
| **Node.js** | 18.x LTS | 20.x LTS |
| **RAM** | 1 GB | 2 GB |
| **Storage** | 512 MB | 1 GB |
| **Operating System** | Linux/macOS/Windows | Raspberry Pi OS |

### Quick Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd Rezepte

# 2. Install dependencies
npm install

# 3. Build frontend
cd client
npm install
npm run build
cd ..

# 4. Start server
npm start
```

**Access:** http://localhost:3001

## Raspberry Pi Setup

### Detailed Installation on Raspberry Pi 4

For those who want to run the Recipe Website on a Raspberry Pi 4, I have created a detailed guide. This is particularly useful for home use or small kitchen setups.

**Note:** The complete setup guide can be found in the file `README_PI_SETUP.md` in the same directory. There you will also find detailed instructions for PM2, monitoring and troubleshooting specifically for the Raspberry Pi.

### Why Raspberry Pi?

The Raspberry Pi 4 is ideal for this project because:
- **Cost-effective**: Low acquisition and operating costs
- **Energy efficient**: Consumes only a few watts
- **Compact**: Fits perfectly in the kitchen
- **24/7 operation**: Runs reliably around the clock
- **Network capable**: All devices in the home network can access it

### Quick Guide for Pi Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Copy and install project
mkdir -p ~/recipe-website
cp -r /path/to/project/* ~/recipe-website/
cd ~/recipe-website
npm install

# 4. Build frontend
cd client
npm install
npm run build
cd ..

# 5. Start server
npm start
```

### Pi Optimizations

For best performance on the Raspberry Pi:

```bash
# Increase swap memory (important for 1GB models)
sudo dphys-swapfile swapoff
sudo dphys-swapfile --size 2048
sudo dphys-swapfile swapon

# Reduce GPU memory
sudo raspi-config
# Advanced Options → Memory Split → 16
```

## Configuration

### Customization Options

The Recipe Website is flexibly configurable. Here are the most important customizations:

#### Change Port

By default, the application runs on port 3001. You can change this in two ways:

**Method 1: Environment Variable**
```bash
PORT=8080 npm start
```

**Method 2: Modify server.js**
```javascript
// In server.js change the port line
const PORT = process.env.PORT || 8080;
```

#### Database Management

The SQLite database (`recipes.db`) is automatically created in the project directory. For backups:

```bash
# Create backup
cp recipes.db recipes_backup_$(date +%Y%m%d).db

# Restore backup
cp recipes_backup_20231201.db recipes.db
```

#### Image Upload Settings

By default, images are limited to 5MB. You can adjust this in `server.js`:

```javascript
// Adjust Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB instead of 5MB
  }
});
```

## API Documentation

### REST API Endpoints

The Recipe Website offers a complete REST API for integration with other applications:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/api/recipes` | Get all recipes | `?search=`, `?category=` |
| GET | `/api/recipes/:id` | Get single recipe | `id` (Path) |
| POST | `/api/recipes` | Create new recipe | Multipart Form |
| PUT | `/api/recipes/:id` | Update recipe | Multipart Form |
| DELETE | `/api/recipes/:id` | Delete recipe | `id` (Path) |
| GET | `/api/categories` | Get all categories | - |

### API Call Examples

**Search recipe:**
```bash
curl "http://localhost:3001/api/recipes?search=pasta"
```

**Filter by category:**
```bash
curl "http://localhost:3001/api/recipes?category=dessert"
```

**Create new recipe:**
```bash
curl -X POST -F "title=Apple Cake" \
  -F "ingredients=3 apples,200g flour" \
  -F "instructions=Peel apples..." \
  -F "category=dessert" \
  -F "image=@apple_cake.jpg" \
  http://localhost:3001/api/recipes
```

## Troubleshooting

### Common Problems and Solutions

Here are the most common problems I encountered during development and how to fix them:

#### Permission Issues

If you receive errors like "Permission denied", usually after copying project files:

```bash
# Correct ownership
sudo chown -R $USER:$USER ~/recipe-website

# Ensure write permissions
chmod -R 755 ~/recipe-website
```

#### Port Already in Use

If port 3001 is already used by another application:

```bash
# Find process using the port
sudo lsof -i :3001

# Kill process (PID from previous command)
sudo kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

#### Database Locked

If you receive errors like "database is locked":

```bash
# Find all Node processes
ps aux | grep node

# Kill processes
sudo pkill -f node

# Wait a few seconds and restart
npm start
```

#### Frontend Not Loading

If the website loads but doesn't display recipes:

```bash
# Rebuild frontend
cd client
npm run build
cd ..

# Restart server
npm start
```

#### Images Not Uploading

If image uploads don't work:

```bash
# Check upload directory
ls -la uploads/
# If not present:
mkdir -p uploads
chmod 755 uploads/
```

## License

MIT License - Feel free to modify and use for personal projects!

I developed this project to simplify recipe management at home. You are free to use, adapt, and deploy it for your own purposes.

### What I'd Appreciate
- **Attribution**: A brief mention of the original project would be nice
- **Improvements**: If you make useful improvements, please let me know
- **Feedback**: I always appreciate feedback and suggestions

### No Guarantee
This is a hobby project. I strive for quality but cannot guarantee error-free functionality.
