"""
Word Exporter Module
Handles exporting generated reports as Word documents
"""

import os
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime
from docx import Document

logger = logging.getLogger(__name__)


class WordExporter:
    """Exports Document objects to Word files."""
    
    def __init__(self, output_dir: str = "output"):
        """
        Initialize the Word exporter.
        
        Args:
            output_dir: Default directory for saving exported documents
        """
        self.output_dir = Path(output_dir)
        self._ensure_output_dir()
    
    def _ensure_output_dir(self) -> None:
        """Create output directory if it doesn't exist."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Output directory ensured at: {self.output_dir}")
    
    def _generate_filename(self, prefix: str = "Ausbildungsbericht", 
                           suffix: str = "") -> str:
        """
        Generate a unique filename based on timestamp.
        
        Args:
            prefix: Filename prefix
            suffix: Optional suffix before extension
            
        Returns:
            Generated filename with .docx extension
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if suffix:
            filename = f"{prefix}_{suffix}_{timestamp}.docx"
        else:
            filename = f"{prefix}_{timestamp}.docx"
        return filename
    
    def export(self, document: Document, 
               filepath: Optional[str] = None,
               filename: Optional[str] = None,
               prefix: str = "Ausbildungsbericht",
               suffix: str = "") -> str:
        """
        Export a Document to a Word file.
        
        Args:
            document: The Document object to export
            filepath: Full path for the output file (overrides other options)
            filename: Filename for the output (saved in output_dir)
            prefix: Prefix for auto-generated filename
            suffix: Suffix for auto-generated filename
            
        Returns:
            Full path to the saved file
            
        Raises:
            IOError: If the file cannot be saved
        """
        if filepath:
            save_path = Path(filepath)
            # Ensure parent directory exists
            save_path.parent.mkdir(parents=True, exist_ok=True)
        elif filename:
            if not filename.endswith('.docx'):
                filename += '.docx'
            save_path = self.output_dir / filename
        else:
            filename = self._generate_filename(prefix, suffix)
            save_path = self.output_dir / filename
        
        try:
            document.save(str(save_path))
            logger.info(f"Document exported to: {save_path}")
            return str(save_path)
        except Exception as e:
            logger.error(f"Failed to export document: {e}")
            raise IOError(f"Failed to save document to {save_path}: {e}")
    
    def get_output_files(self) -> list:
        """
        List all exported files in the output directory.
        
        Returns:
            List of filenames in the output directory
        """
        files = [f.name for f in self.output_dir.glob("*.docx") if f.is_file()]
        files.sort(reverse=True)  # Most recent first
        return files
    
    def get_output_path(self, filename: str) -> Path:
        """
        Get full path to an output file.
        
        Args:
            filename: Name of the output file
            
        Returns:
            Full path to the file
        """
        return self.output_dir / filename
    
    def delete_output(self, filename: str) -> bool:
        """
        Delete an output file.
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            True if deletion was successful
        """
        filepath = self.output_dir / filename
        if filepath.exists():
            filepath.unlink()
            logger.info(f"Output file deleted: {filename}")
            return True
        return False
    
    def open_file(self, filepath: str) -> None:
        """
        Open a file with the system's default application.
        
        Args:
            filepath: Path to the file to open
        """
        import subprocess
        import platform
        
        filepath = str(filepath)
        
        try:
            if platform.system() == 'Windows':
                os.startfile(filepath)
            elif platform.system() == 'Darwin':  # macOS
                subprocess.run(['open', filepath], check=True)
            else:  # Linux
                subprocess.run(['xdg-open', filepath], check=True)
            logger.info(f"Opened file: {filepath}")
        except Exception as e:
            logger.error(f"Failed to open file: {e}")
            raise
