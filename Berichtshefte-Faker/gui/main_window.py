"""
Main Window Module
Primary GUI window for the Ausbildungsberichts-Generator
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import logging
import sys
from pathlib import Path
from typing import Dict, Any

from core.template_handler import TemplateHandler
from core.report_generator import ReportGenerator
from core.word_exporter import WordExporter
from gui.template_manager import TemplateManagerFrame
from gui.report_form import ReportFormFrame

logger = logging.getLogger(__name__)


class MainWindow:
    """Main application window."""
    
    def __init__(self):
        """Initialize the main window."""
        self.root = tk.Tk()
        self.root.title("Ausbildungsberichts-Generator")
        self.root.geometry("900x700")
        self.root.minsize(800, 600)
        
        # Initialize core components
        self.template_handler = TemplateHandler()
        self.report_generator = ReportGenerator()
        self.word_exporter = WordExporter()
        
        # Current state
        self.current_template = None
        
        # Configure styles
        self._configure_styles()
        
        # Create widgets
        self._create_menu()
        self._create_widgets()
        
        # Center window
        self._center_window()
        
        logger.info("Main window initialized")
    
    def _configure_styles(self):
        """Configure ttk styles."""
        style = ttk.Style()
        
        # Use a modern theme if available
        available_themes = style.theme_names()
        if 'clam' in available_themes:
            style.theme_use('clam')
        elif 'vista' in available_themes:
            style.theme_use('vista')
        
        # Configure custom styles
        style.configure('Title.TLabel', font=('Helvetica', 16, 'bold'))
        style.configure('Subtitle.TLabel', font=('Helvetica', 12))
        style.configure('Big.TButton', font=('Helvetica', 11), padding=10)
    
    def _center_window(self):
        """Center the window on screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def _create_menu(self):
        """Create the menu bar."""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Datei", menu=file_menu)
        file_menu.add_command(label="Vorlage importieren...", 
                             command=self._import_template)
        file_menu.add_command(label="Ausgabeordner öffnen...", 
                             command=self._open_output_folder)
        file_menu.add_separator()
        file_menu.add_command(label="Beenden", command=self._on_close)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Hilfe", menu=help_menu)
        help_menu.add_command(label="Anleitung", command=self._show_help)
        help_menu.add_command(label="Über", command=self._show_about)
    
    def _create_widgets(self):
        """Create main window widgets."""
        # Main container with padding
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill='both', expand=True)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill='x', pady=(0, 10))
        
        title_label = ttk.Label(header_frame, 
                                text="📝 Ausbildungsberichts-Generator",
                                style='Title.TLabel')
        title_label.pack()
        
        subtitle_label = ttk.Label(header_frame,
                                   text="Erstellen Sie Ausbildungsberichte aus Word-Vorlagen",
                                   style='Subtitle.TLabel')
        subtitle_label.pack()
        
        # Notebook (tabs)
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill='both', expand=True, pady=10)
        
        # Tab 1: Template Manager
        self.template_frame = TemplateManagerFrame(
            self.notebook, 
            self.template_handler,
            on_template_select=self._on_template_selected
        )
        self.notebook.add(self.template_frame, text="📁 Vorlagen")
        
        # Tab 2: Report Form
        self.report_frame = ReportFormFrame(
            self.notebook,
            on_generate=self._generate_report
        )
        self.notebook.add(self.report_frame, text="📝 Bericht erstellen")
        
        # Status bar
        self.status_var = tk.StringVar(value="Bereit")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, 
                              relief='sunken', anchor='w')
        status_bar.pack(fill='x', side='bottom')
    
    def _import_template(self):
        """Import a template via file dialog."""
        filetypes = [
            ('Word Dokumente', '*.docx'),
            ('Alle Dateien', '*.*')
        ]
        
        filepath = filedialog.askopenfilename(
            title="Word-Vorlage importieren",
            filetypes=filetypes
        )
        
        if filepath:
            try:
                template_name = self.template_handler.import_template(filepath)
                self.template_frame._refresh_template_list()
                self.status_var.set(f"Vorlage '{template_name}' importiert")
                messagebox.showinfo("Erfolg", 
                                   f"Vorlage '{template_name}' wurde erfolgreich importiert!")
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler beim Import:\n{str(e)}")
    
    def _open_output_folder(self):
        """Open the output folder in file explorer."""
        import subprocess
        import platform
        
        output_path = self.word_exporter.output_dir
        
        try:
            if platform.system() == 'Windows':
                subprocess.run(['explorer', str(output_path)])
            elif platform.system() == 'Darwin':
                subprocess.run(['open', str(output_path)])
            else:
                subprocess.run(['xdg-open', str(output_path)])
        except Exception as e:
            messagebox.showerror("Fehler", f"Ordner konnte nicht geöffnet werden:\n{str(e)}")
    
    def _on_template_selected(self, template_name: str):
        """Handle template selection from template manager."""
        self.current_template = template_name
        
        # Get placeholders
        placeholders = self.template_handler.extract_placeholders(template_name)
        
        # Update report form
        self.report_frame.set_template(template_name, placeholders)
        
        # Switch to report tab
        self.notebook.select(1)
        
        self.status_var.set(f"Vorlage '{template_name}' ausgewählt")
        logger.info(f"Template selected: {template_name}")
    
    def _generate_report(self, template_name: str, data: Dict[str, Any]):
        """
        Generate a report with the given data.
        
        Args:
            template_name: Name of the template to use
            data: Dictionary of form data
        """
        try:
            self.status_var.set("Generiere Bericht...")
            self.root.update()
            
            # Load template
            doc = self.template_handler.load_template(template_name)
            
            # Generate report
            report_doc = self.report_generator.generate(doc, data)
            
            # Ask for save location
            date_str = self.report_generator._format_value(data.get('datum', ''))
            default_name = f"Ausbildungsbericht_{data.get('name', '')}_{date_str}.docx"
            default_name = default_name.replace('/', '-').replace('\\', '-')
            
            filepath = filedialog.asksaveasfilename(
                title="Bericht speichern",
                defaultextension=".docx",
                filetypes=[('Word Dokument', '*.docx')],
                initialfile=default_name,
                initialdir=str(self.word_exporter.output_dir)
            )
            
            if filepath:
                # Export
                saved_path = self.word_exporter.export(report_doc, filepath=filepath)
                
                self.status_var.set(f"Bericht gespeichert: {Path(saved_path).name}")
                
                # Ask to open
                if messagebox.askyesno("Erfolg", 
                                       f"Bericht wurde erfolgreich erstellt!\n\n"
                                       f"Speicherort: {saved_path}\n\n"
                                       f"Möchten Sie den Bericht jetzt öffnen?"):
                    self.word_exporter.open_file(saved_path)
            else:
                self.status_var.set("Speichern abgebrochen")
                
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            messagebox.showerror("Fehler", f"Fehler beim Generieren des Berichts:\n{str(e)}")
            self.status_var.set("Fehler beim Generieren")
    
    def _show_help(self):
        """Show help dialog."""
        help_text = """
ANLEITUNG - Ausbildungsberichts-Generator

1. VORLAGE HOCHLADEN
   - Gehen Sie zum Tab "Vorlagen"
   - Klicken Sie auf "Vorlage hochladen"
   - Wählen Sie eine Word-Datei (.docx) aus
   - Die Vorlage sollte Platzhalter im Format {{name}} enthalten

2. VORLAGE AUSWÄHLEN
   - Wählen Sie eine Vorlage aus der Liste
   - Klicken Sie auf "Vorlage auswählen"
   - Das Programm wechselt automatisch zum Formular

3. BERICHT ERSTELLEN
   - Füllen Sie die Formularfelder aus
   - Klicken Sie auf "Bericht generieren"
   - Wählen Sie einen Speicherort

PLATZHALTER-FORMAT
Verwenden Sie in Ihren Vorlagen Platzhalter wie:
   {{name}}     - Name des Auszubildenden
   {{datum}}    - Datum des Berichts
   {{abteilung}} - Abteilung
   {{taetigkeiten}} - Beschreibung der Tätigkeiten
        """
        
        help_window = tk.Toplevel(self.root)
        help_window.title("Anleitung")
        help_window.geometry("500x500")
        help_window.transient(self.root)
        
        text = tk.Text(help_window, wrap='word', padx=10, pady=10)
        text.insert('1.0', help_text)
        text.config(state='disabled')
        text.pack(fill='both', expand=True)
        
        close_btn = ttk.Button(help_window, text="Schließen", 
                               command=help_window.destroy)
        close_btn.pack(pady=10)
    
    def _show_about(self):
        """Show about dialog."""
        messagebox.showinfo(
            "Über",
            "Ausbildungsberichts-Generator\n\n"
            "Version 1.0\n\n"
            "Eine Anwendung zur automatischen Erstellung\n"
            "von Ausbildungsberichten aus Word-Vorlagen.\n\n"
            "Technologie: Python, Tkinter, python-docx"
        )
    
    def _on_close(self):
        """Handle window close."""
        if messagebox.askyesno("Beenden", "Möchten Sie das Programm beenden?"):
            self.root.destroy()
    
    def run(self):
        """Start the main application loop."""
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)
        logger.info("Starting main loop")
        self.root.mainloop()
