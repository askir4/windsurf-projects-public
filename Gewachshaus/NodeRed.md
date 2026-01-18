# 🔌 Node-RED Integration

Diese Anleitung beschreibt, wie Sensorwerte korrekt an die Webapp gesendet werden.

## Ziel

Die Webapp liest Sensordaten über einen WebSocket in Node-RED ein:

- WebSocket-URL: `ws://<HOST>:1880/ws`
- Nachrichtenformat: `{"topic":"sensors/temperature","payload":{...}}`

## 1) Node-RED installieren (Raspberry Pi)

```bash
bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
sudo systemctl enable nodered
sudo systemctl start nodered
```

Dann im Browser öffnen:

```
http://<PI-IP>:1880
```

## 2) WebSocket Endpoint anlegen

Erstelle in Node-RED einen **WebSocket out** Node:

- Type: `Listen on`
- Path: `/ws`
- Name: `Gewachshaus WS`

## 3) Topics und Datenformat

### Unterstützte Topics

| Topic | Bedeutung | Erwarteter Wert |
|------|-----------|-----------------|
| `sensors/temperature` | Lufttemperatur | Zahl in °C |
| `sensors/humidity` | Luftfeuchtigkeit | Zahl in % |
| `sensors/soil_moisture` | Bodenfeuchte | Zahl in % |
| `sensors/water_tank` | Wassertank (Level + Temperatur) | Objekt |
| `sensors/water_level` | Wassertank-Fuellstand | Zahl (Liter) |
| `sensors/water_temperature` | Wassertank-Temperatur | Zahl in °C |

### Payload-Varianten

Die Webapp akzeptiert zwei Varianten:

1) **Direkter Zahlenwert**

```json
{
  "topic": "sensors/temperature",
  "payload": 22.5
}
```

2) **Objekt mit `value`**

```json
{
  "topic": "sensors/temperature",
  "payload": { "value": 22.5 }
}
```

### Beispiel fuer Water Tank

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

## 4) Beispiel-Flow (Function + WebSocket)

Minimaler Flow:

1. Sensor-Node (z.B. DHT22)
2. Function-Node (formatiert)
3. WebSocket out (`/ws`)

**Function Node Beispiel:**

```javascript
// msg.payload kommt vom Sensor (z.B. { temp: 22.5, hum: 55 })
return [
  { topic: "sensors/temperature", payload: { value: msg.payload.temp } },
  { topic: "sensors/humidity", payload: { value: msg.payload.hum } }
];
```

## 5) Webapp konfigurieren

In der Webapp:

1. `Admin` > `NodeRED-Verbindung`
2. WebSocket URL setzen (z.B. `ws://192.168.1.100:1880/ws`)
3. `NodeRED aktivieren`
4. `Verbinden`

## 6) Troubleshooting

- **Keine Daten:** WebSocket-URL pruefen, `nodeRed.enabled` aktiv?
- **Keine Werte im UI:** Topics exakt wie oben verwenden.
- **Falsche Einheiten:** Die UI erwartet °C und % als reine Zahlen.

