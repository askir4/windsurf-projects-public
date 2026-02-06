#ifndef LED_BUZZER_H
#define LED_BUZZER_H

#include <Arduino.h>
#include "config.h"

class LedBuzzer {
public:
    void begin();
    void accessGranted();
    void accessDenied();
    void learningMode();
    void learningModeOff();
    void cardRegistered();
    void allOff();
    void update();  // Call in loop for blinking effects

private:
    bool blinking = false;
    unsigned long lastBlinkTime = 0;
    bool blinkState = false;
    int blinkPin = -1;
    unsigned long blinkInterval = 500;
};

#endif
