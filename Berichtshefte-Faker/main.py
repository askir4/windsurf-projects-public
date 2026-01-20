#!/usr/bin/env python3
"""
Ausbildungsberichts-Generator
=============================
Desktop application for automatic generation of training reports from Word templates.

Author: Generated with AI assistance
Version: 1.0
"""

import sys
import logging
from pathlib import Path

# Ensure the application directory is in the Python path
APP_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(APP_DIR))


def setup_logging():
    """Configure application logging."""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Create logs directory if it doesn't exist
    log_dir = APP_DIR / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.FileHandler(log_dir / 'app.log', encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info("Logging initialized")
    return logger


def check_dependencies():
    """Check if all required dependencies are installed."""
    missing = []
    
    try:
        import docx
    except ImportError:
        missing.append('python-docx')
    
    try:
        import tkcalendar
    except ImportError:
        missing.append('tkcalendar')
    
    if missing:
        print("=" * 50)
        print("FEHLENDE ABHÄNGIGKEITEN")
        print("=" * 50)
        print(f"\nBitte installieren Sie die folgenden Pakete:\n")
        print(f"  pip install {' '.join(missing)}")
        print("\nOder alle Abhängigkeiten auf einmal:")
        print(f"  pip install -r requirements.txt")
        print("=" * 50)
        return False
    
    return True


def ensure_directories():
    """Ensure required directories exist."""
    dirs = ['templates', 'output', 'assets', 'logs']
    
    for dir_name in dirs:
        dir_path = APP_DIR / dir_name
        dir_path.mkdir(exist_ok=True)


def main():
    """Main entry point for the application."""
    # Setup
    logger = setup_logging()
    logger.info("Starting Ausbildungsberichts-Generator")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Ensure directories exist
    ensure_directories()
    
    # Import and run GUI
    try:
        from gui.main_window import MainWindow
        
        app = MainWindow()
        app.run()
        
    except Exception as e:
        logger.exception(f"Application error: {e}")
        
        # Show error dialog if possible
        try:
            import tkinter as tk
            from tkinter import messagebox
            
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror(
                "Fehler",
                f"Ein Fehler ist aufgetreten:\n\n{str(e)}\n\n"
                f"Bitte überprüfen Sie die Log-Datei für Details."
            )
            root.destroy()
        except:
            pass
        
        sys.exit(1)
    
    logger.info("Application closed normally")


if __name__ == "__main__":
    main()
