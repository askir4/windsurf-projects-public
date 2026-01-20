# Ausbildungsberichts-Generator 📝

Eine Desktop-Anwendung zur automatischen Erstellung von Ausbildungsberichten aus Word-Vorlagen.

## Features

- ✅ **Vorlagen-Management**: Word-Vorlagen (.docx) hochladen und verwalten
- ✅ **Automatische Platzhalter-Erkennung**: Erkennt `{{platzhalter}}` in Vorlagen
- ✅ **Dynamisches Formular**: Eingabefelder basierend auf Vorlage
- ✅ **Word-Export**: Generierte Berichte als .docx speichern
- ✅ **Benutzerfreundliche GUI**: Intuitive grafische Oberfläche

## Installation

### Voraussetzungen

- Python 3.10 oder höher
- pip (Python Package Manager)

### Abhängigkeiten installieren

```bash
# In das Projektverzeichnis wechseln
cd Berichtshefte-Faker

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### Anwendung starten

```bash
python main.py
```

## Verwendung

### 1. Vorlage erstellen

Erstellen Sie eine Word-Vorlage (.docx) mit Platzhaltern im Format `{{platzhalter_name}}`.

**Beispiel-Platzhalter:**
- `{{name}}` - Name des Auszubildenden
- `{{vorname}}` - Vorname
- `{{nachname}}` - Nachname
- `{{datum}}` - Berichtsdatum
- `{{datum_von}}` - Zeitraum Beginn
- `{{datum_bis}}` - Zeitraum Ende
- `{{woche}}` - Kalenderwoche
- `{{jahr}}` - Jahr
- `{{abteilung}}` - Abteilung
- `{{ausbilder}}` - Name des Ausbilders
- `{{betrieb}}` - Ausbildungsbetrieb
- `{{beruf}}` - Ausbildungsberuf
- `{{ausbildungsjahr}}` - Ausbildungsjahr (1, 2, 3, etc.)
- `{{taetigkeiten}}` - Tätigkeitsbeschreibung
- `{{betriebliche_taetigkeiten}}` - Betriebliche Tätigkeiten
- `{{unterweisungen}}` - Unterweisungen/Schulungen
- `{{berufsschule}}` - Berufsschulunterricht
- `{{stunden}}` - Gesamtstunden
- `{{stunden_betrieb}}` - Arbeitsstunden Betrieb
- `{{stunden_schule}}` - Stunden Berufsschule
- `{{bemerkungen}}` - Bemerkungen

### 2. Vorlage hochladen

1. Öffnen Sie die Anwendung
2. Gehen Sie zum Tab "Vorlagen"
3. Klicken Sie auf "Vorlage hochladen"
4. Wählen Sie Ihre Word-Datei aus

### 3. Bericht erstellen

1. Wählen Sie eine Vorlage aus der Liste
2. Klicken Sie auf "Vorlage auswählen"
3. Füllen Sie das Formular aus
4. Klicken Sie auf "Bericht generieren"
5. Wählen Sie einen Speicherort

## Projektstruktur

```
Berichtshefte-Faker/
├── main.py                 # Hauptprogramm (Einstiegspunkt)
├── gui/
│   ├── __init__.py
│   ├── main_window.py      # Hauptfenster
│   ├── template_manager.py # Vorlagen-Verwaltung
│   └── report_form.py      # Eingabeformular
├── core/
│   ├── __init__.py
│   ├── template_handler.py # Vorlagen laden/speichern
│   ├── report_generator.py # Berichts-Generierung
│   └── word_exporter.py    # Word-Export
├── templates/              # Gespeicherte Vorlagen
├── output/                 # Generierte Berichte
├── assets/                 # Icons, Bilder
├── logs/                   # Log-Dateien
├── requirements.txt        # Python Abhängigkeiten
└── README.md               # Diese Datei
```

## Technologie

- **Python 3.10+**: Programmiersprache
- **Tkinter**: GUI Framework
- **python-docx**: Word-Dokument Verarbeitung
- **tkcalendar**: Datums-Auswahl Widget

## Executable erstellen (optional)

Mit PyInstaller können Sie eine ausführbare Datei erstellen:

```bash
# PyInstaller installieren (falls nicht vorhanden)
pip install pyinstaller

# Executable erstellen
pyinstaller --onefile --windowed --name "AusbildungsberichtGenerator" main.py
```

Die fertige .exe finden Sie im `dist/` Ordner.

## Fehlerbehebung

### "ModuleNotFoundError: No module named 'docx'"
```bash
pip install python-docx
```

### "ModuleNotFoundError: No module named 'tkcalendar'"
```bash
pip install tkcalendar
```

### Platzhalter werden nicht ersetzt
- Stellen Sie sicher, dass die Platzhalter exakt im Format `{{name}}` geschrieben sind
- Prüfen Sie, dass keine Formatierung die Platzhalter unterbricht (z.B. `{{na`**`me`**`}}`)

## Lizenz

Dieses Projekt ist für private und Ausbildungszwecke gedacht.

---

Erstellt im Januar 2026 | Python 3.10+ | Tkinter
