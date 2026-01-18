// Color Manager - Handles global color scheme customization
class ColorManager {
    constructor() {
        this.defaultColors = {
            primary: '#3498db',
            primaryHover: '#2980b9',
            secondary: '#6b7280',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c',
            bgGradientStart: '#667eea',
            bgGradientEnd: '#764ba2',
            bgSurface: 'rgba(255, 255, 255, 0.92)',
            bgSurfaceStrong: 'rgba(255, 255, 255, 0.96)',
            text: '#1f2937',
            textMuted: '#6b7280',
            border: 'rgba(17, 24, 39, 0.12)',
            headerBg: 'rgba(255, 255, 255, 0.96)',
            cardBg: 'rgba(255, 255, 255, 0.92)'
        };
        this.currentColors = { ...this.defaultColors };
        this.colorInputMap = {
            primary: 'colorPrimary',
            primaryHover: 'colorPrimaryHover',
            secondary: 'colorSecondary',
            success: 'colorSuccess',
            warning: 'colorWarning',
            danger: 'colorDanger',
            bgGradientStart: 'colorBgStart',
            bgGradientEnd: 'colorBgEnd',
            text: 'colorText',
            textMuted: 'colorTextMuted'
        };
    }

    async init() {
        await this.loadColorsFromServer();
        this.applyColors(this.currentColors);
        this.setupEventListeners();
    }

    async loadColorsFromServer() {
        try {
            const res = await fetch('/api/colors');
            if (res.ok) {
                const colors = await res.json();
                this.currentColors = { ...this.defaultColors, ...colors };
                this.updateColorInputs();
            }
        } catch (e) {
            console.warn('Could not load colors from server:', e);
        }
    }

