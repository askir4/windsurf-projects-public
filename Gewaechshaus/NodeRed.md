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

### Overview

| Topic | Unit | Description |
|-------|---------|--------------|
| `sensors/temperature` | °C | Air temperature |
| `sensors/humidity` | % | Air humidity |
| `sensors/soil_moisture` | % | Soil moisture |
| `sensors/water_tank` | Object | Water tank status |
| `sensors/water_level` | Liters | Water level |
| `sensors/water_temperature` | °C | Water temperature |

### Detailed Description

### Temperature

Air temperature in the greenhouse.

| Field | Type | Example |
|------|-----|----------|
| `payload` | Number or Object | `22.5` or `{ "value": 22.5 }` |

```json
{ "topic": "sensors/temperature", "payload": 22.5 }
```

---

### Humidity

Relative air humidity.

| Field | Type | Example |
|------|-----|----------|
| `payload` | Number or Object | `65` or `{ "value": 65 }` |

```json
{ "topic": "sensors/humidity", "payload": 65 }
```

---

### Soil Moisture

Soil moisture (0% = dry, 100% = wet).

| Field | Type | Example |
|------|-----|----------|
| `payload` | Number or Object | `42` or `{ "value": 42 }` |

```json
{ "topic": "sensors/soil_moisture", "payload": 42 }
```

---

### Water Tank

Complete water tank status.

| Field | Type | Description |
|------|-----|--------------|
| `level` | Number | Current fill level (liters) |
| `temperature` | Number | Water temperature (°C) |
| `capacity` | Number | Maximum capacity (liters) |

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

### Water Level

Water level only (alternative to water_tank).

```json
{ "topic": "sensors/water_level", "payload": 720 }
```

---

### Water Temperature

Water temperature only.

```json
{ "topic": "sensors/water_temperature", "payload": 18.3 }
```

---

## Payload Formats

The webapp accepts various payload formats:

### Format 1: Simple Value

```json
{ "topic": "sensors/temperature", "payload": 22.5 }
```

### Format 2: Object with `value`

```json
{ "topic": "sensors/temperature", "payload": { "value": 22.5 } }
```

### Format 3: Complex Object

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

> Tip: The webapp automatically detects the format and extracts the value.

---

## Actuator Control

When **fertilizer is applied** in the webapp, it sends commands to Node-RED.

### Topics

| Topic | Description |
|-------|--------------|
| `actuators/valve` | Open/close valve |
| `actuators/pump` | Start/stop pump |

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

### Fields

| Field | Type | Description |
|------|-----|--------------|
| `beds` | Array | Selected raised beds |
| `beds[].id` | Number | ID of the raised bed |
| `beds[].name` | String | Name of the raised bed |
| `beds[].fertilizer` | Object | NPK values |
| `totalBeds` | Number | Number of raised beds |
| `fertilizer` | Object | Total NPK values |
| `timestamp` | String | ISO 8601 timestamp |

---

## Alarms & E-Mail

### Configure Thresholds

In the **Admin Panel** under **Settings → Sensor Alarms**:

| Sensor | Min | Max |
|--------|-----|-----|
| Temperature | 5°C | 35°C |
| Humidity | 30% | 90% |
| Soil Moisture | 20% | 80% |

### Alarm Logic

```
┌─────────────────────────────────────────────────┐
│         Sensor value received                    │
└─────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Value < Min   │──── Yes ────► Alarm (too low)
              │  or         │
              │  Value > Max?  │
              └───────────────┘
                      │
                     No
                      │
                      ▼
               ✅ Status OK
```

### Email Delivery

When an alarm is triggered:

1. **State change** detection (OK → Alarm)
2. **Template** selection
3. **Placeholder** replacement
4. **Email send** to configured recipients

> Note: Emails are only sent on **state change**, not for every measurement.

---

## Node-RED Setup

### Prerequisites

- Node-RED installed and running on port 1880
- `node-red-contrib-websocket` node (optional, usually integrated)

### Example Flow: DHT22 Sensor

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

### Example Flow: Soil Moisture

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

### Example Flow: Water Tank

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
    "func": "const tankHeight = 100; // cm\nconst sensorHeight = msg.payload; // cm\nconst waterLevel = tankHeight - sensorHeight;\nconst liters = Math.round(waterLevel * 10); // Assumption: 1cm = 10 Liters\nmsg.payload = {\n  level: liters,\n  temperature: 20, // Optional: Temperature sensor\n  capacity: 1000\n};\nmsg.topic = 'sensors/water_tank';\nreturn msg;"
  },
  {
    "id": "ws-out",
    "type": "websocket out",
    "name": "WebSocket Out"
  }
]
```

### Error Handling

#### Connection Tests

```javascript
// Test Node for connection
msg.topic = 'test/connection';
msg.payload = {
  timestamp: new Date().toISOString(),
  status: 'connected'
};
return msg;
```

#### Debug Output

```javascript
// Debug Function Node
console.log('Received message:', msg);
console.log('Topic:', msg.topic);
console.log('Payload:', msg.payload);
return msg;
```

### Common Problems

| Problem | Cause | Solution |
|--------|---------|---------|
| **No connection** | Wrong WebSocket port | Check port 1880 and path `/ws` |
| **Data not displayed** | Wrong topic | Check topic format |
| **Sensor values implausible** | Calibration | Adjust sensor calibration |
| **Connection drops** | Network timeout | Implement keep-alive |

### Best Practices

1. **Regular Updates**: Interval of 30-60 seconds for sensors
2. **Error Handling**: Try-Catch blocks in Function nodes
3. **Logging**: Debug nodes for troubleshooting
4. **Security**: WebSocket authentication in production
5. **Performance**: Batch updates for multiple sensors

---

## Useful Links

| Resource | Link |
|-----------|------|
| Node-RED Documentation | [nodered.org/docs](https://nodered.org/docs/) |
| DHT22 Node | [node-red-contrib-dht-sensor](https://flows.nodered.org/node/node-red-contrib-dht-sensor) |
| GPIO Nodes | [node-red-node-pi-gpio](https://flows.nodered.org/node/node-red-node-pi-gpio) |
| WebSocket Nodes | Integrated in Node-RED |

---

<div align="center">

**[← Zurück zur README](README.md)** · **[Server-Dokumentation →](SERVER.md)**

</div>
