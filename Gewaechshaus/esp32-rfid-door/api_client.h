#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "card_storage.h"

struct OfflineEvent {
    char uid[24];
    char action[20];
    unsigned long timestamp;
};

class ApiClient {
public:
    void begin(const char* serverUrl, const char* deviceId, const char* apiKey);
    
    // ESP32 endpoints
    bool sendHeartbeat(const char* firmwareVersion, const char* ipAddress, int wifiSignal);
    bool checkAccess(const char* uid, bool* granted, String& cardName, String& action);
    bool getMode(String& mode, String& expiresAt, int& doorDuration, int& learningTimeout);
    bool getCards(CardStorage& storage);
    bool registerCard(const char* uid, String& cardName);
    bool sendAccessBulk(OfflineEvent* events, int count);
    
    // State
    bool isServerReachable();
    String getLastCardHash();
    
    // Offline event buffer
    void addOfflineEvent(const char* uid, const char* action);
    void flushOfflineEvents();
    int getOfflineEventCount();

private:
    String _serverUrl;
    String _deviceId;
    String _apiKey;
    String _lastCardHash;
    bool _serverReachable = false;
    
    OfflineEvent _offlineBuffer[MAX_OFFLINE_EVENTS];
    int _offlineCount = 0;
    
    bool httpGet(const String& path, JsonDocument& doc);
    bool httpPost(const String& path, const JsonDocument& body, JsonDocument& response);
    void setHeaders(HTTPClient& http);
};

#endif
