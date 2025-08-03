// Presets functionality module
export class PresetManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.presets = this.loadPresets();
    }

    loadPresets() {
        try {
            const saved = localStorage.getItem('ddc_presets');
            const presets = saved ? JSON.parse(saved) : [];
            this.populatePresetSelect(presets);
            return presets;
        } catch (error) {
            console.error('Failed to load presets:', error);
            this.populatePresetSelect([]);
            return [];
        }
    }

    getDefaultPresets() {
        return [
            {
                name: 'Local Demo',
                protocol: 'http',
                ip: '127.0.0.1',
                resolution: 'WVGA'
            },
            {
                name: 'Default DDC',
                protocol: 'http',
                ip: '192.168.10.21',
                resolution: 'WVGA'
            }
        ];
    }

    savePresets() {
        try {
            localStorage.setItem('ddc_presets', JSON.stringify(this.presets));
            console.log('Presets saved successfully');
        } catch (error) {
            console.error('Failed to save presets:', error);
            this.ddcBrowser.showError('Failed to save presets.');
        }
    }

    populatePresetSelect(presets) {
        this.ddcBrowser.presetSelect.innerHTML = '<option value="">Select a preset...</option>';
        presets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            this.ddcBrowser.presetSelect.appendChild(option);
        });
    }

    loadPreset() {
        const selectedIndex = this.ddcBrowser.presetSelect.value;
        if (selectedIndex === '') return;

        const preset = this.presets[selectedIndex];
        if (preset) {
            this.ddcBrowser.protocolSelect.value = preset.protocol;
            this.ddcBrowser.ipInput.value = preset.ip;
            this.ddcBrowser.resolutionSelect.value = preset.resolution;
            
            this.ddcBrowser.showSuccess(`Loaded preset: ${preset.name}`);
            console.log('Loaded preset:', preset);
        }
    }

    savePreset() {
        const name = this.ddcBrowser.presetName.value.trim();
        if (!name) {
            this.ddcBrowser.showError('Please enter a preset name.');
            return;
        }

        const preset = {
            name: name,
            protocol: this.ddcBrowser.protocolSelect.value,
            ip: this.ddcBrowser.ipInput.value.trim(),
            resolution: this.ddcBrowser.resolutionSelect.value
        };

        // Check if preset with same name exists
        const existingIndex = this.presets.findIndex(p => p.name === name);
        if (existingIndex !== -1) {
            if (!confirm(`Preset "${name}" already exists. Overwrite?`)) {
                return;
            }
            this.presets[existingIndex] = preset;
        } else {
            this.presets.push(preset);
        }

        this.savePresets();
        this.populatePresetSelect(this.presets);
        this.ddcBrowser.presetName.value = '';
        this.ddcBrowser.showSuccess(`Preset "${name}" saved successfully!`);
    }

    deletePreset() {
        const selectedIndex = this.ddcBrowser.presetSelect.value;
        if (selectedIndex === '') {
            this.ddcBrowser.showError('Please select a preset to delete.');
            return;
        }

        const preset = this.presets[selectedIndex];
        if (!confirm(`Delete preset "${preset.name}"?`)) {
            return;
        }

        this.presets.splice(selectedIndex, 1);
        this.savePresets();
        this.populatePresetSelect(this.presets);
        this.ddcBrowser.presetSelect.value = '';
        this.ddcBrowser.showSuccess(`Preset "${preset.name}" deleted.`);
    }
}