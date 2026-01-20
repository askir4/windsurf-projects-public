"""
Template Manager Frame
GUI component for managing Word templates
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import logging
from pathlib import Path
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class TemplateManagerFrame(ttk.Frame):
    """Frame for managing Word templates - upload, view, delete."""
    
    def __init__(self, parent, template_handler, on_template_select: Optional[Callable] = None):
        """
        Initialize the template manager frame.
        
        Args:
            parent: Parent widget
            template_handler: TemplateHandler instance
            on_template_select: Callback when a template is selected
        """
        super().__init__(parent)
        self.template_handler = template_handler
        self.on_template_select = on_template_select
        self.selected_template = tk.StringVar()
        
        self._create_widgets()
        self._refresh_template_list()
    
    def _create_widgets(self):
        """Create all widgets for the template manager."""
        # Title
        title_label = ttk.Label(self, text="Vorlagen-Verwaltung", 
                                font=('Helvetica', 14, 'bold'))
        title_label.pack(pady=(0, 15))
        
        # Description
        desc_label = ttk.Label(self, 
                               text="Laden Sie Word-Vorlagen hoch und verwalten Sie diese.\n"
                                    "Vorlagen sollten Platzhalter im Format {{name}} enthalten.",
                               justify='center')
        desc_label.pack(pady=(0, 15))
        
        # Buttons frame
        btn_frame = ttk.Frame(self)
        btn_frame.pack(fill='x', pady=(0, 15))
        
        self.upload_btn = ttk.Button(btn_frame, text="📁 Vorlage hochladen", 
                                     command=self._upload_template)
        self.upload_btn.pack(side='left', padx=5)
        
        self.refresh_btn = ttk.Button(btn_frame, text="🔄 Aktualisieren", 
                                      command=self._refresh_template_list)
        self.refresh_btn.pack(side='left', padx=5)
        
        self.delete_btn = ttk.Button(btn_frame, text="🗑️ Löschen", 
                                     command=self._delete_template)
        self.delete_btn.pack(side='left', padx=5)
        
        # Templates list frame
        list_frame = ttk.LabelFrame(self, text="Verfügbare Vorlagen")
        list_frame.pack(fill='both', expand=True, pady=(0, 15))
        
        # Treeview for templates
        columns = ('name', 'placeholders', 'size')
        self.template_tree = ttk.Treeview(list_frame, columns=columns, 
                                          show='headings', height=8)
        
        self.template_tree.heading('name', text='Vorlagenname')
        self.template_tree.heading('placeholders', text='Platzhalter')
        self.template_tree.heading('size', text='Größe')
        
        self.template_tree.column('name', width=200)
        self.template_tree.column('placeholders', width=100)
        self.template_tree.column('size', width=80)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient='vertical', 
                                  command=self.template_tree.yview)
        self.template_tree.configure(yscrollcommand=scrollbar.set)
        
        self.template_tree.pack(side='left', fill='both', expand=True, padx=(5, 0), pady=5)
        scrollbar.pack(side='right', fill='y', pady=5, padx=(0, 5))
        
        # Bind selection event
        self.template_tree.bind('<<TreeviewSelect>>', self._on_tree_select)
        self.template_tree.bind('<Double-1>', self._on_double_click)
        
        # Info frame for selected template
        self.info_frame = ttk.LabelFrame(self, text="Vorlageninformationen")
        self.info_frame.pack(fill='x', pady=(0, 10))
        
        self.info_text = tk.Text(self.info_frame, height=6, wrap='word', 
                                 state='disabled', font=('Courier', 9))
        self.info_text.pack(fill='x', padx=5, pady=5)
        
        # Select button
        self.select_btn = ttk.Button(self, text="✓ Vorlage auswählen", 
                                     command=self._select_template, state='disabled')
        self.select_btn.pack(pady=5)
    
    def _upload_template(self):
        """Open file dialog to upload a new template."""
        filetypes = [
            ('Word Dokumente', '*.docx'),
            ('Alle Dateien', '*.*')
        ]
        
        filepath = filedialog.askopenfilename(
            title="Word-Vorlage auswählen",
            filetypes=filetypes
        )
        
        if filepath:
            try:
                template_name = self.template_handler.import_template(filepath)
                self._refresh_template_list()
                messagebox.showinfo("Erfolg", 
                                    f"Vorlage '{template_name}' wurde erfolgreich hochgeladen!")
                logger.info(f"Template uploaded: {template_name}")
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler beim Hochladen:\n{str(e)}")
                logger.error(f"Failed to upload template: {e}")
    
    def _refresh_template_list(self):
        """Refresh the list of available templates."""
        # Clear existing items
        for item in self.template_tree.get_children():
            self.template_tree.delete(item)
        
        # Load templates
        templates = self.template_handler.list_templates()
        
        for template_name in templates:
            try:
                info = self.template_handler.get_template_info(template_name)
                size_kb = info['size_bytes'] / 1024
                size_str = f"{size_kb:.1f} KB"
                placeholder_count = info['placeholder_count']
                
                self.template_tree.insert('', 'end', values=(
                    template_name,
                    f"{placeholder_count} Platzhalter",
                    size_str
                ))
            except Exception as e:
                logger.error(f"Error loading template info for {template_name}: {e}")
                self.template_tree.insert('', 'end', values=(
                    template_name,
                    "Fehler",
                    "?"
                ))
        
        # Clear info
        self._update_info_text("")
        self.select_btn.config(state='disabled')
    
    def _delete_template(self):
        """Delete the selected template."""
        selection = self.template_tree.selection()
        if not selection:
            messagebox.showwarning("Warnung", "Bitte wählen Sie eine Vorlage aus.")
            return
        
        item = selection[0]
        template_name = self.template_tree.item(item)['values'][0]
        
        if messagebox.askyesno("Bestätigung", 
                               f"Möchten Sie die Vorlage '{template_name}' wirklich löschen?"):
            try:
                self.template_handler.delete_template(template_name)
                self._refresh_template_list()
                messagebox.showinfo("Erfolg", f"Vorlage '{template_name}' wurde gelöscht.")
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler beim Löschen:\n{str(e)}")
    
    def _on_tree_select(self, event):
        """Handle template selection in treeview."""
        selection = self.template_tree.selection()
        if selection:
            item = selection[0]
            template_name = self.template_tree.item(item)['values'][0]
            self._show_template_info(template_name)
            self.select_btn.config(state='normal')
        else:
            self._update_info_text("")
            self.select_btn.config(state='disabled')
    
    def _on_double_click(self, event):
        """Handle double-click on template (select it)."""
        self._select_template()
    
    def _show_template_info(self, template_name: str):
        """Show detailed information about a template."""
        try:
            info = self.template_handler.get_template_info(template_name)
            
            text = f"Vorlage: {info['name']}\n"
            text += f"Größe: {info['size_bytes'] / 1024:.1f} KB\n"
            text += f"Anzahl Platzhalter: {info['placeholder_count']}\n\n"
            text += f"Platzhalter:\n"
            
            for placeholder in info['placeholders']:
                text += f"  • {{{{{placeholder}}}}}\n"
            
            self._update_info_text(text)
            self.selected_template.set(template_name)
            
        except Exception as e:
            self._update_info_text(f"Fehler beim Laden der Informationen:\n{str(e)}")
    
    def _update_info_text(self, text: str):
        """Update the info text widget."""
        self.info_text.config(state='normal')
        self.info_text.delete('1.0', 'end')
        self.info_text.insert('1.0', text)
        self.info_text.config(state='disabled')
    
    def _select_template(self):
        """Select the current template and notify via callback."""
        selection = self.template_tree.selection()
        if not selection:
            return
        
        item = selection[0]
        template_name = self.template_tree.item(item)['values'][0]
        self.selected_template.set(template_name)
        
        if self.on_template_select:
            self.on_template_select(template_name)
        
        logger.info(f"Template selected: {template_name}")
    
    def get_selected_template(self) -> Optional[str]:
        """Get the currently selected template name."""
        template = self.selected_template.get()
        return template if template else None
