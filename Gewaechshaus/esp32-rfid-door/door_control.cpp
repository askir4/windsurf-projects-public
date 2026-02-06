#include "door_control.h"

void DoorControl::begin() {
    pinMode(RELAY_PIN, OUTPUT);
    closeDoor();
}

void DoorControl::openDoor(unsigned long durationMs) {
    doorOpen = true;
    openTime = millis();
    openDuration = durationMs;
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("[DOOR] Tuer geoeffnet");
}

void DoorControl::closeDoor() {
    doorOpen = false;
    digitalWrite(RELAY_PIN, LOW);
}

void DoorControl::update() {
    if (doorOpen && (millis() - openTime >= openDuration)) {
        closeDoor();
        Serial.println("[DOOR] Tuer geschlossen (Timeout)");
    }
}

bool DoorControl::isOpen() {
    return doorOpen;
}
