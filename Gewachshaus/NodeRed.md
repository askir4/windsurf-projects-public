# Node-RED Integration

Die Webapp liest Sensordaten ueber WebSocket von Node-RED.

## WebSocket
- URL: ws://<HOST>:1880/ws
- Format: {"topic":"sensors/temperature","payload":...}

## Topics
- sensors/temperature (C)
- sensors/humidity (%)
- sensors/soil_moisture (%)
- sensors/water_tank (Objekt: level, temperature, capacity)
- sensors/water_level (Liter)
- sensors/water_temperature (C)

## Payload Beispiele

```json
{ "topic": "sensors/temperature", "payload": 22.5 }
```

```json
{ "topic": "sensors/temperature", "payload": { "value": 22.5 } }
```

```json
{
  "topic": "sensors/water_tank",
  "payload": { "level": 720, "temperature": 18.3, "capacity": 1000 }
}
```

## Aktoren
Wenn in der UI geduengt wird, sendet die Webapp:
- actuators/valve
- actuators/pump

Beispiel Payload:
```json
{
  "beds": [{ "id": 1, "name": "Hochbeet 1", "fertilizer": { "nitrogen": 5, "phosphorus": 2, "potassium": 3 } }],
  "totalBeds": 1,
  "fertilizer": { "nitrogen": 5, "phosphorus": 2, "potassium": 3 },
  "timestamp": "2026-01-16T12:00:00.000Z"
}
```

## Alarmwerte und E-Mail
Sensor-Alarmwerte werden im Admin Panel gesetzt. Bei Alarm kann eine E-Mail per SMTP versendet werden.
