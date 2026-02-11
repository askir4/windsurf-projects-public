<div align="center">

# ESP32 RFID Door Access Control - Complete Setup Guide

**Step-by-step instructions for building and configuring the Project Iron Garden door controller**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Bill of Materials](#bill-of-materials)
- [Wiring Diagram](#wiring-diagram)
  - [ESP32 Pinout Reference](#esp32-pinout-reference)
  - [MFRC522 RFID Reader (SPI)](#1-mfrc522-rfid-reader-spi)
  - [Relay Module (Door Opener)](#2-relay-module-door-opener)
  - [Status LEDs](#3-status-leds)
  - [Buzzer](#4-buzzer)
  - [Power Supply](#5-power-supply)
- [Complete Wiring Summary](#complete-wiring-summary)
- [Software Setup](#software-setup)
  - [Step 1: Install Arduino IDE](#step-1-install-arduino-ide)
  - [Step 2: Add ESP32 Board Support](#step-2-add-esp32-board-support)
  - [Step 3: Install Required Libraries](#step-3-install-required-libraries)
  - [Step 4: Load the Project](#step-4-load-the-project)
  - [Step 5: Configure the Firmware](#step-5-configure-the-firmware)
  - [Step 6: Upload to ESP32](#step-6-upload-to-esp32)
- [Server-Side Device Registration](#server-side-device-registration)
- [First Boot & Verification](#first-boot--verification)
- [Operating Modes](#operating-modes)
  - [Normal Mode](#normal-mode)
  - [Learning Mode](#learning-mode)
  - [Offline Mode](#offline-mode)
- [LED & Buzzer Signal Reference](#led--buzzer-signal-reference)
- [Timing Configuration](#timing-configuration)
- [Firmware Architecture](#firmware-architecture)
- [Troubleshooting](#troubleshooting)
- [Safety Notes](#safety-notes)

---

## Overview

This guide walks you through building an ESP32-based RFID door access controller for the Project Iron Garden project. The system uses an MFRC522 RFID reader to scan NFC/RFID cards, verifies access through a central server (or locally when offline), and triggers a relay to open the door. Visual and audio feedback is provided through three colored LEDs and a buzzer.

**Key features:**

- Offline-first design: works without internet, syncs when reconnected
- Stores up to 50 cards locally in ESP32 flash memory (NVS)
- Buffers up to 50 access events while offline for later sync
- Learning mode for easy card registration by scanning
- Heartbeat monitoring every 30 seconds
- Automatic card list synchronization every 5 minutes
- Automatic WiFi reconnection

---

## Bill of Materials

You will need the following components:

| # | Component | Specification | Qty | Notes |
|---|-----------|---------------|-----|-------|
| 1 | **ESP32 DevKit V1** | ESP-WROOM-32, 38 pins | 1 | Any ESP32 dev board with exposed SPI pins works |
| 2 | **MFRC522 RFID Reader** | 13.56 MHz, SPI interface | 1 | Comes with header pins (solder if needed) |
| 3 | **RFID Cards or Tags** | 13.56 MHz MIFARE Classic | 1+ | Usually 2 cards are included with the MFRC522 |
| 4 | **5V Relay Module** | 1-channel, optocoupler isolated | 1 | Must be 5V compatible; look for HIGH-level trigger |
| 5 | **LED - Green** | 5mm, standard | 1 | Access granted indicator |
| 6 | **LED - Red** | 5mm, standard | 1 | Access denied indicator |
| 7 | **LED - Blue** | 5mm, standard | 1 | Learning mode indicator |
| 8 | **Resistors** | 220-330 Ohm | 3 | One per LED (current limiting) |
| 9 | **Buzzer** | Active buzzer, 5V | 1 | Active type (produces tone when powered) |
| 10 | **Breadboard** | Full-size or half-size | 1 | For prototyping; use PCB for permanent install |
| 11 | **Jumper Wires** | Male-to-male & male-to-female | ~20 | Assorted colors recommended for clarity |
| 12 | **USB Cable** | Micro-USB or USB-C (for your ESP32) | 1 | For programming and power during development |
| 13 | **Power Supply** | 5V 2A, DC barrel or USB | 1 | Required for relay; USB alone may not suffice |
| 14 | **Door Lock/Opener** | Electric strike or solenoid lock | 1 | Must match relay specs (voltage/current) |

**Optional but recommended:**

| Component | Purpose |
|-----------|---------|
| 10k Ohm resistor | Pull-up for MFRC522 RST pin (if unstable) |
| Flyback diode (1N4007) | Protect relay from back-EMF of solenoid |
| Screw terminal block | Secure connection for door lock wires |
| Project enclosure | Weatherproofing for outdoor Project Iron Garden use |
| Wire ferrules & crimps | Professional wire termination |

---

## Wiring Diagram

### ESP32 Pinout Reference

The ESP32 DevKit V1 has 38 pins. This project uses the default SPI bus (VSPI) plus several GPIO pins for outputs. Below is the complete pin assignment:

```
ESP32 DevKit V1 - Pin Assignment for this project
===================================================

              ┌──────────────┐
              │   USB Port   │
              ├──────────────┤
        3V3  ─┤ 1         38 ├─ GND
         EN  ─┤ 2         37 ├─ GPIO 23  ──→  MFRC522 MOSI
  (SVP) GP36 ─┤ 3         36 ├─ GPIO 22  ──→  MFRC522 RST
  (SVN) GP39 ─┤ 4         35 ├─ TX0
        GP34 ─┤ 5         34 ├─ RX0
        GP35 ─┤ 6         33 ├─ GPIO 21  ──→  MFRC522 SDA/SS
        GP32 ─┤ 7  ──→ BUZ  32 ├─ GND
        GP33 ─┤ 8  ──→ BLU  31 ├─ GPIO 19  ──→  MFRC522 MISO
        GP25 ─┤ 9  ──→ GRN  30 ├─ GPIO 18  ──→  MFRC522 SCK
        GP26 ─┤ 10 ──→ RED  29 ├─ GPIO 5
        GP27 ─┤ 11 ──→ RLY  28 ├─ GPIO 17
        GP14 ─┤ 12         27 ├─ GPIO 16
        GP12 ─┤ 13         26 ├─ GPIO 4
         GND ─┤ 14         25 ├─ GPIO 0
        GP13 ─┤ 15         24 ├─ GPIO 2
   (SD2) GP9 ─┤ 16         23 ├─ GPIO 15
  (SD3) GP10 ─┤ 17         22 ├─ (SD1) GP8
  (CMD) GP11 ─┤ 18         21 ├─ (SD0) GP7
         5V  ─┤ 19         20 ├─ (CLK) GP6
              └──────────────┘

  BUZ = Buzzer (GPIO 32)    GRN = Green LED (GPIO 25)
  RED = Red LED (GPIO 26)   BLU = Blue LED (GPIO 33)
  RLY = Relay (GPIO 27)
```

---

### 1. MFRC522 RFID Reader (SPI)

The MFRC522 communicates over SPI. The ESP32 uses its default VSPI bus.

**Connections:**

| MFRC522 Pin | ESP32 Pin | GPIO | Wire Color (suggested) |
|-------------|-----------|------|------------------------|
| **SDA (SS)** | D21 | GPIO 21 | Yellow |
| **SCK** | D18 | GPIO 18 | Orange |
| **MOSI** | D23 | GPIO 23 | Green |
| **MISO** | D19 | GPIO 19 | Blue |
| **IRQ** | — | Not connected | — |
| **GND** | GND | — | Black |
| **RST** | D22 | GPIO 22 | White |
| **3.3V** | 3V3 | — | Red |

> **WARNING: The MFRC522 module runs on 3.3V. Connecting it to 5V will permanently damage the module!** The ESP32's 3V3 pin provides the correct voltage.

**Step-by-step:**

1. Place the MFRC522 on your breadboard (or connect via female jumper wires to the header pins).
2. Connect **3.3V** on the MFRC522 to the **3V3** pin on the ESP32.
3. Connect **GND** on the MFRC522 to a **GND** pin on the ESP32.
4. Connect **RST** to **GPIO 22**.
5. Connect **SDA/SS** to **GPIO 21**.
6. Connect **MOSI** to **GPIO 23**.
7. Connect **MISO** to **GPIO 19**.
8. Connect **SCK** to **GPIO 18**.
9. Leave the **IRQ** pin unconnected (not used by this firmware).

> **Tip:** If the RFID reader behaves erratically (random reads, initialization failures), add a 10k Ohm pull-up resistor between the RST pin and 3.3V.

---

### 2. Relay Module (Door Opener)

The relay module switches the door lock/solenoid. The ESP32 sends a HIGH signal to open the door and LOW to close it.

**Connections:**

| Relay Module Pin | ESP32 Pin | GPIO | Notes |
|------------------|-----------|------|-------|
| **IN** (Signal) | D27 | GPIO 27 | Control signal |
| **VCC** | 5V | — | Relay needs 5V to operate the coil |
| **GND** | GND | — | Common ground with ESP32 |

**Relay output side (screw terminals):**

| Terminal | Connection |
|----------|------------|
| **COM** (Common) | One wire from your door lock power supply |
| **NO** (Normally Open) | One wire going to the door lock/solenoid |

> The **NO** (Normally Open) terminal means the circuit is open (door locked) when the relay is off, and closed (door opens) when the relay is activated. This is the safe default: if the ESP32 loses power, the door stays locked.

**Step-by-step:**

1. Connect the relay module **VCC** to the ESP32 **5V** pin (or external 5V supply).
2. Connect the relay module **GND** to the ESP32 **GND**.
3. Connect the relay module **IN** to ESP32 **GPIO 27**.
4. On the screw terminal side, wire your door lock between **COM** and **NO**.
5. Connect the door lock's power supply to the **COM** terminal.

> **Important:** If your door lock draws significant current (e.g., an electric strike), use a separate 5V/12V power supply for the relay output side. Do NOT power a door solenoid through the ESP32's 5V pin - it cannot provide enough current and may damage the board.

> **Recommended:** Add a flyback diode (1N4007) across the door solenoid/lock terminals (cathode to positive) to protect the relay from voltage spikes when the solenoid de-energizes.

---

### 3. Status LEDs

Three LEDs provide visual feedback for different states.

**Connections (each LED needs a current-limiting resistor):**

| LED | ESP32 Pin | GPIO | Resistor | Purpose |
|-----|-----------|------|----------|---------|
| **Green** | D25 | GPIO 25 | 220-330 Ohm | Access granted |
| **Red** | D26 | GPIO 26 | 220-330 Ohm | Access denied |
| **Blue** | D33 | GPIO 33 | 220-330 Ohm | Learning mode active |

**Wiring per LED:**

```
ESP32 GPIO  ──→  Resistor (220-330 Ohm)  ──→  LED Anode (+, longer leg)
                                                    │
                                               LED Cathode (-, shorter leg)
                                                    │
                                                   GND
```

**Step-by-step (repeat for each LED):**

1. Insert the LED into the breadboard. The **longer leg is the anode (+)**, the shorter leg is the **cathode (-)**.
2. Connect a 220-330 Ohm resistor between the ESP32 GPIO pin and the LED's anode (longer leg).
3. Connect the LED's cathode (shorter leg) to the **GND** rail on the breadboard.
4. Connect the GND rail to the ESP32's **GND** pin.

> **Tip:** Use colored jumper wires that match each LED color to make your wiring easier to follow and debug.

---

### 4. Buzzer

An active buzzer provides audio feedback for access events.

**Connections:**

| Buzzer Pin | ESP32 Pin | GPIO | Notes |
|------------|-----------|------|-------|
| **+ (Positive)** | D32 | GPIO 32 | Signal pin |
| **- (Negative/GND)** | GND | — | Ground |

**Step-by-step:**

1. Connect the **positive (+)** pin of the buzzer to ESP32 **GPIO 32**.
2. Connect the **negative (-)** pin to **GND**.

> **Note:** Use an **active buzzer** (not passive). An active buzzer produces a tone when you simply apply voltage. A passive buzzer requires a PWM signal to generate sound. This firmware uses simple HIGH/LOW signals, so an active buzzer is required.

---

### 5. Power Supply

**During development (USB powered):**

- Connect the ESP32 to your computer via USB. This provides 5V through the USB port.
- The MFRC522 is powered from the ESP32's 3.3V regulator.
- A small relay module may work on USB power alone, but it's not guaranteed.

**For production/permanent installation:**

- Use a dedicated **5V 2A power supply** connected to the ESP32's **VIN** and **GND** pins.
- If the door lock requires 12V, use a separate 12V supply for the relay output side. Keep the grounds connected.
- For outdoor Project Iron Garden installations, use a weatherproof enclosure and sealed cable glands.

**Power wiring summary:**

```
5V Power Supply
  │
  ├──→  ESP32 VIN (or 5V pin)
  ├──→  Relay Module VCC
  │
  └──→  GND (common ground bus)
          ├──→  ESP32 GND
          ├──→  Relay Module GND
          ├──→  MFRC522 GND
          ├──→  LED cathodes (via GND rail)
          └──→  Buzzer GND

ESP32 3V3 pin  ──→  MFRC522 VCC (3.3V ONLY!)
```

---

## Complete Wiring Summary

Here is every connection at a glance:

| ESP32 Pin | GPIO | Connected To | Notes |
|-----------|------|-------------|-------|
| **3V3** | — | MFRC522 VCC | 3.3V only! |
| **GND** | — | Common ground bus | All GND connections |
| **5V / VIN** | — | Relay VCC, Power Supply | 5V input |
| **D18** | GPIO 18 | MFRC522 SCK | SPI Clock |
| **D19** | GPIO 19 | MFRC522 MISO | SPI Data Out |
| **D21** | GPIO 21 | MFRC522 SDA/SS | SPI Chip Select |
| **D22** | GPIO 22 | MFRC522 RST | Reset |
| **D23** | GPIO 23 | MFRC522 MOSI | SPI Data In |
| **D25** | GPIO 25 | Green LED (via resistor) | Access granted |
| **D26** | GPIO 26 | Red LED (via resistor) | Access denied |
| **D27** | GPIO 27 | Relay IN | Door control signal |
| **D32** | GPIO 32 | Buzzer (+) | Audio feedback |
| **D33** | GPIO 33 | Blue LED (via resistor) | Learning mode |

**Total wires needed:** ~17 jumper wires + 3 resistors

---

## Software Setup

### Step 1: Install Arduino IDE

1. Download the Arduino IDE from [https://www.arduino.cc/en/software](https://www.arduino.cc/en/software).
2. Install version **1.8.19 or newer** (or Arduino IDE 2.x).
3. Launch the IDE after installation.

---

### Step 2: Add ESP32 Board Support

The Arduino IDE does not include ESP32 support by default. You need to add it:

1. Open Arduino IDE.
2. Go to **File > Preferences** (on macOS: **Arduino > Preferences**).
3. In the **"Additional Board Manager URLs"** field, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   If there are already other URLs, separate them with a comma.
4. Click **OK**.
5. Go to **Tools > Board > Boards Manager**.
6. Search for **"ESP32"**.
7. Find **"ESP32 by Espressif Systems"** and click **Install**.
8. Wait for the installation to complete (this downloads ~250 MB).

---

### Step 3: Install Required Libraries

Two external libraries are needed. All other libraries (WiFi, HTTPClient, Preferences, SPI) are built into the ESP32 board package.

**Via Library Manager:**

1. Go to **Sketch > Include Library > Manage Libraries**.
2. Search for **"MFRC522"** by **Miguel Balboa** - install version **1.4.10** or newer.
3. Search for **"ArduinoJson"** by **Benoit Blanchon** - install version **6.x** (not 7.x).
4. Close the Library Manager.

**Installed libraries summary:**

| Library | Author | Version | Purpose |
|---------|--------|---------|---------|
| **MFRC522** | Miguel Balboa | >= 1.4.10 | SPI communication with RFID reader |
| **ArduinoJson** | Benoit Blanchon | 6.x | JSON serialization for server API |
| WiFi | Espressif (built-in) | — | WiFi connectivity |
| HTTPClient | Espressif (built-in) | — | HTTP requests to server |
| Preferences | Espressif (built-in) | — | Non-volatile storage (NVS) for cards |
| SPI | Arduino (built-in) | — | SPI bus for MFRC522 |

---

### Step 4: Load the Project

1. Copy the entire `esp32-rfid-door/` folder to your Arduino sketchbook location.
   - Default location: `~/Arduino/esp32-rfid-door/` (Linux/macOS) or `Documents\Arduino\esp32-rfid-door\` (Windows)
2. Open Arduino IDE.
3. Go to **File > Open** and select `esp32-rfid-door.ino`.
4. The IDE should open the project with all associated files:
   - `esp32-rfid-door.ino` - Main sketch
   - `config.h` - Configuration
   - `rfid_handler.h` / `rfid_handler.cpp` - RFID reader interface
   - `card_storage.h` / `card_storage.cpp` - Local NVS card storage
   - `api_client.h` / `api_client.cpp` - HTTP API client
   - `door_control.h` / `door_control.cpp` - Relay control
   - `led_buzzer.h` / `led_buzzer.cpp` - LED and buzzer feedback

---

### Step 5: Configure the Firmware

Open `config.h` and update the following values:

```cpp
// ============== WiFi Configuration ==============
#define WIFI_SSID       "YourWiFiName"        // Your 2.4 GHz WiFi network name
#define WIFI_PASSWORD   "YourWiFiPassword"     // Your WiFi password

// ============== Server Configuration ==============
#define SERVER_URL      "http://192.168.1.100:3001"  // Your Project Iron Garden server IP and port
#define DEVICE_ID       "esp32-door-01"               // Must match server registration
#define API_KEY         "your-api-key-here"            // From the server admin panel
```

**Important notes on configuration:**

| Setting | Requirement |
|---------|-------------|
| `WIFI_SSID` | Must be a **2.4 GHz** network. The ESP32 does NOT support 5 GHz WiFi. |
| `WIFI_PASSWORD` | Your WiFi password. Supports WPA2. |
| `SERVER_URL` | The full URL including protocol and port. Must be reachable from the ESP32's network. |
| `DEVICE_ID` | This ID must match exactly what you register in the Project Iron Garden server admin panel. |
| `API_KEY` | Generated when you register the device on the server. Copy it exactly. |

**Optional: Adjust timing parameters** (usually the defaults are fine):

```cpp
#define DOOR_OPEN_DURATION_MS   3000    // Door stays open for 3 seconds
#define LEARNING_TIMEOUT_S      60      // Learning mode times out after 60 seconds
#define HEARTBEAT_INTERVAL_MS   30000   // Send heartbeat every 30 seconds
#define CARD_SYNC_INTERVAL_MS   300000  // Sync card list every 5 minutes
```

**Optional: Adjust pin assignments** (only if your wiring differs):

```cpp
#define RST_PIN         22    // MFRC522 RST
#define SS_PIN          21    // MFRC522 SDA/SS
#define RELAY_PIN       27    // Relay control
#define LED_GREEN_PIN   25    // Green LED
#define LED_RED_PIN     26    // Red LED
#define LED_BLUE_PIN    33    // Blue LED
#define BUZZER_PIN      32    // Buzzer
```

---

### Step 6: Upload to ESP32

1. Connect the ESP32 to your computer via USB.
2. In Arduino IDE, set the board:
   - **Tools > Board > ESP32 Arduino > ESP32 Dev Module**
3. Select the correct serial port:
   - **Tools > Port > /dev/ttyUSB0** (Linux) or **COMx** (Windows) or **/dev/cu.SLAB_USBtoUART** (macOS)
   - If no port appears, install the [CP2102 USB driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) or [CH340 driver](https://sparks.gogo.co.nz/ch340.html) depending on your ESP32 board.
4. Keep the default upload settings:
   - **Upload Speed:** 921600
   - **Flash Frequency:** 80MHz
   - **Flash Mode:** QIO
   - **Flash Size:** 4MB
   - **Partition Scheme:** Default 4MB with spiffs
5. Click the **Upload** button (right arrow icon) or press **Ctrl+U**.
6. Wait for compilation and upload to complete.
   - If upload fails with "Connecting...", hold the **BOOT** button on the ESP32 during upload.
   - Release the BOOT button once upload starts.

---

## Server-Side Device Registration

Before the ESP32 can communicate with the Project Iron Garden server, you must register it as a device:

1. Open the Project Iron Garden web interface (e.g., `http://192.168.1.100:3001`).
2. Log in with an **admin account**.
3. Navigate to the **RFID Door Access** section in the admin panel.
4. Click **"Add Device"** (or "Register Device").
5. Fill in the device details:
   - **Device ID:** Must match the `DEVICE_ID` in your `config.h` (e.g., `esp32-door-01`)
   - **Name:** A descriptive name (e.g., "Project Iron Garden Main Door")
   - **Location:** Where the reader is installed (e.g., "Project Iron Garden Entrance")
6. After saving, the server will generate an **API Key**.
7. **Copy this API Key** and paste it into `config.h` as the `API_KEY` value.
8. Re-upload the firmware if you changed the API key.

> **Note:** The API key authenticates the ESP32 with the server. Each device gets a unique key. If compromised, you can regenerate it via **"Regenerate API Key"** in the admin panel.

---

## First Boot & Verification

After uploading, verify the system is working:

1. Open the **Serial Monitor** in Arduino IDE:
   - **Tools > Serial Monitor**
   - Set baud rate to **115200** (bottom-right dropdown).
2. Press the **RST** (Reset) button on the ESP32.
3. You should see the following startup sequence:

```
========================================
  ESP32 RFID Door Access Control
  Firmware: 1.0.0
  Device:   esp32-door-01
========================================
[RFID] Reader: Firmware Version: 0x92 = v2.0
[INIT] 0 Karten im lokalen Speicher
[WIFI] Verbinde mit YourWiFiName...
......
[WIFI] Verbunden! IP: 192.168.1.42, RSSI: -45 dBm
[SYNC] Synchronisiere Kartenliste...
[SYNC] 0 Karten geladen
[INIT] Bereit. Warte auf RFID-Karten...
```

**Checklist:**

| What to check | Expected result | If it fails |
|----------------|----------------|-------------|
| RFID reader firmware version | `0x92 = v2.0` or similar | Check SPI wiring, 3.3V power |
| WiFi connection | Shows IP and RSSI | Check SSID/password, use 2.4 GHz |
| Card sync | `Karten geladen` message | Check SERVER_URL, API_KEY, DEVICE_ID |
| Heartbeat | No errors after 30 seconds | Check server is running, check firewall |

**Quick hardware test:**

- Hold an RFID card near the reader - you should see `[RFID] Karte erkannt: XX:XX:XX:XX` in the Serial Monitor.
- If access is denied, the red LED should blink 3 times with a long beep.
- If access is granted, the green LED lights up with a short beep and the relay clicks.

---

## Operating Modes

### Normal Mode

This is the default operating mode.

**Flow when a card is scanned:**

```
Card scanned
    │
    ├─→ Check local card storage (offline-first)
    │
    ├─→ If WiFi + server available:
    │       └─→ Send card UID to server via POST /api/rfid/access
    │           ├─→ Server says GRANTED → Open door + green LED + short beep
    │           └─→ Server says DENIED  → Red LED blinks 3x + long beep
    │
    └─→ If offline (no WiFi or server unreachable):
            └─→ Use local card storage result
                ├─→ Card found locally → Open door + buffer event
                └─→ Card not found    → Deny access + buffer event
```

The server response always takes priority over the local check when available.

### Learning Mode

Learning mode allows you to register new RFID cards by simply scanning them. It is activated from the server admin panel.

**How it works:**

1. An admin activates learning mode via the web interface.
2. The ESP32 detects the mode change during its next polling cycle (within 2-5 seconds).
3. The **blue LED starts blinking** to indicate learning mode is active.
4. Scan any RFID card - it will be automatically registered:
   - Stored locally in the ESP32's NVS flash.
   - Sent to the server if online.
5. After each scan, the **blue LED stays solid** with **two short beeps** as confirmation.
6. Learning mode automatically expires after **60 seconds** (configurable).

### Offline Mode

The system is designed to work without an internet connection:

- **Card verification** falls back to the locally stored card list (up to 50 cards).
- **Access events** are buffered in memory (up to 50 events).
- When WiFi reconnects, buffered events are automatically sent to the server in bulk.
- The card list is automatically re-synced when the server becomes reachable.

---

## LED & Buzzer Signal Reference

| Signal | Green LED | Red LED | Blue LED | Buzzer | Meaning |
|--------|-----------|---------|----------|--------|---------|
| **Access Granted** | ON (solid, 3s) | off | off | 1 short beep (100ms) | Door opens |
| **Access Denied** | off | Blinks 3x | off | 1 long beep (500ms) | Door stays locked |
| **Learning Mode Active** | off | off | Blinking (500ms interval) | — | Waiting for card scan |
| **Card Registered** | off | off | ON (solid) | 2 short beeps (100ms each) | Card saved successfully |
| **All Off** | off | off | off | off | Idle / standby |

---

## Timing Configuration

All timing values are defined in `config.h` and can be adjusted:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `DOOR_OPEN_DURATION_MS` | 3000 (3s) | How long the relay stays active (door open) |
| `LEARNING_TIMEOUT_S` | 60 (1 min) | Learning mode auto-expires after this time |
| `HEARTBEAT_INTERVAL_MS` | 30000 (30s) | How often the ESP32 reports its status to the server |
| `MODE_POLL_NORMAL_MS` | 5000 (5s) | How often to check for mode changes (normal mode) |
| `MODE_POLL_LEARNING_MS` | 2000 (2s) | How often to check for mode changes (learning mode, faster) |
| `CARD_SYNC_INTERVAL_MS` | 300000 (5 min) | How often to re-sync the full card list from the server |
| `WIFI_RECONNECT_MS` | 5000 (5s) | How often to attempt WiFi reconnection if disconnected |

> **Note:** The door open duration and learning timeout can also be adjusted remotely from the server admin panel. Server-side values override the local defaults.

---

## Firmware Architecture

The firmware is built with a modular architecture. Each component is isolated in its own class:

```
esp32-rfid-door.ino          ← Main sketch: setup(), loop(), state machine
    │
    ├── config.h              ← All pin definitions, WiFi config, timing constants
    │
    ├── rfid_handler.h/.cpp   ← MFRC522 initialization, card detection, UID reading
    │                            Formats UIDs as "AA:BB:CC:DD" (hex with colons)
    │
    ├── card_storage.h/.cpp   ← NVS-based persistent storage for up to 50 cards
    │                            Supports add, remove, check, replace operations
    │
    ├── api_client.h/.cpp     ← All HTTP communication with the Project Iron Garden server
    │                            Handles heartbeat, access checks, card sync,
    │                            learning mode registration, and offline event buffering
    │
    ├── door_control.h/.cpp   ← Relay GPIO control with auto-close timer
    │                            Opens door for configurable duration, then auto-locks
    │
    └── led_buzzer.h/.cpp     ← LED and buzzer patterns for all feedback signals
                                 Supports blinking, solid, and timed patterns
```

**Main loop cycle:**

1. Update hardware timers (door auto-close, LED blink)
2. Check WiFi connectivity, reconnect if needed
3. Send heartbeat if interval elapsed
4. Poll server for mode changes
5. Periodic card sync if interval elapsed
6. Check learning mode timeout
7. Check for RFID card presence, handle if detected

---

## Troubleshooting

### ESP32 won't connect to WiFi

| Symptom | Solution |
|---------|----------|
| `Verbindung fehlgeschlagen` in Serial Monitor | Double-check SSID and password in `config.h` |
| Connects sometimes, drops frequently | Move ESP32 closer to the router or add an external antenna |
| Never connects | Ensure your WiFi is **2.4 GHz**. The ESP32 does NOT support 5 GHz networks. |
| Shows dots forever (`.........`) | Check if your router has MAC filtering or client limits |

### RFID reader not detecting cards

| Symptom | Solution |
|---------|----------|
| No firmware version printed at startup | Check all SPI wiring (SCK, MISO, MOSI, SDA, RST) |
| `Firmware Version: 0x00` or `0xFF` | Loose SPI connection or MFRC522 not powered. Check 3.3V. |
| Cards not detected at all | Ensure cards are 13.56 MHz MIFARE type (not 125 kHz) |
| Intermittent detection | Add 10k pull-up on RST pin; ensure solid SPI connections |
| Reader initializes but reads fail | Try reducing SPI speed or check for breadboard contact issues |

### Relay not clicking / door not opening

| Symptom | Solution |
|---------|----------|
| Relay never clicks | Check GPIO 27 connection to relay IN pin |
| Relay clicks but door doesn't open | Check relay output wiring (COM and NO terminals) |
| Relay clicks weakly | Provide separate 5V power to relay module (not from ESP32 USB) |
| ESP32 resets when relay activates | Power supply too weak. Use a 5V 2A supply. Add capacitor. |

### Server communication issues

| Symptom | Solution |
|---------|----------|
| `Server nicht erreichbar` | Ping the server IP from a device on the same network |
| Heartbeat fails | Check `SERVER_URL` format: `http://IP:PORT` (no trailing slash) |
| Access check fails (403) | Verify `API_KEY` matches the one shown in the admin panel |
| Access check fails (404) | Verify `DEVICE_ID` matches the registered device on the server |
| Sync fails periodically | Check server logs; may be a rate-limiting or timeout issue |

### Upload issues

| Symptom | Solution |
|---------|----------|
| `Failed to connect to ESP32` | Hold BOOT button during upload, release when upload starts |
| Port not visible | Install USB driver (CP2102 or CH340 depending on your board) |
| Compilation errors | Ensure both MFRC522 and ArduinoJson libraries are installed |
| `ArduinoJson.h: No such file` | Install ArduinoJson v6.x (not v7.x) via Library Manager |

---

## Safety Notes

1. **Electrical Safety:**
   - Always disconnect power before making wiring changes.
   - The MFRC522 operates at 3.3V. Connecting it to 5V will permanently damage the module.
   - Use appropriate wire gauges for the door lock current.
   - Add a flyback diode across inductive loads (solenoids) to prevent voltage spikes.

2. **Physical Security:**
   - This is a supplementary access control system, not a high-security lock.
   - Mount the ESP32 and reader on the secure side of the door where possible.
   - Use a proper enclosure to protect electronics from moisture and tampering.
   - For Project Iron Garden use, consider IP65-rated enclosures.

3. **Network Security:**
   - Change the default API key immediately after setup.
   - Use HTTPS (via reverse proxy) if the server is accessible beyond the local network.
   - The ESP32 stores WiFi credentials in flash memory. Treat the device as a security-sensitive component.
   - Regularly check access logs in the admin panel for unauthorized attempts.

4. **Fail-Safe Behavior:**
   - When the ESP32 loses power, the relay defaults to OFF (door locked).
   - When WiFi is unavailable, the local card list is used.
   - The system continues to function fully offline with the last synchronized card list.

---

<div align="center">

**[Back to Main README](README.md)** | **[Server Setup](SERVER.md)** | **[Raspberry Pi Setup](RASPI-SETUP.md)** | **[Node-RED Integration](NodeRed.md)**

</div>
