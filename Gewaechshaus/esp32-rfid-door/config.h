#ifndef CONFIG_H
#define CONFIG_H

// ============== WiFi-Konfiguration ==============
#define WIFI_SSID       "DEIN_WLAN_NAME"
#define WIFI_PASSWORD   "DEIN_WLAN_PASSWORT"

// ============== Server-Konfiguration ==============
#define SERVER_URL      "http://192.168.1.100:3001"
#define DEVICE_ID       "esp32-door-01"
#define API_KEY         "DEIN_API_KEY_HIER"

// ============== Hardware-Pins ==============
// MFRC522 SPI-Pins (ESP32 Standard-SPI)
#define RST_PIN         22
#define SS_PIN          21

// Relais / Tueroffner
#define RELAY_PIN       27

// Status-LEDs
#define LED_GREEN_PIN   25
#define LED_RED_PIN     26
#define LED_BLUE_PIN    33

// Buzzer
#define BUZZER_PIN      32

// ============== Timing-Konfiguration ==============
#define DOOR_OPEN_DURATION_MS   3000    // Standard: 3 Sekunden
#define LEARNING_TIMEOUT_S      60      // Standard: 60 Sekunden
#define HEARTBEAT_INTERVAL_MS   30000   // Alle 30 Sekunden
#define MODE_POLL_NORMAL_MS     5000    // Modus-Polling im Normalmodus
#define MODE_POLL_LEARNING_MS   2000    // Modus-Polling im Anlernmodus
#define CARD_SYNC_INTERVAL_MS   300000  // Kartenliste alle 5 Minuten
#define WIFI_RECONNECT_MS       5000    // WiFi-Reconnect-Intervall

// ============== Limits ==============
#define MAX_LOCAL_CARDS         50      // Max Karten im NVS
#define MAX_OFFLINE_EVENTS      50      // Max gepufferte Offline-Events
#define FIRMWARE_VERSION        "1.0.0"

#endif
