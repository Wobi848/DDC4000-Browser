class DDCBrowser {
    constructor() {
        this.protocolSelect = document.getElementById('protocolSelect');
        this.ipInput = document.getElementById('ipInput');
        this.resolutionSelect = document.getElementById('resolutionSelect');
        this.presetSelect = document.getElementById('presetSelect');
        this.presetName = document.getElementById('presetName');
        this.loadBtn = document.getElementById('loadBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.savePresetBtn = document.getElementById('savePresetBtn');
        this.deletePresetBtn = document.getElementById('deletePresetBtn');
        this.websiteFrame = document.getElementById('websiteFrame');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.successMessage = document.getElementById('successMessage');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.loadTime = document.getElementById('loadTime');
        this.ipSuggestions = document.getElementById('ipSuggestions');
        
        // Zoom controls
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.autoFitBtn = document.getElementById('autoFitBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.iframeContainer = document.getElementById('iframeContainer');
        
        this.presets = this.loadPresets();
        this.loadStartTime = null;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
        
        this.init();
    }
    
    init() {
        this.loadBtn.addEventListener('click', () => this.loadWebsite());
        this.refreshBtn.addEventListener('click', () => this.refreshWebsite());
        this.savePresetBtn.addEventListener('click', () => this.savePreset());
        this.deletePresetBtn.addEventListener('click', () => this.deletePreset());
        
        this.presetSelect.addEventListener('change', () => this.loadPreset());
        this.ipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadWebsite();
            }
        });
        
        // Zoom control event listeners
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.autoFitBtn.addEventListener('click', () => this.autoFit());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.resetZoomBtn.addEventListener('click', () => this.resetZoom());
        
        // Load saved configuration on startup
        this.loadLastConfiguration();
        this.populatePresetDropdown();
        this.populateIpSuggestions();
        
        // Handle iframe load events
        this.websiteFrame.addEventListener('load', () => this.onFrameLoad());
        this.websiteFrame.addEventListener('error', () => this.onFrameError());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    buildDdcUrl() {
        const protocol = this.protocolSelect.value;
        const ip = this.ipInput.value.trim();
        const resolution = this.resolutionSelect.value;
        
        if (!ip) {
            return { valid: false, error: 'IP address cannot be empty' };
        }
        
        // Validate IP format (basic check)
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(ip)) {
            return { valid: false, error: 'Invalid IP address format' };
        }
        
        const url = `${protocol}://${ip}/ddcdialog.html?useOvl=1&busyReload=1&type=${resolution}`;
        return { valid: true, url: url };
    }
    
    loadWebsite() {
        const urlResult = this.buildDdcUrl();
        
        if (!urlResult.valid) {
            this.showError(urlResult.error);
            return;
        }
        
        const url = urlResult.url;
        
        // Save current configuration
        this.saveLastConfiguration();
        this.addIpToSuggestions(this.ipInput.value.trim());
        
        this.setConnectionStatus('connecting', 'Connecting to DDC4000...');
        this.showLoading();
        this.hideError();
        this.hideSuccess();
        this.loadStartTime = Date.now();
        
        // Add timestamp to prevent caching issues
        const urlWithTimestamp = this.addTimestampToUrl(url);
        this.websiteFrame.src = urlWithTimestamp;
        
        // Set a timeout to detect failed loads
        this.loadTimeout = setTimeout(() => {
            if (this.loadingMessage && !this.loadingMessage.classList.contains('hidden')) {
                this.setConnectionStatus('error', 'Connection timeout');
                this.showError('Connection timeout. The DDC4000 device may be unreachable.');
            }
        }, 15000); // 15 second timeout
    }
    
    refreshWebsite() {
        if (this.websiteFrame.src) {
            this.setConnectionStatus('connecting', 'Refreshing DDC4000...');
            this.showLoading();
            this.hideError();
            this.hideSuccess();
            this.loadStartTime = Date.now();
            
            // Clear existing timeout
            if (this.loadTimeout) {
                clearTimeout(this.loadTimeout);
            }
            
            // Force refresh by removing old timestamp and adding new one
            let currentUrl = this.websiteFrame.src;
            // Remove the timestamp parameter if it exists
            currentUrl = currentUrl.replace(/[&?]_t=\d+/, '');
            const urlWithTimestamp = this.addTimestampToUrl(currentUrl);
            this.websiteFrame.src = urlWithTimestamp;
            
            // Set timeout for refresh
            this.loadTimeout = setTimeout(() => {
                if (this.loadingMessage && !this.loadingMessage.classList.contains('hidden')) {
                    this.setConnectionStatus('error', 'Refresh timeout');
                    this.showError('Refresh timeout. Please try again.');
                }
            }, 15000);
        }
    }
    
    savePreset() {
        const name = this.presetName.value.trim();
        if (!name) {
            this.showError('Please enter a preset name');
            return;
        }
        
        const config = {
            protocol: this.protocolSelect.value,
            ip: this.ipInput.value.trim(),
            resolution: this.resolutionSelect.value,
            name: name
        };
        
        this.presets[name] = config;
        this.savePresets();
        this.populatePresetDropdown();
        this.presetName.value = '';
        
        // Show success message temporarily
        const originalText = this.savePresetBtn.textContent;
        this.savePresetBtn.textContent = 'Saved!';
        setTimeout(() => {
            this.savePresetBtn.textContent = originalText;
        }, 1000);
    }
    
    deletePreset() {
        const selectedPreset = this.presetSelect.value;
        if (!selectedPreset) {
            this.showError('Please select a preset to delete');
            return;
        }
        
        if (confirm(`Delete preset "${selectedPreset}"?`)) {
            delete this.presets[selectedPreset];
            this.savePresets();
            this.populatePresetDropdown();
            this.presetSelect.value = '';
        }
    }
    
    loadPreset() {
        const selectedPreset = this.presetSelect.value;
        if (!selectedPreset || !this.presets[selectedPreset]) {
            return;
        }
        
        const config = this.presets[selectedPreset];
        this.protocolSelect.value = config.protocol;
        this.ipInput.value = config.ip;
        this.resolutionSelect.value = config.resolution;
        this.presetName.value = config.name;
    }
    
    populatePresetDropdown() {
        // Clear existing options except the first one
        this.presetSelect.innerHTML = '<option value="">Select a preset...</option>';
        
        Object.keys(this.presets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.presetSelect.appendChild(option);
        });
    }
    
    populateIpSuggestions() {
        const ips = this.getIpSuggestions();
        this.ipSuggestions.innerHTML = '';
        
        ips.forEach(ip => {
            const option = document.createElement('option');
            option.value = ip;
            this.ipSuggestions.appendChild(option);
        });
    }
    
    addIpToSuggestions(ip) {
        let ips = this.getIpSuggestions();
        if (!ips.includes(ip)) {
            ips.unshift(ip);
            // Keep only last 10 IPs
            ips = ips.slice(0, 10);
            localStorage.setItem('ddcBrowserIps', JSON.stringify(ips));
            this.populateIpSuggestions();
        }
    }
    
    getIpSuggestions() {
        const saved = localStorage.getItem('ddcBrowserIps');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveLastConfiguration() {
        const config = {
            protocol: this.protocolSelect.value,
            ip: this.ipInput.value.trim(),
            resolution: this.resolutionSelect.value
        };
        localStorage.setItem('ddcBrowserLastConfig', JSON.stringify(config));
    }
    
    loadLastConfiguration() {
        const saved = localStorage.getItem('ddcBrowserLastConfig');
        if (saved) {
            const config = JSON.parse(saved);
            this.protocolSelect.value = config.protocol || 'http';
            this.ipInput.value = config.ip || '';
            this.resolutionSelect.value = config.resolution || 'WVGA';
        }
    }
    
    loadPresets() {
        const saved = localStorage.getItem('ddcBrowserPresets');
        return saved ? JSON.parse(saved) : {};
    }
    
    savePresets() {
        localStorage.setItem('ddcBrowserPresets', JSON.stringify(this.presets));
    }
    
    addTimestampToUrl(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}`;
    }
    
    onFrameLoad() {
        // Clear timeout
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
        }
        
        const loadTime = this.loadStartTime ? Date.now() - this.loadStartTime : 0;
        
        // Check if it's an error page first
        const currentUrl = this.websiteFrame.src;
        if (currentUrl.includes('ddcerror.html')) {
            this.setConnectionStatus('error', 'DDC Connection Lost');
            this.hideLoading();
            this.showError('DDC4000 connection was terminated. The device may be offline or busy.');
            return;
        }
        
        this.hideLoading();
        this.hideError();
        
        // Try to detect successful load
        let isSuccessful = false;
        let statusMessage = 'Connected';
        
        try {
            if (this.websiteFrame.contentDocument) {
                const frameContent = this.websiteFrame.contentDocument.body;
                if (!frameContent || frameContent.children.length === 0) {
                    this.setConnectionStatus('error', 'Empty Interface');
                    this.showError('The DDC4000 interface appears to be empty or failed to load content');
                    return;
                } else {
                    // Check for specific DDC4000 content
                    const title = this.websiteFrame.contentDocument.title;
                    if (title && title.includes('DDC4000')) {
                        isSuccessful = true;
                        statusMessage = `Connected to ${title}`;
                    } else {
                        isSuccessful = true;
                        statusMessage = 'DDC4000 Interface Loaded';
                    }
                }
            } else {
                // Cross-origin restrictions - assume success if no errors
                isSuccessful = true;
                statusMessage = 'DDC4000 Interface Active';
            }
        } catch (e) {
            // Cross-origin restrictions prevent access, but frame loaded
            isSuccessful = true;
            statusMessage = 'DDC4000 Interface Active';
        }
        
        if (isSuccessful) {
            this.setConnectionStatus('connected', statusMessage);
            this.showSuccess('DDC4000 Interface Loaded Successfully!');
            this.showLoadTime(loadTime);
            
            // Auto-fit the interface to screen size
            setTimeout(() => this.autoFit(), 500);
        }
    }
    
    onFrameError() {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
        }
        
        this.hideLoading();
        this.setConnectionStatus('error', 'Connection Failed');
        this.showError('Failed to load the DDC4000 interface. Please check the IP address and network connection.');
    }
    
    setConnectionStatus(status, message) {
        this.connectionStatus.className = `connection-status ${status}`;
        this.statusText.textContent = message;
    }
    
    showLoading() {
        this.loadingMessage.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingMessage.classList.add('hidden');
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        // Auto-hide error after 8 seconds
        setTimeout(() => {
            this.hideError();
        }, 8000);
    }
    
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.classList.remove('hidden');
        // Auto-hide success after 3 seconds
        setTimeout(() => {
            this.hideSuccess();
        }, 3000);
    }
    
    hideSuccess() {
        this.successMessage.classList.add('hidden');
    }
    
    showLoadTime(timeMs) {
        if (timeMs > 0) {
            const timeText = timeMs < 1000 ? `${timeMs}ms` : `${(timeMs/1000).toFixed(1)}s`;
            this.loadTime.textContent = `Loaded in ${timeText}`;
            this.loadTime.classList.remove('hidden');
        }
    }
    
    // Zoom functionality
    setZoom(zoomLevel) {
        this.currentZoom = Math.max(0.25, Math.min(5.0, zoomLevel));
        this.websiteFrame.style.transform = `scale(${this.currentZoom})`;
        this.updateZoomDisplay();
        this.updateFrameSize();
    }
    
    updateZoomDisplay() {
        this.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }
    
    updateFrameSize() {
        // Always set explicit dimensions based on resolution for proper centering
        const resolution = this.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 320 : 800;
        const baseHeight = resolution === 'QVGA' ? 240 : 480;
        
        this.websiteFrame.style.width = `${baseWidth}px`;
        this.websiteFrame.style.height = `${baseHeight}px`;
    }
    
    zoomIn() {
        this.setZoom(this.currentZoom + 0.25);
    }
    
    zoomOut() {
        this.setZoom(this.currentZoom - 0.25);
    }
    
    resetZoom() {
        this.setZoom(1.0);
    }
    
    autoFit() {
        // Calculate the best fit for the current screen
        const resolution = this.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 320 : 800;
        const baseHeight = resolution === 'QVGA' ? 240 : 480;
        
        const containerRect = this.iframeContainer.getBoundingClientRect();
        const availableWidth = containerRect.width - 40; // padding
        const availableHeight = containerRect.height - 40; // padding
        
        const scaleX = availableWidth / baseWidth;
        const scaleY = availableHeight / baseHeight;
        const optimalScale = Math.min(scaleX, scaleY, 3.0); // max 3x
        
        this.setZoom(Math.max(0.5, optimalScale));
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        this.iframeContainer.classList.add('fullscreen');
        this.fullscreenBtn.textContent = '⊡'; // Exit fullscreen icon
        this.fullscreenBtn.title = 'Exit Fullscreen';
        this.isFullscreen = true;
        
        // Auto-fit in fullscreen
        setTimeout(() => this.autoFit(), 100);
        
        // Handle ESC key
        this.fullscreenEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.exitFullscreen();
            }
        };
        document.addEventListener('keydown', this.fullscreenEscHandler);
    }
    
    exitFullscreen() {
        this.iframeContainer.classList.remove('fullscreen');
        this.fullscreenBtn.textContent = '⛶'; // Fullscreen icon
        this.fullscreenBtn.title = 'Fullscreen';
        this.isFullscreen = false;
        
        // Remove ESC handler
        if (this.fullscreenEscHandler) {
            document.removeEventListener('keydown', this.fullscreenEscHandler);
        }
        
        // Reset zoom to fit normal container
        setTimeout(() => this.autoFit(), 100);
    }
    
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT'
        );
        
        if (isTyping) return;
        
        // Handle shortcuts
        if (e.ctrlKey) {
            switch(e.key) {
                case '=':
                case '+':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetZoom();
                    break;
                case 'r':
                    e.preventDefault();
                    this.refreshWebsite();
                    break;
            }
        } else {
            switch(e.key) {
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    if (this.isFullscreen) {
                        e.preventDefault();
                        this.exitFullscreen();
                    }
                    break;
                case 'f':
                    this.autoFit();
                    break;
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DDCBrowser();
});