    applyColors(colors) {
        const root = document.documentElement;
        
        // Apply CSS variables
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--primary-600', colors.primaryHover);
        root.style.setProperty('--secondary', colors.secondary);
        root.style.setProperty('--success', colors.success);
        root.style.setProperty('--warning', colors.warning);
        root.style.setProperty('--danger', colors.danger);
        root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 100%)`);
        root.style.setProperty('--bg-surface', colors.bgSurface);
        root.style.setProperty('--bg-surface-strong', colors.bgSurfaceStrong);
        root.style.setProperty('--text', colors.text);
        root.style.setProperty('--muted', colors.textMuted);
        root.style.setProperty('--border', colors.border);

        // Update preview
        this.updatePreview(colors);
    }

    updatePreview(colors) {
        const previewBox = document.getElementById('colorPreviewBox');
        if (!previewBox) return;

        const header = previewBox.querySelector('.preview-header');
        const content = previewBox.querySelector('.preview-content');
        const textEl = previewBox.querySelector('.preview-text');
        const mutedEl = previewBox.querySelector('.preview-muted');

        if (header) {
            header.style.background = `linear-gradient(135deg, ${colors.bgGradientStart}, ${colors.bgGradientEnd})`;
            header.style.color = 'white';
        }

        if (content) {
            content.style.background = colors.bgSurface;
        }

        const primaryBtn = previewBox.querySelector('.preview-btn.primary');
        const secondaryBtn = previewBox.querySelector('.preview-btn.secondary');
        const successBtn = previewBox.querySelector('.preview-btn.success');
        const warningBtn = previewBox.querySelector('.preview-btn.warning');
        const dangerBtn = previewBox.querySelector('.preview-btn.danger');

        if (primaryBtn) primaryBtn.style.background = colors.primary;
        if (secondaryBtn) secondaryBtn.style.background = colors.secondary;
        if (successBtn) successBtn.style.background = colors.success;
        if (warningBtn) warningBtn.style.background = colors.warning;
        if (dangerBtn) dangerBtn.style.background = colors.danger;

        if (textEl) {
            textEl.style.color = colors.text;
            textEl.style.background = colors.bgSurface;
        }

        if (mutedEl) {
            mutedEl.style.color = colors.textMuted;
            mutedEl.style.background = colors.bgSurface;
        }
    }

    updateColorInputs() {
        for (const [colorKey, inputId] of Object.entries(this.colorInputMap)) {
            const colorInput = document.getElementById(inputId);
            const hexInput = document.getElementById(inputId + 'Hex');
            const value = this.currentColors[colorKey];

            if (colorInput && value) {
                // Convert rgba to hex for color input if needed
                const hexValue = this.toHex(value);
                colorInput.value = hexValue;
            }
            if (hexInput && value) {
                hexInput.value = this.toHex(value);
            }
        }
    }

    toHex(color) {
        // If already hex, return as is
        if (color.startsWith('#')) {
            return color.length === 4 ? 
                '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] : 
                color;
        }
        
        // If rgba/rgb, convert to hex
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        
        return color;
    }

    getColorsFromInputs() {
        const colors = {};
        for (const [colorKey, inputId] of Object.entries(this.colorInputMap)) {
            const hexInput = document.getElementById(inputId + 'Hex');
            if (hexInput) {
                colors[colorKey] = hexInput.value;
            }
        }
        return colors;
    }

    setupEventListeners() {
        // Sync color picker with hex input
        for (const [colorKey, inputId] of Object.entries(this.colorInputMap)) {
            const colorInput = document.getElementById(inputId);
            const hexInput = document.getElementById(inputId + 'Hex');

            if (colorInput && hexInput) {
                // Color picker change -> update hex input and preview
                colorInput.addEventListener('input', (e) => {
                    hexInput.value = e.target.value;
                    this.livePreview();
                });

                // Hex input change -> update color picker and preview
                hexInput.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (!value.startsWith('#')) {
                        value = '#' + value;
                    }
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        colorInput.value = value;
                        this.livePreview();
                    }
                });

                hexInput.addEventListener('blur', (e) => {
                    let value = e.target.value;
                    if (!value.startsWith('#')) {
                        value = '#' + value;
                        e.target.value = value;
                    }
                });
            }
        }

        // Save button
        document.getElementById('saveColors')?.addEventListener('click', () => this.saveColors());

        // Reset button
        document.getElementById('resetColors')?.addEventListener('click', () => this.resetColors());
    }

    livePreview() {
        const colors = { ...this.currentColors, ...this.getColorsFromInputs() };
        this.applyColors(colors);
    }

    async saveColors() {
        const colors = this.getColorsFromInputs();
        
        try {
            const res = await fetch('/api/colors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(colors)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                this.currentColors = { ...this.defaultColors, ...data.colors };
                this.applyColors(this.currentColors);
                if (typeof system !== 'undefined' && system.showToast) {
                    system.showToast('Farbschema gespeichert', 'success');
                }
            } else {
                if (typeof system !== 'undefined' && system.showToast) {
                    system.showToast(data.error || 'Fehler beim Speichern', 'error');
                }
            }
        } catch (e) {
            console.error('Error saving colors:', e);
            if (typeof system !== 'undefined' && system.showToast) {
                system.showToast('Verbindungsfehler', 'error');
            }
        }
    }

    async resetColors() {
        if (!confirm('Farbschema auf Standardwerte zurücksetzen?')) return;

        try {
            const res = await fetch('/api/colors/reset', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok && data.success) {
                this.currentColors = { ...this.defaultColors, ...data.colors };
                this.updateColorInputs();
                this.applyColors(this.currentColors);
                if (typeof system !== 'undefined' && system.showToast) {
                    system.showToast('Farbschema zurückgesetzt', 'success');
                }
            } else {
                if (typeof system !== 'undefined' && system.showToast) {
                    system.showToast(data.error || 'Fehler beim Zurücksetzen', 'error');
                }
            }
        } catch (e) {
            console.error('Error resetting colors:', e);
            if (typeof system !== 'undefined' && system.showToast) {
                system.showToast('Verbindungsfehler', 'error');
            }
        }
    }
}

// Global instance
let colorManager;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    colorManager = new ColorManager();
    colorManager.init();
});

// Also load colors immediately for faster initial paint
(async function() {
    try {
        const res = await fetch('/api/colors');
        if (res.ok) {
            const colors = await res.json();
            const root = document.documentElement;
            
            if (colors.primary) root.style.setProperty('--primary', colors.primary);
            if (colors.primaryHover) root.style.setProperty('--primary-600', colors.primaryHover);
            if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
            if (colors.success) root.style.setProperty('--success', colors.success);
            if (colors.warning) root.style.setProperty('--warning', colors.warning);
            if (colors.danger) root.style.setProperty('--danger', colors.danger);
            if (colors.bgGradientStart && colors.bgGradientEnd) {
                root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 100%)`);
            }
            if (colors.text) root.style.setProperty('--text', colors.text);
            if (colors.textMuted) root.style.setProperty('--muted', colors.textMuted);
        }
    } catch (e) {
        // Silently fail - colors will be loaded again in init()
    }
})();
