#ifndef DOOR_CONTROL_H
#define DOOR_CONTROL_H

#include <Arduino.h>
#include "config.h"

class DoorControl {
public:
    void begin();
    void openDoor(unsigned long durationMs = DOOR_OPEN_DURATION_MS);
    void closeDoor();
    void update();  // Call in loop to auto-close after duration
    bool isOpen();

private:
    bool doorOpen = false;
    unsigned long openTime = 0;
    unsigned long openDuration = DOOR_OPEN_DURATION_MS;
};

#endif
