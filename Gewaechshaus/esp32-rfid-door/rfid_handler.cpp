#include "rfid_handler.h"

void RfidHandler::begin() {
    SPI.begin();
    mfrc522.PCD_Init();
    delay(4);
    Serial.print("[RFID] Reader: ");
    mfrc522.PCD_DumpVersionToSerial();
}

bool RfidHandler::cardPresent() {
    return mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial();
}

String RfidHandler::readCardUid() {
    String uid = formatUid(mfrc522.uid.uidByte, mfrc522.uid.size);
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return uid;
}

String RfidHandler::formatUid(byte* uid, byte size) {
    String result = "";
    for (byte i = 0; i < size; i++) {
        if (i > 0) result += ":";
        if (uid[i] < 0x10) result += "0";
        result += String(uid[i], HEX);
    }
    result.toUpperCase();
    return result;
}
