#include "card_storage.h"

void CardStorage::begin() {
    prefs.begin("rfid-cards", false);
    load();
}

void CardStorage::load() {
    cardCount = prefs.getInt("count", 0);
    if (cardCount > MAX_LOCAL_CARDS) cardCount = MAX_LOCAL_CARDS;
    
    for (int i = 0; i < cardCount; i++) {
        String key = "uid_" + String(i);
        String enabledKey = "en_" + String(i);
        String uid = prefs.getString(key.c_str(), "");
        bool enabled = prefs.getBool(enabledKey.c_str(), true);
        
        strncpy(cards[i].uid, uid.c_str(), sizeof(cards[i].uid) - 1);
        cards[i].uid[sizeof(cards[i].uid) - 1] = '\0';
        cards[i].enabled = enabled;
    }
}

void CardStorage::save() {
    prefs.putInt("count", cardCount);
    for (int i = 0; i < cardCount; i++) {
        String key = "uid_" + String(i);
        String enabledKey = "en_" + String(i);
        prefs.putString(key.c_str(), cards[i].uid);
        prefs.putBool(enabledKey.c_str(), cards[i].enabled);
    }
    // Clean up old entries beyond current count
    for (int i = cardCount; i < MAX_LOCAL_CARDS; i++) {
        String key = "uid_" + String(i);
        String enabledKey = "en_" + String(i);
        prefs.remove(key.c_str());
        prefs.remove(enabledKey.c_str());
    }
}

bool CardStorage::hasCard(const char* uid) {
    for (int i = 0; i < cardCount; i++) {
        if (strcmp(cards[i].uid, uid) == 0 && cards[i].enabled) {
            return true;
        }
    }
    return false;
}

bool CardStorage::addCard(const char* uid, bool enabled) {
    // Check if already exists
    for (int i = 0; i < cardCount; i++) {
        if (strcmp(cards[i].uid, uid) == 0) {
            cards[i].enabled = enabled;
            save();
            return true;
        }
    }
    
    if (cardCount >= MAX_LOCAL_CARDS) {
        // Evict oldest unused card (last in list)
        cardCount = MAX_LOCAL_CARDS - 1;
    }
    
    strncpy(cards[cardCount].uid, uid, sizeof(cards[cardCount].uid) - 1);
    cards[cardCount].uid[sizeof(cards[cardCount].uid) - 1] = '\0';
    cards[cardCount].enabled = enabled;
    cardCount++;
    save();
    return true;
}

bool CardStorage::removeCard(const char* uid) {
    for (int i = 0; i < cardCount; i++) {
        if (strcmp(cards[i].uid, uid) == 0) {
            // Shift remaining cards
            for (int j = i; j < cardCount - 1; j++) {
                cards[j] = cards[j + 1];
            }
            cardCount--;
            save();
            return true;
        }
    }
    return false;
}

void CardStorage::clearAll() {
    cardCount = 0;
    save();
}

void CardStorage::replaceAll(StoredCard* newCards, int count) {
    cardCount = min(count, MAX_LOCAL_CARDS);
    for (int i = 0; i < cardCount; i++) {
        cards[i] = newCards[i];
    }
    save();
}

int CardStorage::getCount() {
    return cardCount;
}

StoredCard* CardStorage::getCards() {
    return cards;
}
