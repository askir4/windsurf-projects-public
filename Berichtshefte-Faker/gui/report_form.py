"""
Report Form Frame
GUI component for entering report data and generating reports
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkcalendar import DateEntry
import logging
from datetime import date, datetime
from typing import Dict, Any, Optional, Set, Callable

logger = logging.getLogger(__name__)


class ReportFormFrame(ttk.Frame):
    """Frame for entering report data based on template placeholders."""
    
    # Map placeholder names to German labels
    PLACEHOLDER_LABELS = {
        'name': 'Name',
        'vorname': 'Vorname',
        'nachname': 'Nachname',
        'datum': 'Datum',
        'datum_von': 'Datum von',
        'datum_bis': 'Datum bis',
        'woche': 'Kalenderwoche',
        'jahr': 'Jahr',
        'abteilung': 'Abteilung',
        'ausbilder': 'Ausbilder/in',
        'betrieb': 'Ausbildungsbetrieb',
        'beruf': 'Ausbildungsberuf',
        'ausbildungsjahr': 'Ausbildungsjahr',
        'taetigkeiten': 'Tätigkeiten',
        'betriebliche_taetigkeiten': 'Betriebliche Tätigkeiten',
        'unterweisungen': 'Unterweisungen/Schulungen',
        'berufsschule': 'Berufsschule',
        'stunden': 'Gesamtstunden',
        'stunden_betrieb': 'Stunden Betrieb',
        'stunden_schule': 'Stunden Berufsschule',
        'unterschrift_azubi': 'Unterschrift Auszubildende/r',
        'unterschrift_ausbilder': 'Unterschrift Ausbilder/in',
        'bemerkungen': 'Bemerkungen'
    }
    
    # Placeholders that should use date picker
    DATE_PLACEHOLDERS = {'datum', 'datum_von', 'datum_bis'}
    
    # Placeholders that should use multiline text
    MULTILINE_PLACEHOLDERS = {'taetigkeiten', 'betriebliche_taetigkeiten', 
                               'unterweisungen', 'berufsschule', 'bemerkungen'}
    
    # Placeholders that should use number input
    NUMBER_PLACEHOLDERS = {'woche', 'jahr', 'ausbildungsjahr', 'stunden', 
                           'stunden_betrieb', 'stunden_schule'}
    
    def __init__(self, parent, on_generate: Optional[Callable] = None):
        """
        Initialize the report form frame.
        
        Args:
            parent: Parent widget
            on_generate: Callback when generate is clicked, receives data dict
        """
        super().__init__(parent)
        self.on_generate = on_generate
        self.current_template = None
        self.placeholders: Set[str] = set()
        self.form_widgets: Dict[str, Any] = {}
        
        self._create_widgets()
    
    def _create_widgets(self):
        """Create the main structure widgets."""
        # Title
        title_label = ttk.Label(self, text="Bericht erstellen", 
                                font=('Helvetica', 14, 'bold'))
        title_label.pack(pady=(0, 10))
        
        # Template info
        self.template_info_var = tk.StringVar(value="Keine Vorlage ausgewählt")
        template_label = ttk.Label(self, textvariable=self.template_info_var,
                                   foreground='gray')
        template_label.pack(pady=(0, 15))
        
        # Scrollable form area
        self.canvas = tk.Canvas(self, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self, orient='vertical', 
                                        command=self.canvas.yview)
        self.form_frame = ttk.Frame(self.canvas)
        
        self.canvas_frame = self.canvas.create_window((0, 0), window=self.form_frame, 
                                                       anchor='nw')
        
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        # Pack scrollable area
        self.scrollbar.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        
        # Configure scroll region on resize
        self.form_frame.bind('<Configure>', self._on_frame_configure)
        self.canvas.bind('<Configure>', self._on_canvas_configure)
        
        # Mouse wheel scrolling
        self.canvas.bind_all('<MouseWheel>', self._on_mousewheel)
        self.canvas.bind_all('<Button-4>', self._on_mousewheel)
        self.canvas.bind_all('<Button-5>', self._on_mousewheel)
        
        # Placeholder message
        self.placeholder_label = ttk.Label(self.form_frame, 
                                           text="Bitte wählen Sie zuerst eine Vorlage aus.",
                                           font=('Helvetica', 11))
        self.placeholder_label.pack(pady=50)
        
        # Generate button frame (outside scrollable area - will be added later)
        self.btn_frame = ttk.Frame(self)
        
        self.generate_btn = ttk.Button(self.btn_frame, text="📄 Bericht generieren", 
                                       command=self._on_generate_click, state='disabled')
        self.generate_btn.pack(side='left', padx=5, pady=10)
        
        self.clear_btn = ttk.Button(self.btn_frame, text="🗑️ Formular leeren", 
                                    command=self._clear_form, state='disabled')
        self.clear_btn.pack(side='left', padx=5, pady=10)
    
    def _on_frame_configure(self, event):
        """Update scroll region when form frame changes."""
        self.canvas.configure(scrollregion=self.canvas.bbox('all'))
    
    def _on_canvas_configure(self, event):
        """Resize form frame to match canvas width."""
        self.canvas.itemconfig(self.canvas_frame, width=event.width - 20)
    
    def _on_mousewheel(self, event):
        """Handle mouse wheel scrolling."""
        if event.num == 5 or event.delta < 0:
            self.canvas.yview_scroll(1, 'units')
        elif event.num == 4 or event.delta > 0:
            self.canvas.yview_scroll(-1, 'units')
    
    def set_template(self, template_name: str, placeholders: Set[str]):
        """
        Set the current template and update the form.
        
        Args:
            template_name: Name of the selected template
            placeholders: Set of placeholder names
        """
        self.current_template = template_name
        self.placeholders = placeholders
        self.template_info_var.set(f"Vorlage: {template_name}")
        
        self._build_form()
        
        self.generate_btn.config(state='normal')
        self.clear_btn.config(state='normal')
        
        # Show button frame
        self.btn_frame.pack(side='bottom', fill='x')
        
        logger.info(f"Form updated for template: {template_name} with {len(placeholders)} fields")
    
    def _build_form(self):
        """Build the form based on placeholders."""
        # Clear existing form
        for widget in self.form_frame.winfo_children():
            widget.destroy()
        self.form_widgets.clear()
        
        if not self.placeholders:
            label = ttk.Label(self.form_frame, 
                             text="Diese Vorlage enthält keine Platzhalter.",
                             font=('Helvetica', 11))
            label.pack(pady=50)
            return
        
        # Sort placeholders for consistent order
        sorted_placeholders = sorted(self.placeholders, 
                                     key=lambda x: (x not in self.PLACEHOLDER_LABELS, x))
        
        # Create form fields
        for placeholder in sorted_placeholders:
            self._create_field(placeholder)
    
    def _create_field(self, placeholder: str):
        """Create a form field for a placeholder."""
        # Frame for the field
        field_frame = ttk.Frame(self.form_frame)
        field_frame.pack(fill='x', pady=5, padx=10)
        
        # Label
        label_text = self.PLACEHOLDER_LABELS.get(placeholder, placeholder.replace('_', ' ').title())
        label = ttk.Label(field_frame, text=f"{label_text}:", width=25, anchor='e')
        label.pack(side='left', padx=(0, 10))
        
        # Input widget based on placeholder type
        if placeholder in self.DATE_PLACEHOLDERS:
            widget = DateEntry(field_frame, width=20, date_pattern='dd.mm.yyyy',
                              locale='de_DE')
            widget.set_date(date.today())
            widget.pack(side='left', fill='x', expand=True)
            
        elif placeholder in self.MULTILINE_PLACEHOLDERS:
            text_frame = ttk.Frame(field_frame)
            text_frame.pack(side='left', fill='x', expand=True)
            
            widget = tk.Text(text_frame, height=4, width=40, wrap='word')
            scrollbar = ttk.Scrollbar(text_frame, orient='vertical', 
                                      command=widget.yview)
            widget.configure(yscrollcommand=scrollbar.set)
            
            widget.pack(side='left', fill='x', expand=True)
            scrollbar.pack(side='right', fill='y')
            
        elif placeholder in self.NUMBER_PLACEHOLDERS:
            widget = ttk.Spinbox(field_frame, from_=0, to=9999, width=10)
            # Set default values
            if placeholder == 'woche':
                widget.set(date.today().isocalendar()[1])
            elif placeholder == 'jahr':
                widget.set(date.today().year)
            elif placeholder == 'ausbildungsjahr':
                widget.set(1)
            elif placeholder in ('stunden', 'stunden_betrieb'):
                widget.set(40)
            else:
                widget.set(0)
            widget.pack(side='left')
            
        else:
            widget = ttk.Entry(field_frame, width=40)
            widget.pack(side='left', fill='x', expand=True)
        
        self.form_widgets[placeholder] = widget
    
    def get_data(self) -> Dict[str, Any]:
        """
        Get all form data as a dictionary.
        
        Returns:
            Dictionary mapping placeholder names to values
        """
        data = {}
        
        for placeholder, widget in self.form_widgets.items():
            if placeholder in self.DATE_PLACEHOLDERS:
                # DateEntry returns date object
                data[placeholder] = widget.get_date()
                
            elif placeholder in self.MULTILINE_PLACEHOLDERS:
                # Text widget
                data[placeholder] = widget.get('1.0', 'end-1c')
                
            elif placeholder in self.NUMBER_PLACEHOLDERS:
                # Spinbox - convert to int
                try:
                    data[placeholder] = int(widget.get())
                except ValueError:
                    data[placeholder] = 0
                    
            else:
                # Entry widget
                data[placeholder] = widget.get()
        
        return data
    
    def set_data(self, data: Dict[str, Any]):
        """
        Set form data from a dictionary.
        
        Args:
            data: Dictionary mapping placeholder names to values
        """
        for placeholder, value in data.items():
            if placeholder not in self.form_widgets:
                continue
            
            widget = self.form_widgets[placeholder]
            
            if placeholder in self.DATE_PLACEHOLDERS:
                if isinstance(value, (date, datetime)):
                    widget.set_date(value)
                    
            elif placeholder in self.MULTILINE_PLACEHOLDERS:
                widget.delete('1.0', 'end')
                widget.insert('1.0', str(value))
                
            elif placeholder in self.NUMBER_PLACEHOLDERS:
                widget.set(value)
                
            else:
                widget.delete(0, 'end')
                widget.insert(0, str(value))
    
    def _clear_form(self):
        """Clear all form fields."""
        for placeholder, widget in self.form_widgets.items():
            if placeholder in self.DATE_PLACEHOLDERS:
                widget.set_date(date.today())
                
            elif placeholder in self.MULTILINE_PLACEHOLDERS:
                widget.delete('1.0', 'end')
                
            elif placeholder in self.NUMBER_PLACEHOLDERS:
                if placeholder == 'woche':
                    widget.set(date.today().isocalendar()[1])
                elif placeholder == 'jahr':
                    widget.set(date.today().year)
                elif placeholder == 'ausbildungsjahr':
                    widget.set(1)
                elif placeholder in ('stunden', 'stunden_betrieb'):
                    widget.set(40)
                else:
                    widget.set(0)
                    
            else:
                widget.delete(0, 'end')
        
        logger.info("Form cleared")
    
    def _validate_form(self) -> bool:
        """
        Validate that required fields are filled.
        
        Returns:
            True if form is valid
        """
        data = self.get_data()
        empty_fields = []
        
        for placeholder, value in data.items():
            if isinstance(value, str) and not value.strip():
                label = self.PLACEHOLDER_LABELS.get(placeholder, placeholder)
                empty_fields.append(label)
        
        if empty_fields:
            # Show warning but don't prevent generation
            if len(empty_fields) <= 5:
                fields_str = ", ".join(empty_fields)
            else:
                fields_str = ", ".join(empty_fields[:5]) + f" und {len(empty_fields)-5} weitere"
            
            result = messagebox.askyesno(
                "Leere Felder",
                f"Folgende Felder sind leer:\n{fields_str}\n\nTrotzdem fortfahren?"
            )
            return result
        
        return True
    
    def _on_generate_click(self):
        """Handle generate button click."""
        if not self.current_template:
            messagebox.showwarning("Warnung", "Bitte wählen Sie zuerst eine Vorlage aus.")
            return
        
        if not self._validate_form():
            return
        
        data = self.get_data()
        
        if self.on_generate:
            self.on_generate(self.current_template, data)
