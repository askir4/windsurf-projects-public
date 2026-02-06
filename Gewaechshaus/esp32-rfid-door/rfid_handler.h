#ifndef RFID_HANDLER_H
#define RFID_HANDLER_H

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include "config.h"

class RfidHandler {
public:
    void begin();
    bool cardPresent();
    String readCardUid();

private:
    MFRC522 mfrc522 = MFRC522(SS_PIN, RST_PIN);
    String formatUid(byte* uid, byte size);
};

#endif
