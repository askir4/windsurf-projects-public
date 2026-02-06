/*
 * ESP32 RFID Door Access Control
 * Gewächshaus Türzugangskontrolle
 * 
 * Hardware:
 *   - ESP32 DevKit
 *   - MFRC522 RFID Reader (SPI)
 *   - Relay Module (Türöffner)
 *   - LEDs (Grün, Rot, Blau)
 *   - Buzzer
 * 
 * Libraries:
 *   - MFRC522 (miguelbalboa)
 *   - ArduinoJson (bblanchon)
 *   - HTTPClient (ESP32 built-in)
 *   - Preferences (ESP32 built-in)
 *   - WiFi (ESP32 built-in)
 */

#include <WiFi.h>
#include "config.h"
#include "rfid_handler.h"
#include "card_storage.h"
#include "api_client.h"
#include "door_control.h"
#include "led_buzzer.h"

// Module
RfidHandler rfid;
CardStorage cardStorage;
ApiClient api;
DoorControl door;
LedBuzzer leds;

// State
enum DeviceMode { MODE_NORMAL, MODE_LEARNING };
DeviceMode currentMode = MODE_NORMAL;
bool wifiConnected = false;
bool serverOnline = false;

// Timing
unsigned long lastHeartbeat = 0;
unsigned long lastModePoll = 0;
unsigned long lastCardSync = 0;
unsigned long lastWifiCheck = 0;
unsigned long learningStartTime = 0;
unsigned long learningTimeoutMs = LEARNING_TIMEOUT_S * 1000;
int doorOpenDurationMs = DOOR_OPEN_DURATION_MS;

// Card hash for detecting changes
String lastCardHash = "";

void setup() {
    Serial.begin(115200);
    Serial.println();
    Serial.println("========================================");
    Serial.println("  ESP32 RFID Door Access Control");
    Serial.println("  Firmware: " FIRMWARE_VERSION);
    Serial.println("  Device:   " DEVICE_ID);
    Serial.println("========================================");
    
    // Initialize modules
    leds.begin();
    door.begin();
    cardStorage.begin();
    rfid.begin();
    
    Serial.printf("[INIT] %d Karten im lokalen Speicher\n", cardStorage.getCount());
    
    // Initialize API client
    api.begin(SERVER_URL, DEVICE_ID, API_KEY);
    
    // Connect WiFi
    connectWifi();
    
    // Initial sync if connected
    if (wifiConnected) {
        syncCards();
        api.sendHeartbeat(FIRMWARE_VERSION, WiFi.localIP().toString().c_str(), WiFi.RSSI());
        api.flushOfflineEvents();
    }
    
    Serial.println("[INIT] Bereit. Warte auf RFID-Karten...");
}

void loop() {
    unsigned long now = millis();
    
    // Update hardware
    door.update();
    leds.update();
    
    // WiFi check
    if (now - lastWifiCheck >= WIFI_RECONNECT_MS) {
        lastWifiCheck = now;
        if (WiFi.status() != WL_CONNECTED) {
            if (wifiConnected) {
                Serial.println("[WIFI] Verbindung verloren");
                wifiConnected = false;
            }
            connectWifi();
        } else {
            wifiConnected = true;
        }
    }
    
    // Heartbeat
    if (wifiConnected && (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS)) {
        lastHeartbeat = now;
        bool needsSync = api.sendHeartbeat(
            FIRMWARE_VERSION,
            WiFi.localIP().toString().c_str(),
            WiFi.RSSI()
        );
        serverOnline = api.isServerReachable();
        
        if (needsSync) {
            syncCards();
        }
        
        // Flush offline events when server is reachable
        if (serverOnline && api.getOfflineEventCount() > 0) {
            api.flushOfflineEvents();
        }
    }
    
    // Mode polling
    unsigned long modePollInterval = (currentMode == MODE_LEARNING) ? MODE_POLL_LEARNING_MS : MODE_POLL_NORMAL_MS;
    if (wifiConnected && (now - lastModePoll >= modePollInterval)) {
        lastModePoll = now;
        pollMode();
    }
    
    // Periodic card sync
    if (wifiConnected && (now - lastCardSync >= CARD_SYNC_INTERVAL_MS)) {
        lastCardSync = now;
        syncCards();
    }
    
    // Learning mode timeout (local check)
    if (currentMode == MODE_LEARNING && (now - learningStartTime >= learningTimeoutMs)) {
        Serial.println("[MODE] Anlernmodus lokal abgelaufen");
        currentMode = MODE_NORMAL;
        leds.learningModeOff();
    }
    
    // Check for RFID card
    if (rfid.cardPresent()) {
        String uid = rfid.readCardUid();
        Serial.printf("[RFID] Karte erkannt: %s\n", uid.c_str());
        handleCard(uid);
        delay(1000);  // Debounce
    }
}

