#include "api_client.h"

void ApiClient::begin(const char* serverUrl, const char* deviceId, const char* apiKey) {
    _serverUrl = String(serverUrl);
    _deviceId = String(deviceId);
    _apiKey = String(apiKey);
    
    // Remove trailing slash
    if (_serverUrl.endsWith("/")) {
        _serverUrl = _serverUrl.substring(0, _serverUrl.length() - 1);
    }
}

void ApiClient::setHeaders(HTTPClient& http) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", _apiKey);
}

bool ApiClient::httpGet(const String& path, JsonDocument& doc) {
    HTTPClient http;
    String url = _serverUrl + path;
    
    http.begin(url);
    http.addHeader("X-API-Key", _apiKey);
    http.setTimeout(5000);
    
    int httpCode = http.GET();
    bool success = false;
    
    if (httpCode == 200) {
        String payload = http.getString();
        DeserializationError error = deserializeJson(doc, payload);
        success = !error;
        _serverReachable = true;
    } else {
        Serial.printf("[API] GET %s failed: %d\n", path.c_str(), httpCode);
        if (httpCode < 0) _serverReachable = false;
    }
    
    http.end();
    return success;
}

bool ApiClient::httpPost(const String& path, const JsonDocument& body, JsonDocument& response) {
    HTTPClient http;
    String url = _serverUrl + path;
    
    http.begin(url);
    setHeaders(http);
    http.setTimeout(5000);
    
    String bodyStr;
    serializeJson(body, bodyStr);
    
    int httpCode = http.POST(bodyStr);
    bool success = false;
    
    if (httpCode == 200) {
        String payload = http.getString();
        DeserializationError error = deserializeJson(response, payload);
        success = !error;
        _serverReachable = true;
    } else {
        Serial.printf("[API] POST %s failed: %d\n", path.c_str(), httpCode);
        if (httpCode < 0) _serverReachable = false;
    }
    
    http.end();
    return success;
}

bool ApiClient::sendHeartbeat(const char* firmwareVersion, const char* ipAddress, int wifiSignal) {
    StaticJsonDocument<256> body;
    body["device_id"] = _deviceId;
    body["firmware_version"] = firmwareVersion;
    body["ip_address"] = ipAddress;
    body["wifi_signal"] = wifiSignal;
    body["free_memory"] = ESP.getFreeHeap();
    body["uptime"] = millis() / 1000;
    
    StaticJsonDocument<256> response;
    bool ok = httpPost("/api/rfid/heartbeat", body, response);
    
    if (ok) {
        String newHash = response["card_hash"].as<String>();
        if (newHash.length() > 0 && newHash != _lastCardHash) {
            Serial.println("[API] Kartenliste hat sich geaendert, Sync noetig");
            _lastCardHash = newHash;
            return true;  // Signal that cards need sync
        }
    }
    return ok;
}

bool ApiClient::checkAccess(const char* uid, bool* granted, String& cardName, String& action) {
    StaticJsonDocument<256> body;
    body["uid"] = uid;
    body["device_id"] = _deviceId;
    body["method"] = "local";
    
    StaticJsonDocument<512> response;
    bool ok = httpPost("/api/rfid/access", body, response);
    
    if (ok) {
        *granted = response["granted"].as<bool>();
        cardName = response["card_name"].as<String>();
        action = response.containsKey("action") ? response["action"].as<String>() : "";
    }
    return ok;
}

bool ApiClient::getMode(String& mode, String& expiresAt, int& doorDuration, int& learningTimeout) {
    String path = "/api/rfid/device/" + _deviceId + "/mode";
    StaticJsonDocument<256> doc;
    
    bool ok = httpGet(path, doc);
    if (ok) {
        mode = doc["mode"].as<String>();
        expiresAt = doc["expires_at"].as<String>();
        doorDuration = doc["door_open_duration"].as<int>();
        learningTimeout = doc["learning_timeout"].as<int>();
    }
    return ok;
}

