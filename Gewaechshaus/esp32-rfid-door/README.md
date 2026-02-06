# ESP32 RFID Door Access Control

Firmware for the greenhouse door access control with RFID.

## Hardware

| Component | Pin |
|---|---|
| MFRC522 SDA/SS | GPIO 21 |
| MFRC522 RST | GPIO 22 |
| MFRC522 MOSI | GPIO 23 (SPI default) |
| MFRC522 MISO | GPIO 19 (SPI default) |
| MFRC522 SCK | GPIO 18 (SPI default) |
| Relay (Door Opener) | GPIO 27 |
| LED Green | GPIO 25 |
| LED Red | GPIO 26 |
| LED Blue | GPIO 33 |
| Buzzer | GPIO 32 |

## Required Libraries

In the Arduino IDE under **Sketch > Include Library > Manage Libraries**:

- **MFRC522** by Miguel Balboa (v1.4.10+)
- **ArduinoJson** by Benoît Blanchon (v6.x)

The following are included in the ESP32 board package:
- WiFi, HTTPClient, Preferences, SPI

## Configuration

1. Open `config.h` and adjust:
   - `WIFI_SSID` / `WIFI_PASSWORD` - WiFi credentials
   - `SERVER_URL` - URL of the greenhouse server (e.g., `http://192.168.1.100:3001`)
   - `DEVICE_ID` - Must match the Device ID registered in the admin panel
   - `API_KEY` - The API key shown when creating the device in the admin panel

2. Board in Arduino IDE: **ESP32 Dev Module**

## Operation

- **Normal Mode**: Scan card → Local check → Server check → Open/deny door
- **Learning Mode**: Scan card → Automatically register (local + server)
- **Offline**: Local card list is used, events are buffered and reported when reconnected
- **Heartbeat**: Every 30s the server is informed about the status
- **Card Sync**: Card list is synchronized from the server every 5 minutes

## LED Signals

| Signal | Meaning |
|---|---|
| Green (short) + Beep | Access granted |
| Red (blink 3x) + long beep | Access denied |
| Blue (blink) | Learning mode active |
| Blue + 2x Beep | Card registered |

## Files

- `esp32-rfid-door.ino` - Main sketch
- `config.h` - Configuration
- `rfid_handler.h/.cpp` - MFRC522 RFID reader
- `card_storage.h/.cpp` - NVS card storage
- `api_client.h/.cpp` - HTTP API client
- `door_control.h/.cpp` - Relay control
- `led_buzzer.h/.cpp` - LED and buzzer feedback

---

## Detailed Setup Instructions

### Prerequisites

1. **Arduino IDE Setup**
   - Install Arduino IDE (version 1.8.19 or newer)
   - Add ESP32 board support:
     - File > Preferences
     - Add to "Additional Board Manager URLs": `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
     - Tools > Board > Boards Manager > Search "ESP32" and install "ESP32 by Espressif Systems"

2. **Hardware Requirements**
   - ESP32 DevKit V1 or compatible board
   - MFRC522 RFID reader module
   - Relay module (5V for door opener)
   - LEDs (Green, Red, Blue) with appropriate resistors (220-330Ω)
   - Buzzer or piezo speaker
   - Breadboard and jumper wires
   - Power supply (5V 2A recommended for relay)

### Wiring Instructions

1. **Power Connections**
   - Connect ESP32 VIN to 5V power source
   - Connect GND to common ground
   - MFRC522 VCC to 3.3V (NOT 5V - will damage the module!)
   - MFRC522 GND to ground

2. **SPI Connections (MFRC522)**
   ```
   ESP32    →    MFRC522
   GPIO 18  →    SCK
   GPIO 19  →    MISO
   GPIO 23  →    MOSI
   GPIO 21  →    SDA/SS
   GPIO 22  →    RST
   ```

3. **Output Components**
   ```
   ESP32    →    Component
   GPIO 27  →    Relay module IN (connect relay COM to door opener, NO to +5V)
   GPIO 25  →    Green LED (+) → Resistor → GND
   GPIO 26  →    Red LED (+) → Resistor → GND
   GPIO 33  →    Blue LED (+) → Resistor → GND
   GPIO 32  →    Buzzer (+) → GND
   ```

### Software Setup

1. **Clone/Download the Project**
   - Download all files to a folder named `esp32-rfid-door`

2. **Configure the Device**
   - Open `config.h` in a text editor
   - Set your WiFi credentials
   - Set the server URL (must be accessible from your network)
   - Obtain Device ID and API Key from the greenhouse admin panel
   - Verify pin assignments match your wiring

3. **Upload to ESP32**
   - Connect ESP32 to your computer via USB
   - In Arduino IDE:
     - Tools > Board > "ESP32 Dev Module"
     - Tools > Port > Select your ESP32's COM port
     - File > Open > Select `esp32-rfid-door.ino`
     - Click "Upload" (→ button)

4. **First Time Setup**
   - Open Serial Monitor (Tools > Serial Monitor, set baud rate to 115200)
   - Watch for connection messages
   - The device will attempt to connect to WiFi and register with the server
   - If successful, you'll see "Heartbeat sent" messages every 30 seconds

### Troubleshooting

1. **Device Won't Connect to WiFi**
   - Check SSID and password in config.h
   - Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   - Verify signal strength

2. **RFID Reader Not Working**
   - Check all SPI connections
   - Ensure MFRC522 is powered by 3.3V (NOT 5V)
   - Add a 10k pull-up resistor to RST if unstable

3. **Server Connection Issues**
   - Ping the server URL from a computer on the same network
   - Check firewall settings
   - Verify API key and device ID match exactly

4. **Relay Not Triggering**
   - Check GPIO 27 connection
   - Ensure relay module has separate power if needed
   - Test with multimeter

### Advanced Configuration

1. **OTA Updates**
   - Enable OTA in `config.h` for wireless updates
   - Requires initial USB setup

2. **Debug Mode**
   - Set `DEBUG_MODE` to true in config.h for verbose logging
   - Monitor via Serial Monitor at 115200 baud

3. **Custom Timing**
   - Adjust `DOOR_OPEN_DURATION` for how long the door stays open
   - Modify `HEARTBEAT_INTERVAL` for server check frequency

- `esp32-rfid-door.ino` - Hauptsketch
- `config.h` - Konfiguration
- `rfid_handler.h/.cpp` - MFRC522 RFID-Leser
- `card_storage.h/.cpp` - NVS-Kartenspeicher
- `api_client.h/.cpp` - HTTP-API-Client
- `door_control.h/.cpp` - Relais-Steuerung
- `led_buzzer.h/.cpp` - LED- und Buzzer-Feedback
