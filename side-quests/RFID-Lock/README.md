# RFID Lock

An RFID-based lock system for educational purposes.

## Disclaimer

This project is for educational purposes only and is not suitable for production use. It is based on online tutorials and examples.

## Function

The project implements an RFID lock that can lock and unlock a door using RFID cards.

## Hardware

Required components:

- Arduino (Uno or compatible)
- MFRC522 RFID Module
- I2C LCD Display (16x2)
- RFID cards/tags
- Connection wires

## Software

### Required Libraries

- SPI.h (built-in)
- MFRC522.h
- Wire.h (built-in)
- LiquidCrystal_I2C.h

### Installation

1. Install Arduino IDE
2. Install required libraries through the Library Manager
3. Upload the desired sketch

## Files

- `read-rfid.ino` - Main program for reading RFID cards with LCD display
- `rfid-lock.ino` - Placeholder file for future extensions

## Sources

Based on the following tutorials:

- [https://www.youtube.com/watch?v=tDQD2e2tLls](https://www.youtube.com/watch?v=tDQD2e2tLls)
- [https://www.youtube.com/watch?v=SqQOUuX85cI](https://www.youtube.com/watch?v=SqQOUuX85cI)

## Author

Askir4