bool ApiClient::getCards(CardStorage& storage) {
    String path = "/api/rfid/device/" + _deviceId + "/cards";
    StaticJsonDocument<4096> doc;
    
    bool ok = httpGet(path, doc);
    if (ok) {
        JsonArray cardsArray = doc["cards"].as<JsonArray>();
        int count = cardsArray.size();
        if (count > MAX_LOCAL_CARDS) count = MAX_LOCAL_CARDS;
        
        StoredCard newCards[MAX_LOCAL_CARDS];
        for (int i = 0; i < count; i++) {
            String uid = cardsArray[i]["uid"].as<String>();
            bool enabled = cardsArray[i]["enabled"].as<bool>();
            strncpy(newCards[i].uid, uid.c_str(), sizeof(newCards[i].uid) - 1);
            newCards[i].uid[sizeof(newCards[i].uid) - 1] = '\0';
            newCards[i].enabled = enabled;
        }
        
        storage.replaceAll(newCards, count);
        _lastCardHash = doc["hash"].as<String>();
        Serial.printf("[API] %d Karten synchronisiert\n", count);
    }
    return ok;
}

bool ApiClient::registerCard(const char* uid, String& cardName) {
    String path = "/api/rfid/device/" + _deviceId + "/register-card";
    StaticJsonDocument<128> body;
    body["uid"] = uid;
    
    StaticJsonDocument<256> response;
    bool ok = httpPost(path, body, response);
    
    if (ok) {
        cardName = response["card_name"].as<String>();
    }
    return ok;
}

bool ApiClient::sendAccessBulk(OfflineEvent* events, int count) {
    StaticJsonDocument<4096> body;
    JsonArray arr = body.createNestedArray("events");
    
    for (int i = 0; i < count; i++) {
        JsonObject evt = arr.createNestedObject();
        evt["uid"] = events[i].uid;
        evt["action"] = events[i].action;
        evt["timestamp"] = events[i].timestamp;
    }
    
    StaticJsonDocument<128> response;
    return httpPost("/api/rfid/access-bulk", body, response);
}

bool ApiClient::isServerReachable() {
    return _serverReachable;
}

String ApiClient::getLastCardHash() {
    return _lastCardHash;
}

void ApiClient::addOfflineEvent(const char* uid, const char* action) {
    if (_offlineCount >= MAX_OFFLINE_EVENTS) {
        // Ring buffer: overwrite oldest
        for (int i = 0; i < MAX_OFFLINE_EVENTS - 1; i++) {
            _offlineBuffer[i] = _offlineBuffer[i + 1];
        }
        _offlineCount = MAX_OFFLINE_EVENTS - 1;
    }
    
    strncpy(_offlineBuffer[_offlineCount].uid, uid, sizeof(_offlineBuffer[_offlineCount].uid) - 1);
    _offlineBuffer[_offlineCount].uid[sizeof(_offlineBuffer[_offlineCount].uid) - 1] = '\0';
    strncpy(_offlineBuffer[_offlineCount].action, action, sizeof(_offlineBuffer[_offlineCount].action) - 1);
    _offlineBuffer[_offlineCount].action[sizeof(_offlineBuffer[_offlineCount].action) - 1] = '\0';
    _offlineBuffer[_offlineCount].timestamp = millis() / 1000;
    _offlineCount++;
}

void ApiClient::flushOfflineEvents() {
    if (_offlineCount == 0) return;
    
    Serial.printf("[API] Sende %d gepufferte Events...\n", _offlineCount);
    if (sendAccessBulk(_offlineBuffer, _offlineCount)) {
        Serial.println("[API] Offline-Events erfolgreich gesendet");
        _offlineCount = 0;
    } else {
        Serial.println("[API] Offline-Events senden fehlgeschlagen");
    }
}

int ApiClient::getOfflineEventCount() {
    return _offlineCount;
}
