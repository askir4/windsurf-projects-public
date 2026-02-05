<div align="center">

## Disclaimer
This project was created for school. It's about learning technology. However, since we are not developers, we relied on AI for this project. The code here should only be used if it has been reviewed and understood beforehand. 
---
# Node-RED Integration

**Real-time Sensor Data via WebSocket**

[![Node-RED](https://img.shields.io/badge/Node--RED-8F0000?style=for-the-badge&logo=node-red&logoColor=white)]()
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)]()

</div>

---

## Table of Contents

- [Overview](#overview)
- [WebSocket Connection](#websocket-connection)
- [Sensor Topics](#sensor-topics)
- [Payload Formats](#payload-formats)
- [Actuator Control](#actuator-control)
- [Alarms & E-Mail](#alarms--e-mail)
- [Node-RED Setup](#node-red-setup)

---

## Overview

The greenhouse webapp communicates via **WebSocket** with Node-RED to:

- Receive sensor data in real-time
- Display graphs with historical data
- Trigger alarms for threshold violations
- Control actuators (valves, pumps)

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Node-RED  │ ◄────────────► │   Webapp    │
│   :1880     │                 │   :3001     │
└─────────────┘                 └─────────────┘
      │                               │
      │  Sensors                     │  Browser
      ▼                               ▼
  DHT22, Soil Moisture,      Live Dashboard
  Water Level, etc.            & Control
```

---

## WebSocket Connection

### Configuration in Admin Panel

The WebSocket URL is configured in the **Admin Panel** under **Settings → Node-RED**.

| Setting | Value | Description |
|---------|-------|-------------|
| **URL** | `ws://hostname:1880/ws` | WebSocket endpoint |
| **Enabled** | `true/false` | Connection on/off |

### Default URL

```
ws://localhost:1880/ws
```

> Tip: For Raspberry Pi: Use `ws://raspberrypi:1880/ws` or IP address.

### Message Format

All messages follow the MQTT-like format:

```json
{
  "topic": "sensors/temperature",
  "payload": 22.5
}
```

---

## Sensor-Topics

### Übersicht

| Topic | Einheit | Beschreibung |
|-------|---------|--------------|
| `sensors/temperature` | °C | Lufttemperatur |
| `sensors/humidity` | % | Luftfeuchtigkeit |
| `sensors/soil_moisture` | % | Bodenfeuchtigkeit |
| `sensors/water_tank` | Objekt | Wassertank-Status |
| `sensors/water_level` | Liter | Wasserstand |
| `sensors/water_temperature` | °C | Wassertemperatur |

### Detaillierte Beschreibung

### Temperatur

Lufttemperatur im Gewächshaus.

| Feld | Typ | Beispiel |
|------|-----|----------|
| `payload` | Number oder Object | `22.5` oder `{ "value": 22.5 }` |

```json
{ "topic": "sensors/temperature", "payload": 22.5 }
```

---

### Luftfeuchtigkeit

Relative Luftfeuchtigkeit.

| Feld | Typ | Beispiel |
|------|-----|----------|
| `payload` | Number oder Object | `65` oder `{ "value": 65 }` |

```json
{ "topic": "sensors/humidity", "payload": 65 }
```

---

### Bodenfeuchtigkeit

Bodenfeuchtigkeit (0% = trocken, 100% = nass).

| Feld | Typ | Beispiel |
|------|-----|----------|
| `payload` | Number oder Object | `42` oder `{ "value": 42 }` |

```json
{ "topic": "sensors/soil_moisture", "payload": 42 }
```

---

### Wassertank

Kompletter Wassertank-Status.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `level` | Number | Aktueller Füllstand (Liter) |
| `temperature` | Number | Wassertemperatur (°C) |
| `capacity` | Number | Maximale Kapazität (Liter) |

```json
{
  "topic": "sensors/water_tank",
  "payload": {
    "level": 720,
    "temperature": 18.3,
    "capacity": 1000
  }
}
```

---

### Wasserstand

Nur der Wasserstand (alternative zu water_tank).

```json
{ "topic": "sensors/water_level", "payload": 720 }
```

---

### Wassertemperatur

Nur die Wassertemperatur.

```json
{ "topic": "sensors/water_temperature", "payload": 18.3 }
```

---

## Payload-Formate

Die Webapp akzeptiert verschiedene Payload-Formate:

### Format 1: Einfacher Wert

```json
{ "topic": "sensors/temperature", "payload": 22.5 }
```

### Format 2: Objekt mit `value`

```json
{ "topic": "sensors/temperature", "payload": { "value": 22.5 } }
```

### Format 3: Komplexes Objekt

```json
{
  "topic": "sensors/water_tank",
  "payload": {
    "level": 720,
    "temperature": 18.3,
    "capacity": 1000,
    "timestamp": "2026-01-19T14:30:00Z"
  }
}
```

> Tipp: Die Webapp erkennt automatisch das Format und extrahiert den Wert.

---

## Aktor-Steuerung

Wenn in der Webapp **Dünger angewendet** wird, sendet sie Befehle an Node-RED.

### Topics

| Topic | Beschreibung |
|-------|--------------|
| `actuators/valve` | Ventil öffnen/schließen |
| `actuators/pump` | Pumpe starten/stoppen |

### Payload-Format

```json
{
  "beds": [
    {
      "id": 1,
      "name": "Hochbeet 1",
      "fertilizer": {
        "nitrogen": 5,
        "phosphorus": 2,
        "potassium": 3
      }
    },
    {
      "id": 3,
      "name": "Hochbeet 3",
      "fertilizer": {
        "nitrogen": 5,
        "phosphorus": 2,
        "potassium": 3
      }
    }
  ],
  "totalBeds": 2,
  "fertilizer": {
    "nitrogen": 5,
    "phosphorus": 2,
    "potassium": 3
  },
  "timestamp": "2026-01-19T14:30:00.000Z"
}
```

### Felder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `beds` | Array | Ausgewählte Hochbeete |
| `beds[].id` | Number | ID des Hochbeets |
| `beds[].name` | String | Name des Hochbeets |
| `beds[].fertilizer` | Object | NPK-Werte |
| `totalBeds` | Number | Anzahl der Hochbeete |
| `fertilizer` | Object | Gesamt-NPK-Werte |
| `timestamp` | String | ISO 8601 Zeitstempel |

---

## Alarme & E-Mail

### Schwellwerte konfigurieren

Im **Admin Panel** unter **Einstellungen → Sensor Alarme**:

| Sensor | Min | Max |
|--------|-----|-----|
| Temperatur | 5°C | 35°C |
| Luftfeuchtigkeit | 30% | 90% |
| Bodenfeuchtigkeit | 20% | 80% |

### Alarm-Logik

```
┌─────────────────────────────────────────────────┐
│         Sensorwert empfangen                    │
└─────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Wert < Min   │──── Ja ────► Alarm (zu niedrig)
              │  oder         │
              │  Wert > Max?  │
              └───────────────┘
                      │
                     Nein
                      │
                      ▼
               ✅ Status OK
```

### E-Mail-Versand

Wenn ein Alarm ausgelöst wird:

1. **Zustandswechsel** erkennen (OK → Alarm)
2. **Template** auswählen
3. **Platzhalter** ersetzen
4. **E-Mail senden** an konfigurierte Empfänger

> Hinweis: E-Mails werden nur beim **Zustandswechsel** gesendet, nicht bei jedem Messwert.

---

## Node-RED Setup

### Voraussetzungen

- Node-RED installiert und läuft auf Port 1880
- `node-red-contrib-websocket` Node (optional, meist integriert)

### Beispiel-Flow: DHT22 Sensor

```json
[
  {
    "id": "dht22-sensor",
    "type": "rpi-dht22",
    "name": "DHT22",
    "topic": "",
    "dht": 22,
    "pintype": 0,
    "pin": 4
  },
  {
    "id": "split-values",
    "type": "function",
    "name": "Split Temperature/Humidity",
    "func": "var temp = { topic: 'sensors/temperature', payload: msg.payload };\nvar hum = { topic: 'sensors/humidity', payload: msg.humidity };\nreturn [temp, hum];",
    "outputs": 2
  },
  {
    "id": "ws-out",
    "type": "websocket out",
    "name": "WebSocket Out",
    "server": "",
    "client": "ws-client"
  }
]
```

### Beispiel-Flow: Bodenfeuchtigkeit

```json
[
  {
    "id": "soil-sensor",
    "type": "rpi-gpio in",
    "name": "Soil Moisture",
    "pin": 17,
    "intype": "up"
  },
  {
    "id": "convert-to-percent",
    "type": "function",
    "name": "Convert to %",
    "func": "msg.payload = Math.round((1 - msg.payload / 1024) * 100);\nmsg.topic = 'sensors/soil_moisture';\nreturn msg;"
  },
  {
    "id": "ws-out",
    "type": "websocket out",
    "name": "WebSocket Out"
  }
]
```

### Beispiel-Flow: Wassertank

```json
[
  {
    "id": "water-level-sensor",
    "type": "ultrasonic",
    "name": "Water Level",
    "pin": 18,
    "interval": 30000
  },
  {
    "id": "calculate-liters",
    "type": "function",
    "name": "Calculate Liters",
    "func": "const tankHeight = 100; // cm\nconst sensorHeight = msg.payload; // cm\nconst waterLevel = tankHeight - sensorHeight;\nconst liters = Math.round(waterLevel * 10); // Annahme: 1cm = 10 Liter\nmsg.payload = {\n  level: liters,\n  temperature: 20, // Optional: Temperatur-Sensor\n  capacity: 1000\n};\nmsg.topic = 'sensors/water_tank';\nreturn msg;"
  },
  {
    "id": "ws-out",
    "type": "websocket out",
    "name": "WebSocket Out"
  }
]
```

### Fehlerbehandlung

#### Verbindungstests

```javascript
// Test-Node für Verbindung
msg.topic = 'test/connection';
msg.payload = {
  timestamp: new Date().toISOString(),
  status: 'connected'
};
return msg;
```

#### Debug-Output

```javascript
// Debug-Function Node
console.log('Received message:', msg);
console.log('Topic:', msg.topic);
console.log('Payload:', msg.payload);
return msg;
```

### Häufige Probleme

| Problem | Ursache | Lösung |
|--------|---------|---------|
| **Keine Verbindung** | WebSocket-Port falsch | Port 1880 und Path `/ws` prüfen |
| **Daten nicht angezeigt** | Falsches Topic | Topic-Format überprüfen |
| **Sensor-Werte unplausibel** | Kalibrierung | Sensor-Kalibrierung anpassen |
| **Verbindung bricht ab** | Network-Timeout | Keep-Alive implementieren |

### Best Practices

1. **Regelmäßige Updates**: Intervall von 30-60 Sekunden für Sensoren
2. **Fehlerbehandlung**: Try-Catch Blocks in Function Nodes
3. **Logging**: Debug-Nodes für Troubleshooting
4. **Sicherheit**: WebSocket-Authentifizierung in Produktion
5. **Performance**: Batch-Updates für mehrere Sensoren

---

## Nützliche Links

| Ressource | Link |
|-----------|------|
| Node-RED Dokumentation | [nodered.org/docs](https://nodered.org/docs/) |
| DHT22 Node | [node-red-contrib-dht-sensor](https://flows.nodered.org/node/node-red-contrib-dht-sensor) |
| GPIO Nodes | [node-red-node-pi-gpio](https://flows.nodered.org/node/node-red-node-pi-gpio) |
| WebSocket Nodes | Integriert in Node-RED |

---

<div align="center">

**[← Zurück zur README](README.md)** · **[Server-Dokumentation →](SERVER.md)**

</div>
