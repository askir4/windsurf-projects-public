#ifndef CARD_STORAGE_H
#define CARD_STORAGE_H

#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

struct StoredCard {
    char uid[24];  // "AA:BB:CC:DD" format
    bool enabled;
};

class CardStorage {
public:
    void begin();
    bool hasCard(const char* uid);
    bool addCard(const char* uid, bool enabled = true);
    bool removeCard(const char* uid);
    void clearAll();
    void replaceAll(StoredCard* cards, int count);
    int getCount();
    StoredCard* getCards();
    
private:
    Preferences prefs;
    StoredCard cards[MAX_LOCAL_CARDS];
    int cardCount = 0;
    void save();
    void load();
};

#endif