// ============== WiFi ==============

void connectWifi() {
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        return;
    }
    
    Serial.printf("[WIFI] Verbinde mit %s...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.printf("\n[WIFI] Verbunden! IP: %s, RSSI: %d dBm\n",
            WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else {
        wifiConnected = false;
        Serial.println("\n[WIFI] Verbindung fehlgeschlagen, arbeite offline");
    }
}

// ============== Mode Polling ==============

void pollMode() {
    String mode, expiresAt;
    int doorDur, learnTimeout;
    
    if (api.getMode(mode, expiresAt, doorDur, learnTimeout)) {
        doorOpenDurationMs = doorDur * 1000;
        learningTimeoutMs = learnTimeout * 1000;
        
        if (mode == "learning" && currentMode != MODE_LEARNING) {
            Serial.println("[MODE] Anlernmodus vom Server aktiviert");
            currentMode = MODE_LEARNING;
            learningStartTime = millis();
            leds.learningMode();
        } else if (mode == "normal" && currentMode != MODE_NORMAL) {
            Serial.println("[MODE] Normalmodus vom Server aktiviert");
            currentMode = MODE_NORMAL;
            leds.learningModeOff();
        }
    }
}

// ============== Card Sync ==============

void syncCards() {
    Serial.println("[SYNC] Synchronisiere Kartenliste...");
    if (api.getCards(cardStorage)) {
        lastCardSync = millis();
        Serial.printf("[SYNC] %d Karten geladen\n", cardStorage.getCount());
    } else {
        Serial.println("[SYNC] Synchronisation fehlgeschlagen");
    }
}

// ============== Card Handling ==============

void handleCard(const String& uid) {
    const char* uidStr = uid.c_str();
    
    // Learning mode: register card
    if (currentMode == MODE_LEARNING) {
        handleLearningMode(uidStr);
        return;
    }
    
    // Normal mode: check access
    // Step 1: Local check (offline-first)
    bool localGranted = cardStorage.hasCard(uidStr);
    
    // Step 2: Server check if online
    if (wifiConnected && serverOnline) {
        bool serverGranted = false;
        String cardName, action;
        
        if (api.checkAccess(uidStr, &serverGranted, cardName, action)) {
            // Server response takes priority
            if (serverGranted) {
                grantAccess(cardName);
            } else {
                denyAccess(cardName.length() > 0 ? cardName : uid);
            }
            return;
        }
        // Server unreachable, fall through to local check
        Serial.println("[ACCESS] Server nicht erreichbar, nutze lokale Pruefung");
    }
    
    // Offline/fallback: use local card storage
    if (localGranted) {
        grantAccess("Lokal: " + uid);
        // Buffer event for later sync
        api.addOfflineEvent(uidStr, "ACCESS_GRANTED");
    } else {
        denyAccess(uid);
        api.addOfflineEvent(uidStr, "ACCESS_DENIED");
    }
}

void handleLearningMode(const char* uid) {
    Serial.printf("[LEARN] Registriere Karte: %s\n", uid);
    
    // Add to local storage immediately
    cardStorage.addCard(uid, true);
    
    // Register on server if online
    if (wifiConnected && serverOnline) {
        String cardName;
        if (api.registerCard(uid, cardName)) {
            Serial.printf("[LEARN] Server: Karte registriert als '%s'\n", cardName.c_str());
            leds.cardRegistered();
        } else {
            Serial.println("[LEARN] Server-Registrierung fehlgeschlagen, lokal gespeichert");
            leds.cardRegistered();
        }
    } else {
        Serial.println("[LEARN] Offline: Karte lokal gespeichert");
        leds.cardRegistered();
    }
}

void grantAccess(const String& cardName) {
    Serial.printf("[ACCESS] ZUGANG GEWAEHRT: %s\n", cardName.c_str());
    leds.accessGranted();
    door.openDoor(doorOpenDurationMs);
    
    // Keep green LED on while door is open, then turn off
    delay(doorOpenDurationMs);
    leds.allOff();
}

void denyAccess(const String& info) {
    Serial.printf("[ACCESS] ZUGANG VERWEIGERT: %s\n", info.c_str());
    leds.accessDenied();
    delay(1000);
    leds.allOff();
}
