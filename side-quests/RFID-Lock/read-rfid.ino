//Project is for educational purposes only
//Author: Askir4
//Date: 2026-02-05
//Version: 1.0 (Development)
#include <SPI.h> //Include SPI libary for RFID communication
#include <MFRC522.h> //Include MFRC22 Libary for RFID functions
#include <Wire.h> //Include Wire libary for I2C communication
#include <LiquidCrystal.h> //Include LiquidCrystal libary for LCD display

//RFID PINS
#define SS_PIN 10 //RFID SS pin
#define RST_PIN 9 //RFID RST pin

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

LiquidCrystal_I2C lcd(0x27, 16, 2); // Set the LCD I2C address to 0x27 and the number of columns and rows

void setup() {
    Serial.begin(9600); // Start serial communication at 9600 baud
    
    //Initalize SPI and MFRC522
    SPI.begin(); // Start SPI communication
    mfrc522.PCD_Init(); // Initialize MFRC522
    
    //Initalize LCD
    lcd.init(); // Initialize LCD
    lcd.backlight(); // Turn on LCD backlight
}