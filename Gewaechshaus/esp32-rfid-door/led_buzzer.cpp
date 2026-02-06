#include "led_buzzer.h"

void LedBuzzer::begin() {
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_BLUE_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    allOff();
}

void LedBuzzer::accessGranted() {
    blinking = false;
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_BLUE_PIN, LOW);
    // Short beep
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
}

void LedBuzzer::accessDenied() {
    blinking = false;
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(LED_BLUE_PIN, LOW);
    // Long beep
    digitalWrite(BUZZER_PIN, HIGH);
    delay(500);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
    // Blink red 3 times
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_RED_PIN, LOW);
        delay(150);
        digitalWrite(LED_RED_PIN, HIGH);
        delay(150);
    }
}

void LedBuzzer::learningMode() {
    blinking = true;
    blinkPin = LED_BLUE_PIN;
    blinkInterval = 500;
    blinkState = false;
    lastBlinkTime = millis();
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
}

void LedBuzzer::learningModeOff() {
    blinking = false;
    allOff();
}

void LedBuzzer::cardRegistered() {
    blinking = false;
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_BLUE_PIN, HIGH);
    // Two short beeps
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
}

void LedBuzzer::allOff() {
    blinking = false;
    digitalWrite(LED_GREEN_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_BLUE_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
}

void LedBuzzer::update() {
    if (!blinking || blinkPin < 0) return;
    
    unsigned long now = millis();
    if (now - lastBlinkTime >= blinkInterval) {
        lastBlinkTime = now;
        blinkState = !blinkState;
        digitalWrite(blinkPin, blinkState ? HIGH : LOW);
    }
}
