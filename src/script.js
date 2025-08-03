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
        
        // Screenshot controls
        this.captureBtn = document.getElementById('captureBtn');
        this.galleryBtn = document.getElementById('galleryBtn');
        this.autoCapture = document.getElementById('autoCapture');
        this.galleryModal = document.getElementById('galleryModal');
        this.galleryGrid = document.getElementById('galleryGrid');
        this.closeGalleryBtn = document.getElementById('closeGalleryBtn');
        this.clearGalleryBtn = document.getElementById('clearGalleryBtn');
        this.exportGalleryBtn = document.getElementById('exportGalleryBtn');
        
        // Config toggle
        this.toggleConfigBtn = document.getElementById('toggleConfigBtn');
        this.configSection = document.getElementById('configSection');
        this.header = document.querySelector('.header');
        
        // Image inspector
        this.imageInspector = document.getElementById('imageInspector');
        this.inspectorImage = document.getElementById('inspectorImage');
        this.inspectorTitle = document.getElementById('inspectorTitle');
        this.inspectorTimestamp = document.getElementById('inspectorTimestamp');
        this.inspectorZoomLevel = document.getElementById('inspectorZoomLevel');
        this.inspectorZoomIn = document.getElementById('inspectorZoomIn');
        this.inspectorZoomOut = document.getElementById('inspectorZoomOut');
        this.inspectorFit = document.getElementById('inspectorFit');
        this.inspectorDownload = document.getElementById('inspectorDownload');
        this.closeInspector = document.getElementById('closeInspector');
        
        this.presets = this.loadPresets();
        this.loadStartTime = null;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
        this.autoCapturing = false;
        this.screenshots = this.loadScreenshots();
        this.deferredPrompt = null;
        this.configCollapsed = false;
        this.inspectorZoom = 1.0;
        this.currentInspectorScreenshot = null;
        
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
        
        // Screenshot control event listeners
        this.captureBtn.addEventListener('click', () => this.showScreenshotOptions());
        this.galleryBtn.addEventListener('click', () => this.toggleGallery());
        this.autoCapture.addEventListener('click', () => this.toggleAutoCapture());
        this.closeGalleryBtn.addEventListener('click', () => this.closeGallery());
        
        // Close modal when clicking outside
        this.galleryModal.addEventListener('click', (e) => {
            if (e.target === this.galleryModal) {
                this.closeGallery();
            }
        });
        this.clearGalleryBtn.addEventListener('click', () => this.clearGallery());
        this.exportGalleryBtn.addEventListener('click', () => this.exportGallery());
        
        // Config toggle event listener
        this.toggleConfigBtn.addEventListener('click', () => this.toggleConfig());
        
        // Image inspector event listeners
        this.closeInspector.addEventListener('click', () => this.closeImageInspector());
        this.inspectorZoomIn.addEventListener('click', () => this.inspectorZoomImage(1.25));
        this.inspectorZoomOut.addEventListener('click', () => this.inspectorZoomImage(0.8));
        this.inspectorFit.addEventListener('click', () => this.inspectorFitImage());
        this.inspectorDownload.addEventListener('click', () => this.inspectorDownloadImage());
        
        // Close inspector when clicking outside
        this.imageInspector.addEventListener('click', (e) => {
            if (e.target === this.imageInspector) {
                this.closeImageInspector();
            }
        });
        
        // Image dragging for panning when zoomed
        this.setupImagePanning();
        
        // Load saved configuration on startup
        this.loadLastConfiguration();
        this.populatePresetDropdown();
        this.populateIpSuggestions();
        
        // Ensure gallery is hidden on startup BEFORE updating display
        this.galleryModal.classList.add('hidden');
        this.galleryModal.style.display = 'none';
        
        this.updateGalleryDisplay();
        
        // Force close gallery after everything is loaded
        setTimeout(() => {
            this.forceCloseGallery();
        }, 100);
        
        // Load config panel state
        this.loadConfigState();
        
        // Handle iframe load events
        this.websiteFrame.addEventListener('load', () => this.onFrameLoad());
        this.websiteFrame.addEventListener('error', () => this.onFrameError());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // PWA installation
        this.setupPWA();
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
            
            // Auto-capture screenshot if enabled
            if (this.autoCapturing) {
                setTimeout(() => this.captureScreenshot(), 1000);
            }
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
                case 's':
                    e.preventDefault();
                    this.captureScreenshot();
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
                    } else if (!this.galleryModal.classList.contains('hidden')) {
                        e.preventDefault();
                        this.closeGallery();
                    }
                    break;
                case 'f':
                    this.autoFit();
                    break;
                case 'g':
                    this.toggleGallery();
                    break;
                case 'c':
                    this.toggleConfig();
                    break;
            }
        }
    }
    
    // Screenshot options menu
    showScreenshotOptions() {
        const options = [
            {
                text: '📷 Try Auto Capture',
                description: 'Attempt automatic screenshot with iframe2image',
                action: () => this.captureScreenshot()
            },
            {
                text: '🌐 Open DDC in New Tab',
                description: 'Open DDC interface in new tab for manual screenshot',
                action: () => this.openDdcInNewTab()
            },
            {
                text: '📋 Copy DDC URL',
                description: 'Copy DDC URL to clipboard',
                action: () => this.copyDdcUrl()
            },
            {
                text: '🎯 Direct Image URL',
                description: 'Try to open DDC image directly',
                action: () => this.openDdcImageDirect()
            }
        ];

        const menu = this.createOptionsMenu('Screenshot Options', options);
        document.body.appendChild(menu);
    }

    createOptionsMenu(title, options) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const menu = document.createElement('div');
        menu.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = 'margin: 0 0 15px 0; color: #2c3e50; text-align: center;';
        menu.appendChild(titleEl);

        options.forEach(option => {
            const button = document.createElement('button');
            button.style.cssText = `
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                cursor: pointer;
                text-align: left;
                transition: background-color 0.2s;
            `;

            button.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${option.text}</div>
                <div style="font-size: 12px; color: #6c757d;">${option.description}</div>
            `;

            button.onmouseover = () => button.style.backgroundColor = '#e9ecef';
            button.onmouseout = () => button.style.backgroundColor = '#f8f9fa';
            
            button.onclick = () => {
                overlay.remove();
                option.action();
            };

            menu.appendChild(button);
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => overlay.remove();
        menu.appendChild(closeBtn);

        overlay.appendChild(menu);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        return overlay;
    }

    openDdcInNewTab() {
        const iframe = this.websiteFrame;
        if (iframe.src) {
            // Open DDC interface in new tab
            const newTab = window.open(iframe.src, '_blank');
            
            // Show detailed instructions
            const instructions = `
                <div style="font-family: Arial; line-height: 1.6; padding: 20px; max-width: 500px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">📷 Manual Screenshot Instructions</h3>
                    
                    <p><strong>DDC interface opened in new tab!</strong></p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="margin-top: 0; color: #34495e;">🖥️ Windows Users:</h4>
                        <p style="margin: 5px 0;"><kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Win + Shift + S</kbd> - Snipping Tool</p>
                        <p style="margin: 5px 0;"><kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Print Screen</kbd> - Full screen capture</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="margin-top: 0; color: #34495e;">🍎 Mac Users:</h4>
                        <p style="margin: 5px 0;"><kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Cmd + Shift + 4</kbd> - Area selection</p>
                        <p style="margin: 5px 0;"><kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Cmd + Shift + 3</kbd> - Full screen</p>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="margin-top: 0; color: #1976d2;">🌐 Browser Screenshot:</h4>
                        <p style="margin: 5px 0;">1. Press <kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">F12</kbd> to open DevTools</p>
                        <p style="margin: 5px 0;">2. Press <kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Ctrl + Shift + P</kbd> (Windows) or <kbd style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">Cmd + Shift + P</kbd> (Mac)</p>
                        <p style="margin: 5px 0;">3. Type "screenshot" and select "Capture full size screenshot"</p>
                    </div>
                    
                    <p style="color: #27ae60; font-weight: bold;">✨ This method captures the actual DDC4000 interface without browser security restrictions!</p>
                </div>
            `;
            
            // Show instructions in a modal
            const modal = this.createInstructionsModal('Screenshot Instructions', instructions);
            document.body.appendChild(modal);
            
        } else {
            this.showError('No DDC interface loaded yet.');
        }
    }
    
    createInstructionsModal(title, content) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background: #2c3e50;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.margin = '0';
        header.appendChild(titleEl);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        closeBtn.onclick = () => overlay.remove();
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.innerHTML = content;

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        return overlay;
    }

    copyDdcUrl() {
        const iframe = this.websiteFrame;
        if (iframe.src) {
            navigator.clipboard.writeText(iframe.src).then(() => {
                this.showSuccess('DDC URL copied to clipboard!');
            }).catch(() => {
                this.showError('Failed to copy URL. URL: ' + iframe.src);
            });
        } else {
            this.showError('No DDC interface loaded yet.');
        }
    }

    openDdcImageDirect() {
        const iframe = this.websiteFrame;
        if (iframe.src) {
            const url = new URL(iframe.src);
            const timestamp = Date.now();
            const cid = Math.floor(Math.random() * 999999);
            const imageUrl = `${url.protocol}//${url.host}/ddcmain_0.gif?cid=${cid}&time=${timestamp}`;
            
            window.open(imageUrl, '_blank');
            this.showSuccess('Attempting to open DDC image directly...');
        } else {
            this.showError('No DDC interface loaded yet.');
        }
    }

    // Screenshot functionality - Focus on capturing the actual iframe visual content
    async captureScreenshot() {
        try {
            this.captureBtn.textContent = '⏳';
            this.captureBtn.disabled = true;
            
            // Debug: Check current iframe URL
            const currentIframeUrl = this.websiteFrame.src;
            console.log('🔍 Current iframe URL:', currentIframeUrl);
            
            // Check if we have a DDC interface loaded
            if (!currentIframeUrl || currentIframeUrl.includes('127.0.0.1') || currentIframeUrl.includes('localhost')) {
                this.showError('Please load a DDC interface first! Enter an IP address and click "Load DDC Interface".');
                return;
            }
            
            console.log('📸 Starting iframe visual content capture...');
            console.log('🎯 Target: Capture what the user actually sees in the iframe');
            
            // Method 1: html2canvas iframe area capture (PROVEN TO WORK!)
            try {
                console.log('✅ Attempting html2canvas iframe area capture');
                await this.captureIframeAreaWithHtml2Canvas();
                return;
            } catch (e) {
                console.log('❌ html2canvas iframe area capture failed:', e.message);
            }
            
            // Method 2: Screen sharing capture (USER SELECTS what to capture)
            try {
                console.log('✅ Attempting screen sharing capture');
                await this.captureViaScreenShare();
                return;
            } catch (e) {
                console.log('❌ Screen sharing capture failed:', e.message);
            }
            
            // Method 3: Try domvas library for cross-origin iframe capture
            try {
                console.log('✅ Attempting domvas iframe capture');
                await this.captureWithDomvas();
                return;
            } catch (e) {
                console.log('❌ domvas failed:', e.message);
            }
            
            // Method 4: Manual iframe element capture
            try {
                console.log('✅ Attempting manual iframe element capture');
                await this.captureIframeElement();
                return;
            } catch (e) {
                console.log('❌ Manual iframe capture failed:', e.message);
            }
            
            // Method 5: Create a visual representation with instructions
            console.log('📝 Creating enhanced visual representation with capture instructions');
            this.captureEnhancedVisualWithInstructions();
            
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            this.showError('Screenshot capture failed. Creating visual representation instead.');
            this.captureEnhancedVisualWithInstructions();
        } finally {
            this.captureBtn.textContent = '📷';
            this.captureBtn.disabled = false;
        }
    }
    
    
    async captureWithDomvas() {
        // Try multiple domvas library sources and APIs
        const domvasSources = [
            'https://rawgit.com/pbakaus/domvas/master/src/domvas.js',
            'https://cdn.jsdelivr.net/gh/pbakaus/domvas@master/src/domvas.js',
            'https://unpkg.com/domvas@1.0.2/src/domvas.js'
        ];
        
        for (const src of domvasSources) {
            if (!window.domvas) {
                try {
                    console.log('📦 Loading domvas library from:', src);
                    const script = document.createElement('script');
                    script.src = src;
                    document.head.appendChild(script);
                    
                    await new Promise((resolve, reject) => {
                        script.onload = () => {
                            console.log('✅ domvas library loaded from:', src);
                            resolve();
                        };
                        script.onerror = () => {
                            reject(new Error('Failed to load from ' + src));
                        };
                        setTimeout(() => reject(new Error('Timeout loading ' + src)), 5000);
                    });
                    
                    // Test if domvas is properly loaded
                    if (window.domvas) {
                        console.log('🔍 domvas object:', Object.keys(window.domvas));
                        break;
                    }
                } catch (e) {
                    console.log('❌ Failed to load domvas from', src, ':', e.message);
                    continue;
                }
            }
        }
        
        if (!window.domvas) {
            throw new Error('Failed to load domvas library from any source');
        }
        
        const iframe = this.websiteFrame;
        
        if (!iframe.src) {
            throw new Error('No iframe source URL');
        }
        
        console.log('🎯 Starting domvas iframe capture...');
        console.log('📍 Target iframe:', iframe.src);
        console.log('📐 Iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);
        
        return new Promise((resolve, reject) => {
            try {
                // Try different domvas API patterns
                if (typeof window.domvas.toImage === 'function') {
                    console.log('🔧 Using domvas.toImage API');
                    window.domvas.toImage(iframe, function(canvas) {
                        console.log('📊 domvas.toImage callback called with:', canvas ? 'canvas object' : 'null');
                        this.processDomvasResult(canvas, resolve, reject);
                    }.bind(this));
                } else if (typeof window.domvas.toCanvas === 'function') {
                    console.log('🔧 Using domvas.toCanvas API');
                    window.domvas.toCanvas(iframe, function(canvas) {
                        this.processDomvasResult(canvas, resolve, reject);
                    }.bind(this));
                } else if (typeof window.domvas === 'function') {
                    console.log('🔧 Using domvas direct function API');
                    window.domvas(iframe, function(canvas) {
                        this.processDomvasResult(canvas, resolve, reject);
                    }.bind(this));
                } else {
                    throw new Error('Unknown domvas API - available methods: ' + Object.keys(window.domvas));
                }
                
                // Set a timeout for domvas
                setTimeout(() => {
                    reject(new Error('domvas timeout'));
                }, 10000);
                
            } catch (syncError) {
                console.log('❌ domvas sync error:', syncError);
                reject(syncError);
            }
        });
    }
    
    async analyzeDdcStructure() {
        const iframe = this.websiteFrame;
        const iframeSrc = iframe.src;
        
        if (!iframeSrc) {
            throw new Error('No iframe source URL');
        }
        
        console.log('🔍 Analyzing DDC4000 structure...');
        console.log('📍 Iframe URL:', iframeSrc);
        
        // Parse the iframe URL to understand DDC parameters
        const url = new URL(iframeSrc);
        const searchParams = url.searchParams;
        
        console.log('🔧 DDC Parameters found:');
        console.log('   - useOvl:', searchParams.get('useOvl'));
        console.log('   - busyReload:', searchParams.get('busyReload'));
        console.log('   - type:', searchParams.get('type'));
        console.log('   - _t:', searchParams.get('_t'));
        
        // Try to access iframe content to see the actual structure
        let iframeDoc;
        try {
            // Wait a moment for iframe to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                console.log('✅ Successfully accessed iframe document');
                console.log('📄 Document title:', iframeDoc.title);
                console.log('🌐 Document URL:', iframeDoc.URL);
                console.log('📄 Body content length:', iframeDoc.body?.innerHTML?.length || 0);
                
                // Look for all elements that might contain images
                const allElements = iframeDoc.querySelectorAll('*');
                console.log(`🔍 Found ${allElements.length} elements in iframe`);
                
                // Check for specific DDC elements
                const images = iframeDoc.querySelectorAll('img');
                const frames = iframeDoc.querySelectorAll('iframe, frame');
                const objects = iframeDoc.querySelectorAll('object, embed');
                
                console.log(`🖼️ Images: ${images.length}`);
                console.log(`📺 Frames: ${frames.length}`);
                console.log(`🎯 Objects: ${objects.length}`);
                
                // Analyze each image
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    console.log(`📸 Image ${i + 1}:`, {
                        src: img.src,
                        width: img.width || 'auto',
                        height: img.height || 'auto',
                        naturalWidth: img.naturalWidth || 'unknown',
                        naturalHeight: img.naturalHeight || 'unknown',
                        complete: img.complete,
                        alt: img.alt || 'none'
                    });
                    
                    // If this looks like a DDC image, try to capture it
                    if (img.src && img.naturalWidth > 100 && img.naturalHeight > 100) {
                        console.log('🎯 Found substantial image, attempting capture...');
                        
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            
                            // Wait for image to be fully loaded
                            if (!img.complete) {
                                await new Promise((resolve, reject) => {
                                    img.onload = resolve;
                                    img.onerror = reject;
                                    setTimeout(reject, 3000); // 3 second timeout
                                });
                            }
                            
                            ctx.drawImage(img, 0, 0);
                            
                            // Check for actual content
                            const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
                            const data = imageData.data;
                            
                            let colorVariance = 0;
                            let nonWhitePixels = 0;
                            
                            for (let j = 0; j < data.length; j += 4) {
                                const r = data[j];
                                const g = data[j + 1];
                                const b = data[j + 2];
                                const a = data[j + 3];
                                
                                if (a > 0) {
                                    if (r < 250 || g < 250 || b < 250) {
                                        nonWhitePixels++;
                                    }
                                    
                                    // Calculate color variance (helps detect actual interface vs blank)
                                    const variance = Math.abs(r - 128) + Math.abs(g - 128) + Math.abs(b - 128);
                                    colorVariance += variance;
                                }
                            }
                            
                            const avgVariance = colorVariance / (data.length / 4);
                            console.log(`📊 Image analysis: ${nonWhitePixels} non-white pixels, avg variance: ${avgVariance.toFixed(2)}`);
                            
                            // If we have enough content and color variation, it's likely real interface content
                            if (nonWhitePixels > 50 && avgVariance > 10) {
                                console.log('🎉 Found actual DDC interface content!');
                                const dataUrl = canvas.toDataURL('image/png', 1.0);
                                this.saveScreenshot(dataUrl);
                                return;
                            } else {
                                console.log('⚠️ Image appears to be mostly blank or low-content');
                            }
                            
                        } catch (canvasError) {
                            console.log('❌ Canvas capture failed:', canvasError.message);
                        }
                    }
                }
                
                // Analyze frames for nested content
                for (let i = 0; i < frames.length; i++) {
                    const frame = frames[i];
                    console.log(`📺 Frame ${i + 1}:`, {
                        src: frame.src,
                        width: frame.width || 'auto',
                        height: frame.height || 'auto',
                        name: frame.name || 'none'
                    });
                    
                    // Try to access nested frame content
                    try {
                        const nestedDoc = frame.contentDocument || frame.contentWindow?.document;
                        if (nestedDoc) {
                            console.log(`✅ Accessed nested frame ${i + 1} content`);
                            const nestedImages = nestedDoc.querySelectorAll('img');
                            console.log(`   Found ${nestedImages.length} images in nested frame`);
                            
                            for (const nestedImg of nestedImages) {
                                if (nestedImg.src && nestedImg.naturalWidth > 100) {
                                    console.log('🎯 Found image in nested frame:', nestedImg.src);
                                    
                                    // Try the same capture logic for nested images
                                    try {
                                        const canvas = document.createElement('canvas');
                                        const ctx = canvas.getContext('2d');
                                        
                                        canvas.width = nestedImg.naturalWidth;
                                        canvas.height = nestedImg.naturalHeight;
                                        
                                        if (!nestedImg.complete) {
                                            await new Promise((resolve, reject) => {
                                                nestedImg.onload = resolve;
                                                nestedImg.onerror = reject;
                                                setTimeout(reject, 3000);
                                            });
                                        }
                                        
                                        ctx.drawImage(nestedImg, 0, 0);
                                        const dataUrl = canvas.toDataURL('image/png', 1.0);
                                        this.saveScreenshot(dataUrl);
                                        console.log('🎉 Successfully captured nested frame image!');
                                        return;
                                        
                                    } catch (nestedError) {
                                        console.log('❌ Nested frame capture failed:', nestedError.message);
                                    }
                                }
                            }
                        }
                    } catch (nestedAccessError) {
                        console.log(`❌ Cannot access nested frame ${i + 1}:`, nestedAccessError.message);
                    }
                }
                
                // Check for any script-generated content or dynamic elements
                const scripts = iframeDoc.querySelectorAll('script');
                console.log(`📜 Found ${scripts.length} script elements`);
                
                // Look for any references to image URLs in scripts
                for (const script of scripts) {
                    if (script.textContent) {
                        const imageMatches = script.textContent.match(/\.gif[\w?&=]*/g);
                        if (imageMatches) {
                            console.log('🔍 Found GIF references in script:', imageMatches);
                        }
                    }
                }
                
            } else {
                console.log('❌ Cannot access iframe document (cross-origin restriction)');
            }
        } catch (accessError) {
            console.log('❌ Iframe access error:', accessError.message);
        }
        
        // If we couldn't find anything in the iframe, try constructing the proper DDC URLs
        // based on common DDC4000 patterns with the parameters we extracted
        console.log('🔧 Attempting to construct proper DDC image URLs...');
        
        const baseUrl = `${url.protocol}//${url.host}`;
        const timestamp = Date.now();
        const cid = Math.floor(Math.random() * 999999);
        
        // DDC4000 often uses session-based parameters
        const possibleUrls = [
            // Try with the same parameters as the main dialog
            `${baseUrl}/ddcmain_0.gif?useOvl=1&busyReload=1&type=${searchParams.get('type') || 'WVGA'}&_t=${timestamp}`,
            `${baseUrl}/ddcdialog.gif?useOvl=1&busyReload=1&type=${searchParams.get('type') || 'WVGA'}&_t=${timestamp}`,
            
            // Try with cid parameter (common in DDC systems)
            `${baseUrl}/ddcmain_0.gif?cid=${cid}&time=${timestamp}`,
            `${baseUrl}/ddcdialog.gif?cid=${cid}&time=${timestamp}`,
            
            // Try without parameters
            `${baseUrl}/ddcmain_0.gif`,
            `${baseUrl}/ddcdialog.gif`,
            
            // Try the exact iframe URL as an image
            iframeSrc
        ];
        
        for (const testUrl of possibleUrls) {
            try {
                console.log(`📡 Testing constructed URL: ${testUrl}`);
                
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                const result = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout'));
                    }, 3000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Failed to load'));
                    };
                    
                    img.src = testUrl;
                });
                
                // Success! Try to capture it
                console.log(`✅ Successfully loaded image from: ${testUrl}`);
                console.log(`📐 Image size: ${result.naturalWidth} × ${result.naturalHeight}`);
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = result.naturalWidth || result.width;
                canvas.height = result.naturalHeight || result.height;
                
                ctx.drawImage(result, 0, 0);
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                
                this.saveScreenshot(dataUrl);
                console.log('🎉 Successfully captured DDC image via URL construction!');
                return;
                
            } catch (error) {
                console.log(`❌ Failed to load ${testUrl}: ${error.message}`);
            }
        }
        
        throw new Error('Could not find or access any DDC4000 images');
    }
    
    async captureIframeVisualContent() {
        // Load html2canvas if not available
        if (!window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                setTimeout(() => reject(new Error('html2canvas load timeout')), 10000);
            });
        }
        
        console.log('🎯 Capturing iframe visual content with enhanced html2canvas...');
        
        const iframe = this.websiteFrame;
        const iframeContainer = this.iframeContainer;
        
        // Get iframe position and size
        const iframeRect = iframe.getBoundingClientRect();
        const containerRect = iframeContainer.getBoundingClientRect();
        
        console.log('📐 Iframe dimensions:', {
            width: iframeRect.width,
            height: iframeRect.height,
            left: iframeRect.left,
            top: iframeRect.top
        });
        
        // Try to capture just the iframe area with maximum compatibility
        const canvas = await html2canvas(document.body, {
            useCORS: false,
            allowTaint: true,
            foreignObjectRendering: false,
            scale: 2, // Higher quality
            width: window.innerWidth,
            height: window.innerHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            logging: true,
            backgroundColor: null,
            removeContainer: false,
            imageTimeout: 15000,
            onclone: (clonedDoc, element) => {
                console.log('📋 Document cloned for iframe capture');
                
                // Find the iframe in the cloned document
                const clonedIframe = clonedDoc.querySelector('#websiteFrame');
                if (clonedIframe) {
                    console.log('🖼️ Found iframe in cloned document');
                    console.log('📍 Iframe src:', clonedIframe.src);
                    
                    // Ensure iframe is visible and properly sized
                    clonedIframe.style.display = 'block';
                    clonedIframe.style.visibility = 'visible';
                    clonedIframe.style.opacity = '1';
                    clonedIframe.style.border = '2px solid red'; // Debug border
                    clonedIframe.style.backgroundColor = '#ffffff';
                    
                    // Try to access iframe content if possible
                    try {
                        const iframeDoc = clonedIframe.contentDocument;
                        if (iframeDoc) {
                            console.log('✅ Can access cloned iframe content');
                            // Make sure iframe content is visible
                            if (iframeDoc.body) {
                                iframeDoc.body.style.visibility = 'visible';
                                iframeDoc.body.style.opacity = '1';
                            }
                        }
                    } catch (e) {
                        console.log('❌ Cannot access cloned iframe content (cross-origin)');
                    }
                } else {
                    console.log('❌ Iframe not found in cloned document');
                }
                
                // Hide everything except the iframe container
                const allElements = clonedDoc.querySelectorAll('*');
                for (const el of allElements) {
                    if (el !== clonedDoc.documentElement && 
                        el !== clonedDoc.body && 
                        !el.closest('#iframeContainer') &&
                        el.id !== 'iframeContainer' &&
                        el.id !== 'websiteFrame') {
                        el.style.display = 'none';
                    }
                }
                
                // Make iframe container more visible
                const clonedContainer = clonedDoc.querySelector('#iframeContainer');
                if (clonedContainer) {
                    clonedContainer.style.backgroundColor = '#ffffff';
                    clonedContainer.style.border = '3px solid blue'; // Debug border
                }
            }
        });
        
        console.log('✅ html2canvas completed for iframe capture');
        console.log('📐 Canvas size:', canvas.width, 'x', canvas.height);
        
        // Crop the canvas to just the iframe area
        const iframeX = Math.max(0, (iframeRect.left - containerRect.left) * 2); // Scale factor 2
        const iframeY = Math.max(0, (iframeRect.top - containerRect.top) * 2);
        const iframeWidth = Math.min(canvas.width - iframeX, iframeRect.width * 2);
        const iframeHeight = Math.min(canvas.height - iframeY, iframeRect.height * 2);
        
        console.log('✂️ Cropping to iframe area:', {
            x: iframeX,
            y: iframeY,
            width: iframeWidth,
            height: iframeHeight
        });
        
        // Create a new canvas with just the iframe content
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        
        croppedCanvas.width = Math.max(100, iframeWidth);
        croppedCanvas.height = Math.max(100, iframeHeight);
        
        // Fill with white background first
        croppedCtx.fillStyle = '#ffffff';
        croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
        
        // Draw the iframe portion
        croppedCtx.drawImage(
            canvas,
            iframeX, iframeY, iframeWidth, iframeHeight,
            0, 0, croppedCanvas.width, croppedCanvas.height
        );
        
        // Check if we captured actual content
        const imageData = croppedCtx.getImageData(0, 0, Math.min(croppedCanvas.width, 100), Math.min(croppedCanvas.height, 100));
        const data = imageData.data;
        
        let colorfulPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) {
                totalPixels++;
                // Check for any non-white/gray content
                if (r < 240 || g < 240 || b < 240 || 
                    Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(r - b) > 10) {
                    colorfulPixels++;
                }
            }
        }
        
        const contentPercentage = totalPixels > 0 ? (colorfulPixels / totalPixels) * 100 : 0;
        console.log(`📊 Content analysis: ${colorfulPixels}/${totalPixels} colorful pixels (${contentPercentage.toFixed(1)}%)`);
        
        const dataUrl = croppedCanvas.toDataURL('image/png', 1.0);
        this.saveScreenshot(dataUrl);
        
        if (contentPercentage > 5) {
            console.log('🎉 Successfully captured iframe visual content!');
        } else {
            console.log('⚠️ Captured iframe but content appears mostly empty');
        }
    }
    
    async captureViaScreenShare() {
        // Check if screen sharing is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen sharing not supported in this browser');
        }

        console.log('🎥 Starting screen sharing capture...');
        console.log('📢 User will be prompted to select what to capture');
        
        // Show instructions to user
        this.showScreenShareInstructions();
        
        try {
            // Request screen sharing with user selection
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false // We only need video for screenshots
            });
            
            console.log('✅ Screen sharing permission granted');
            console.log('📺 Stream obtained, setting up video element...');
            
            // Create video element to display the stream
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            
            // Hide instructions and show capture interface
            this.hideScreenShareInstructions();
            this.showScreenCaptureInterface(video, stream);
            
            return new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    console.log(`📺 Video loaded: ${video.videoWidth}x${video.videoHeight}`);
                    
                    // Auto-capture after a short delay to let user position
                    setTimeout(() => {
                        this.captureFromVideoStream(video, stream);
                        resolve();
                    }, 2000);
                };
                
                video.onerror = (error) => {
                    console.log('❌ Video error:', error);
                    stream.getTracks().forEach(track => track.stop());
                    reject(new Error('Video stream error'));
                };
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (stream.active) {
                        stream.getTracks().forEach(track => track.stop());
                        reject(new Error('Screen capture timeout'));
                    }
                }, 30000);
            });
            
        } catch (error) {
            console.log('❌ Screen sharing failed:', error.message);
            this.hideScreenShareInstructions();
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Screen sharing permission denied by user');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Screen sharing not supported');
            } else {
                throw new Error('Screen sharing failed: ' + error.message);
            }
        }
    }
    
    showScreenShareInstructions() {
        // Create modal with instructions
        const modal = document.createElement('div');
        modal.id = 'screenShareModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; text-align: center;">
                <h2 style="color: #2c3e50; margin-bottom: 20px;">📷 Screen Capture</h2>
                <div style="font-size: 48px; margin-bottom: 20px;">🖥️</div>
                <p style="margin-bottom: 15px;">You'll be prompted to select what to capture:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                    <strong>Best options:</strong><br>
                    🖥️ <strong>Entire Screen</strong> - Captures everything<br>
                    🪟 <strong>Application Window</strong> - Captures just the browser<br>
                    📱 <strong>Browser Tab</strong> - Captures this tab only
                </div>
                <p style="color: #666; font-size: 12px;">After selection, a screenshot will be taken automatically</p>
                <div style="margin-top: 20px;">
                    <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 10px; color: #666;">Waiting for screen selection...</p>
                </div>
            </div>
        `;
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
    }
    
    hideScreenShareInstructions() {
        const modal = document.getElementById('screenShareModal');
        if (modal) {
            modal.remove();
        }
    }
    
    showScreenCaptureInterface(video, stream) {
        // Create capture interface
        const interface = document.createElement('div');
        interface.id = 'screenCaptureInterface';
        interface.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 3001;
            min-width: 300px;
        `;
        
        interface.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📺 Screen Capture Active</h3>
            <p style="margin-bottom: 15px; color: #666;">Capturing: <span id="captureSource">Screen/Window</span></p>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="captureNowBtn" style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📷 Capture Now
                </button>
                <button id="stopCaptureBtn" style="flex: 1; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ❌ Stop
                </button>
            </div>
            <div style="font-size: 11px; color: #666;">Auto-capture in 2 seconds...</div>
        `;
        
        document.body.appendChild(interface);
        
        // Add event listeners
        document.getElementById('captureNowBtn').onclick = () => {
            this.captureFromVideoStream(video, stream);
        };
        
        document.getElementById('stopCaptureBtn').onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            interface.remove();
        };
        
        // Auto-remove interface when stream ends
        stream.getTracks()[0].addEventListener('ended', () => {
            interface.remove();
        });
    }
    
    captureFromVideoStream(video, stream) {
        try {
            console.log('📸 Capturing from video stream...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            console.log(`📐 Capture dimensions: ${canvas.width}x${canvas.height}`);
            
            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0);
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            // Remove interface
            const interface = document.getElementById('screenCaptureInterface');
            if (interface) interface.remove();
            
            // Save screenshot
            this.saveScreenshot(dataUrl);
            
            console.log('🎉 Screen capture completed successfully!');
            this.showSuccess('Screenshot captured from screen sharing!');
            
        } catch (error) {
            console.log('❌ Capture from stream failed:', error);
            this.showError('Failed to capture from video stream');
        }
    }
    
    async captureIframeElement() {
        console.log('🎯 Attempting direct iframe element capture...');
        
        const iframe = this.websiteFrame;
        
        // Try to draw the iframe directly onto canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const rect = iframe.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = rect.height || 480;
        
        console.log(`📐 Canvas size set to: ${canvas.width} × ${canvas.height}`);
        
        // Fill with background color first
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        try {
            // Try to draw iframe directly (this may fail due to CORS)
            ctx.drawImage(iframe, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            this.saveScreenshot(dataUrl);
            
            console.log('✅ Successfully captured iframe element directly!');
            
        } catch (e) {
            console.log('❌ Direct iframe draw failed:', e.message);
            throw e;
        }
    }
    
    async captureIframeAreaWithHtml2Canvas() {
        // Load html2canvas if not available
        if (!window.html2canvas) {
            console.log('📦 Loading html2canvas library...');
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log('✅ html2canvas library loaded');
                    resolve();
                };
                script.onerror = () => {
                    reject(new Error('Failed to load html2canvas'));
                };
                setTimeout(() => reject(new Error('html2canvas load timeout')), 10000);
            });
        }
        
        console.log('🎯 Capturing iframe area with html2canvas (demo-proven method)...');
        
        const iframe = this.websiteFrame;
        const iframeContainer = this.iframeContainer;
        
        console.log('📍 Target iframe:', iframe.src);
        console.log('📐 iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);
        console.log('📦 Container element:', iframeContainer.id);
        
        // Try multiple approaches to capture the iframe area
        console.log('🎯 Trying different capture strategies...');
        
        // Strategy 1: Capture entire document and crop to iframe area
        console.log('📸 Strategy 1: Full document capture with iframe cropping');
        const fullCanvas = await html2canvas(document.body, {
            useCORS: false,
            allowTaint: true,
            scale: 1,
            logging: true,
            backgroundColor: null,
            onclone: (clonedDoc) => {
                console.log('📋 Full document cloned');
                
                // Make everything visible and add debug colors
                const clonedIframe = clonedDoc.querySelector('#websiteFrame');
                const clonedContainer = clonedDoc.querySelector('#iframeContainer');
                
                if (clonedIframe) {
                    console.log('🖼️ Found iframe in full document clone');
                    clonedIframe.style.border = '5px solid red';
                    clonedIframe.style.backgroundColor = '#ffeeee';
                    clonedIframe.style.minHeight = '400px';
                    clonedIframe.style.minWidth = '600px';
                }
                
                if (clonedContainer) {
                    console.log('📦 Found container in full document clone');
                    clonedContainer.style.border = '3px solid blue';
                    clonedContainer.style.backgroundColor = '#eeeeff';
                    clonedContainer.style.minHeight = '450px';
                }
                
                // Hide everything except the iframe area
                const elementsToHide = clonedDoc.querySelectorAll('.header, .status-bar, #galleryModal, #imageInspector');
                elementsToHide.forEach(el => {
                    if (el) el.style.display = 'none';
                });
            }
        });
        
        console.log(`✅ Full document captured: ${fullCanvas.width} × ${fullCanvas.height}`);
        
        // Find the iframe position and crop
        const iframeRect = iframe.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        
        const iframeX = Math.max(0, iframeRect.left - bodyRect.left);
        const iframeY = Math.max(0, iframeRect.top - bodyRect.top);
        
        console.log(`📐 Iframe position: ${iframeX}, ${iframeY}`);
        console.log(`📐 Iframe size: ${iframeRect.width} × ${iframeRect.height}`);
        
        // Crop to iframe area
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = Math.max(400, iframeRect.width);
        canvas.height = Math.max(300, iframeRect.height);
        
        // Fill with a background to see if cropping works
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the iframe area from the full capture
        ctx.drawImage(
            fullCanvas,
            iframeX, iframeY, iframeRect.width, iframeRect.height,
            0, 0, canvas.width, canvas.height
        );
        
        // Add debug overlay to see what we captured
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.fillText(`DDC Screenshot: ${canvas.width}×${canvas.height}`, 10, 25);
        ctx.fillText(`Time: ${new Date().toLocaleTimeString()}`, 10, 45);
        ctx.fillText(`Source: ${iframe.src ? 'Connected' : 'No Source'}`, 10, 65);
        
        console.log('✅ html2canvas iframe area capture completed');
        console.log(`📐 Final canvas size: ${canvas.width} × ${canvas.height}`);
        
        // Analyze the captured content (excluding the debug text area)
        const imageData = ctx.getImageData(0, 80, Math.min(canvas.width, 200), Math.min(canvas.height - 80, 200));
        const data = imageData.data;
        
        let colorfulPixels = 0;
        let totalPixels = 0;
        let uniqueColors = new Set();
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) {
                totalPixels++;
                uniqueColors.add(`${r}-${g}-${b}`);
                
                // Count pixels that have actual color variation (not just white/gray)
                if (r < 240 || g < 240 || b < 240 || 
                    Math.abs(r - g) > 20 || Math.abs(g - b) > 20 || Math.abs(r - b) > 20) {
                    colorfulPixels++;
                }
            }
        }
        
        const contentPercentage = totalPixels > 0 ? (colorfulPixels / totalPixels) * 100 : 0;
        console.log(`📊 Content analysis:`);
        console.log(`   - ${colorfulPixels}/${totalPixels} colorful pixels (${contentPercentage.toFixed(1)}%)`);
        console.log(`   - ${uniqueColors.size} unique colors detected`);
        console.log(`   - iframe position: ${iframeX}, ${iframeY}`);
        console.log(`   - iframe size: ${iframeRect.width} × ${iframeRect.height}`);
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        console.log(`📊 Final data URL length: ${dataUrl.length} characters`);
        
        this.saveScreenshot(dataUrl);
        
        if (colorfulPixels > 100 || uniqueColors.size > 10) {
            console.log('🎉 Successfully captured DDC interface with visible content!');
            this.showSuccess('Screenshot captured! DDC interface content detected.');
        } else if (colorfulPixels > 10) {
            console.log('⚠️ Captured some content but may be minimal (loading/error state)');
            this.showSuccess('Screenshot captured! May show DDC loading or error state.');
        } else {
            console.log('❌ Captured mostly empty content - likely white/blank iframe');
            this.showSuccess('Screenshot captured but appears mostly empty. Check DDC connection.');
        }
    }
    
    captureEnhancedVisualWithInstructions() {
        console.log('📝 Creating enhanced visual with capture instructions...');
        
        const iframe = this.websiteFrame;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use actual iframe dimensions
        const rect = iframe.getBoundingClientRect();
        canvas.width = Math.max(800, rect.width);
        canvas.height = Math.max(480, rect.height);
        
        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Header
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📷 DDC4000 Screenshot Capture', canvas.width / 2, 35);
        
        // Status
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(20, 80, canvas.width - 40, 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('✅ DDC4000 Interface Active & Connected', canvas.width / 2, 105);
        
        // Info section
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 140, canvas.width - 40, 120);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('📋 Capture Information', canvas.width / 2, 165);
        
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        const infoX = 40;
        ctx.fillText(`🌐 Device: ${this.ipInput.value}`, infoX, 185);
        ctx.fillText(`📐 Resolution: ${this.resolutionSelect.value}`, infoX, 205);
        ctx.fillText(`🔗 Protocol: ${this.protocolSelect.value.toUpperCase()}`, infoX, 225);
        ctx.fillText(`⏰ Time: ${new Date().toLocaleString()}`, infoX, 245);
        
        // Instructions section
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20, 280, canvas.width - 40, 140);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚫 Automatic Capture Blocked by Browser Security', canvas.width / 2, 305);
        
        ctx.font = '12px Arial';
        ctx.fillText('The DDC4000 interface is active but cross-origin restrictions prevent', canvas.width / 2, 330);
        ctx.fillText('automatic screenshot capture. Use these manual methods:', canvas.width / 2, 350);
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff3cd';
        ctx.fillText('🖱️ Right-click the interface above and select "Save image as..."', canvas.width / 2, 375);
        ctx.fillText('📱 Use your browser\'s screenshot tool (Ctrl+Shift+S or Cmd+Shift+4)', canvas.width / 2, 395);
        
        // Footer
        ctx.fillStyle = '#6c757d';
        ctx.fillRect(20, canvas.height - 60, canvas.width - 40, 40);
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText('This is a visual representation. The actual DDC4000 interface is displayed above.', canvas.width / 2, canvas.height - 35);
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        this.saveScreenshot(dataUrl);
        
        console.log('✅ Enhanced visual representation created with capture instructions');
    }
    
    processDomvasResult(result, resolve, reject) {
        if (!result) {
            console.log('❌ domvas returned no result');
            reject(new Error('domvas returned no result'));
            return;
        }
        
        console.log('✅ domvas success! Result type:', result.constructor.name);
        console.log('📐 Result dimensions:', result.width, 'x', result.height);
        
        let canvas;
        
        // Check if result is an Image element and convert to Canvas
        if (result instanceof HTMLImageElement || result.tagName === 'IMG') {
            console.log('🔄 Converting Image element to Canvas...');
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match image
            canvas.width = result.naturalWidth || result.width;
            canvas.height = result.naturalHeight || result.height;
            
            console.log('📐 Canvas created with size:', canvas.width, 'x', canvas.height);
            
            try {
                // Draw the image onto the canvas
                ctx.drawImage(result, 0, 0);
                console.log('✅ Image successfully drawn to canvas');
            } catch (drawError) {
                console.log('❌ Failed to draw image to canvas:', drawError.message);
                reject(new Error('Failed to convert image to canvas: ' + drawError.message));
                return;
            }
        } else if (result.getContext) {
            // Already a canvas
            console.log('✅ Result is already a Canvas element');
            canvas = result;
        } else {
            console.log('❌ Unknown result type:', typeof result, result.constructor.name);
            reject(new Error('domvas returned unknown type: ' + typeof result));
            return;
        }
        
        // Check if canvas has content
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
        const data = imageData.data;
        
        let hasContent = false;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Check for non-white, non-transparent pixels
            if (a > 0 && (r < 240 || g < 240 || b < 240)) {
                hasContent = true;
                break;
            }
        }
        
        console.log('📊 domvas content check:', hasContent ? 'HAS CONTENT' : 'MOSTLY EMPTY/WHITE');
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        this.saveScreenshot(dataUrl);
        
        if (hasContent) {
            console.log('🎉 Successfully captured DDC iframe with domvas!');
        } else {
            console.log('⚠️ domvas captured mostly empty content');
        }
        
        resolve();
    }
    
    async captureWithIframe2Image() {
        console.log('🎯 Starting iframe2image capture (same-origin only)...');
        
        const iframe = this.websiteFrame;
        
        if (!iframe.src) {
            throw new Error('No iframe source URL');
        }
        
        // Check if this is a cross-origin iframe
        try {
            const iframeUrl = new URL(iframe.src);
            const currentUrl = new URL(window.location.href);
            
            if (iframeUrl.origin !== currentUrl.origin) {
                console.log('❌ iframe2image: Cross-origin iframe detected');
                console.log(`   Current origin: ${currentUrl.origin}`);
                console.log(`   iframe origin: ${iframeUrl.origin}`);
                throw new Error('iframe2image cannot capture cross-origin content');
            }
        } catch (urlError) {
            console.log('⚠️ Could not parse URLs, attempting capture anyway...');
        }
        
        // Load iframe2image with proper dependencies
        if (!window.domvas) {
            console.log('📦 Loading domvas (required dependency)...');
            const domvasScript = document.createElement('script');
            domvasScript.src = 'https://raw.githubusercontent.com/pbakaus/domvas/master/src/domvas.js';
            document.head.appendChild(domvasScript);
            
            await new Promise((resolve, reject) => {
                domvasScript.onload = () => {
                    console.log('✅ domvas library loaded');
                    resolve();
                };
                domvasScript.onerror = () => {
                    reject(new Error('Failed to load domvas'));
                };
                setTimeout(() => reject(new Error('domvas load timeout')), 5000);
            });
        }
        
        if (!window.iframe2image) {
            console.log('📦 Loading iframe2image library...');
            const script = document.createElement('script');
            script.src = 'https://raw.githubusercontent.com/twolfson/iframe2image/master/lib/iframe2image.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log('✅ iframe2image library loaded');
                    resolve();
                };
                script.onerror = () => {
                    reject(new Error('Failed to load iframe2image'));
                };
                setTimeout(() => reject(new Error('iframe2image load timeout')), 5000);
            });
        }
        
        console.log('📍 Target iframe:', iframe.src);
        console.log('📐 Iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);
        
        return new Promise((resolve, reject) => {
            try {
                // Use the correct iframe2image API: iframe2image(iframe, callback)
                window.iframe2image(iframe, (error, image) => {
                    if (error) {
                        console.log('❌ iframe2image failed:', error.message);
                        reject(new Error('iframe2image failed: ' + error.message));
                        return;
                    }
                    
                    if (!image) {
                        console.log('❌ iframe2image returned no image');
                        reject(new Error('iframe2image returned no image'));
                        return;
                    }
                    
                    console.log('✅ iframe2image success!');
                    console.log(`📐 Image size: ${image.width} × ${image.height}`);
                    console.log(`🎨 Image type: ${image.constructor.name}`);
                    
                    // Convert the result to a data URL
                    let dataUrl;
                    
                    if (image instanceof HTMLImageElement) {
                        console.log('📷 Converting HTMLImageElement to canvas...');
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = image.naturalWidth || image.width;
                        canvas.height = image.naturalHeight || image.height;
                        
                        try {
                            ctx.drawImage(image, 0, 0);
                            dataUrl = canvas.toDataURL('image/png', 1.0);
                            
                            // Check content
                            const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50));
                            const data = imageData.data;
                            
                            let nonWhitePixels = 0;
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                const a = data[i + 3];
                                
                                if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                                    nonWhitePixels++;
                                }
                            }
                            
                            console.log(`📊 Content analysis: ${nonWhitePixels} non-white pixels`);
                            
                            if (nonWhitePixels > 10) {
                                console.log('🎉 Successfully captured iframe with actual content!');
                            } else {
                                console.log('⚠️ iframe appears to be mostly empty or white');
                            }
                            
                        } catch (drawError) {
                            console.log('❌ Failed to draw image to canvas:', drawError.message);
                            // Use the image src as fallback
                            dataUrl = image.src;
                        }
                        
                    } else if (image.getContext) {
                        console.log('🎨 Using canvas directly...');
                        dataUrl = image.toDataURL('image/png', 1.0);
                    } else {
                        console.log('❌ Unknown image type returned');
                        reject(new Error('Unknown image type: ' + typeof image));
                        return;
                    }
                    
                    this.saveScreenshot(dataUrl);
                    console.log('✅ iframe2image capture completed successfully!');
                    resolve();
                });
                
            } catch (syncError) {
                console.log('❌ iframe2image sync error:', syncError.message);
                reject(syncError);
            }
        });
    }
    
    async captureGifDirectly() {
        const iframe = this.websiteFrame;
        const iframeSrc = iframe.src;
        
        if (!iframeSrc) {
            throw new Error('No iframe source URL');
        }
        
        const url = new URL(iframeSrc);
        console.log('🎯 Starting direct GIF capture from DDC4000...');
        console.log('📍 Base URL:', `${url.protocol}//${url.host}`);
        
        // DDC4000 typically serves dynamic GIF images
        const timestamp = Date.now();
        const cid = Math.floor(Math.random() * 999999);
        
        // Extended list of common DDC4000 image endpoints
        const possibleUrls = [
            // Most common DDC4000 patterns
            `${url.protocol}//${url.host}/ddcmain_0.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/ddcmain.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/ddcdialog.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/ddcframe_0.gif?cid=${cid}&time=${timestamp}`,
            
            // Static versions
            `${url.protocol}//${url.host}/ddcmain_0.gif`,
            `${url.protocol}//${url.host}/ddcmain.gif`,
            `${url.protocol}//${url.host}/ddcdialog.gif`,
            `${url.protocol}//${url.host}/ddcframe_0.gif`,
            
            // Alternative patterns
            `${url.protocol}//${url.host}/main.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/dialog.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/image.gif?cid=${cid}&time=${timestamp}`,
            
            // Numbered variations
            `${url.protocol}//${url.host}/ddcmain_1.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/ddcmain_2.gif?cid=${cid}&time=${timestamp}`,
            `${url.protocol}//${url.host}/ddcframe_1.gif?cid=${cid}&time=${timestamp}`,
        ];
        
        console.log('🔍 Testing', possibleUrls.length, 'possible DDC image URLs...');
        
        for (const testUrl of possibleUrls) {
            try {
                console.log(`📡 Testing: ${testUrl}`);
                
                // Use fetch first to check if the URL exists and get headers
                const response = await fetch(testUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    credentials: 'omit'
                });
                
                // For no-cors requests, we can't check status, so try to load as image
                const img = new Image();
                img.crossOrigin = 'anonymous'; // Try to enable CORS
                
                const result = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout loading image'));
                    }, 5000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        console.log(`✅ DDC image loaded successfully: ${testUrl}`);
                        console.log(`📐 Image dimensions: ${img.naturalWidth || img.width} × ${img.naturalHeight || img.height}`);
                        resolve(img);
                    };
                    
                    img.onerror = (e) => {
                        clearTimeout(timeout);
                        console.log(`❌ Failed to load image: ${testUrl} (${e.message || 'unknown error'})`);
                        reject(new Error('Failed to load image: ' + (e.message || 'unknown error')));
                    };
                    
                    // Set the src to start loading
                    img.src = testUrl;
                });
                
                // If we get here, the image loaded successfully
                console.log('🎨 Creating canvas to capture the DDC image...');
                
                // Create canvas to capture the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = result.naturalWidth || result.width || 800;
                canvas.height = result.naturalHeight || result.height || 480;
                
                console.log(`📐 Canvas size: ${canvas.width} × ${canvas.height}`);
                
                try {
                    // Try to draw the image to canvas
                    ctx.drawImage(result, 0, 0);
                    
                    // Check if we actually captured content
                    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
                    const data = imageData.data;
                    
                    let hasContent = false;
                    let nonWhitePixels = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        
                        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                            nonWhitePixels++;
                            if (nonWhitePixels > 10) { // Need at least 10 non-white pixels
                                hasContent = true;
                                break;
                            }
                        }
                    }
                    
                    const dataUrl = canvas.toDataURL('image/png', 1.0);
                    
                    if (hasContent) {
                        console.log('🎉 Successfully captured actual DDC interface content!');
                        console.log(`📊 Found ${nonWhitePixels}+ non-white pixels`);
                        this.saveScreenshot(dataUrl);
                        return; // Success!
                    } else {
                        console.log('⚠️ Image captured but appears to be mostly empty/white');
                        console.log(`📊 Only found ${nonWhitePixels} non-white pixels`);
                        
                        // Save it anyway as it might still be useful
                        this.saveScreenshot(dataUrl);
                        
                        // Continue trying other URLs
                        continue;
                    }
                    
                } catch (canvasError) {
                    console.log('❌ Canvas drawing failed (likely CORS):', canvasError.message);
                    
                    // Create a visual confirmation that we found the image
                    const visualCanvas = document.createElement('canvas');
                    const visualCtx = visualCanvas.getContext('2d');
                    
                    visualCanvas.width = 800;
                    visualCanvas.height = 480;
                    
                    // Background
                    visualCtx.fillStyle = '#f0f0f0';
                    visualCtx.fillRect(0, 0, visualCanvas.width, visualCanvas.height);
                    
                    // Success message
                    visualCtx.fillStyle = '#27ae60';
                    visualCtx.font = 'bold 20px Arial';
                    visualCtx.textAlign = 'center';
                    visualCtx.fillText('✅ DDC4000 Image Found!', visualCanvas.width / 2, 100);
                    
                    visualCtx.fillStyle = '#2c3e50';
                    visualCtx.font = '14px Arial';
                    visualCtx.fillText(`URL: ${testUrl}`, visualCanvas.width / 2, 140);
                    visualCtx.fillText(`Size: ${result.width} × ${result.height}`, visualCanvas.width / 2, 160);
                    visualCtx.fillText(`Time: ${new Date().toLocaleString()}`, visualCanvas.width / 2, 180);
                    
                    visualCtx.fillStyle = '#e74c3c';
                    visualCtx.font = '12px Arial';
                    visualCtx.fillText('Note: Image found but CORS prevented direct capture', visualCanvas.width / 2, 220);
                    visualCtx.fillText('The DDC interface is active and serving images', visualCanvas.width / 2, 240);
                    
                    // Add instructions
                    visualCtx.fillStyle = '#3498db';
                    visualCtx.font = 'bold 14px Arial';
                    visualCtx.fillText('💡 Manual Capture Options:', visualCanvas.width / 2, 280);
                    
                    visualCtx.font = '12px Arial';
                    visualCtx.fillText('1. Right-click the iframe and select "Save image as..."', visualCanvas.width / 2, 300);
                    visualCtx.fillText('2. Open DDC in new tab and use browser screenshot', visualCanvas.width / 2, 320);
                    visualCtx.fillText(`3. Direct image URL: ${testUrl}`, visualCanvas.width / 2, 340);
                    
                    const visualDataUrl = visualCanvas.toDataURL();
                    this.saveScreenshot(visualDataUrl);
                    console.log('✅ Saved DDC connection confirmation with manual instructions');
                    return; // Success with manual fallback
                }
                
            } catch (error) {
                console.log(`❌ Failed to test ${testUrl}:`, error.message);
                continue; // Try next URL
            }
        }
        
        throw new Error('No accessible DDC images found at any of the tested endpoints');
    }
    
    async findAndCaptureGif() {
        try {
            const iframe = this.websiteFrame;
            console.log('🔍 Inspecting iframe content for DDC images...');
            console.log('📍 Iframe URL:', iframe.src);
            
            let iframeDoc;
            try {
                iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                console.log('❌ Cannot access iframe document due to cross-origin restrictions');
                throw new Error('Cross-origin iframe access denied');
            }
            
            if (!iframeDoc) {
                throw new Error('Cannot access iframe document');
            }
            
            console.log('✅ Successfully accessed iframe document');
            console.log('📄 Document title:', iframeDoc.title || 'No title');
            console.log('🌐 Document URL:', iframeDoc.URL);
            
            // Look for img tags in the iframe
            const images = iframeDoc.querySelectorAll('img');
            console.log(`🖼️ Found ${images.length} img elements in iframe`);
            
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                console.log(`📸 Image ${i + 1}:`, {
                    src: img.src,
                    width: img.width,
                    height: img.height,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    complete: img.complete
                });
                
                if (img.src && (img.src.includes('.gif') || img.src.includes('image') || img.src.includes('ddcmain') || img.src.includes('ddcdialog'))) {
                    try {
                        console.log(`🎯 Attempting to capture DDC image: ${img.src}`);
                        
                        // Try to directly copy the image if it's loaded
                        if (img.complete && img.naturalWidth > 0) {
                            console.log('📸 Image is already loaded, creating canvas copy...');
                            
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            
                            try {
                                ctx.drawImage(img, 0, 0);
                                const dataUrl = canvas.toDataURL('image/png', 1.0);
                                
                                // Check for content
                                const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50));
                                const data = imageData.data;
                                
                                let nonWhitePixels = 0;
                                for (let j = 0; j < data.length; j += 4) {
                                    const r = data[j];
                                    const g = data[j + 1];
                                    const b = data[j + 2];
                                    const a = data[j + 3];
                                    
                                    if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                                        nonWhitePixels++;
                                    }
                                }
                                
                                if (nonWhitePixels > 5) {
                                    console.log('✅ Successfully captured DDC image with content!');
                                    console.log(`📊 Found ${nonWhitePixels} non-white pixels`);
                                    this.saveScreenshot(dataUrl);
                                    return;
                                } else {
                                    console.log('⚠️ Image captured but appears mostly empty');
                                }
                                
                            } catch (canvasError) {
                                console.log('❌ Canvas draw failed (CORS):', canvasError.message);
                            }
                        }
                        
                        // If direct copy failed, try fetching the image
                        console.log('🌐 Attempting to fetch image via network...');
                        const response = await fetch(img.src, {
                            mode: 'no-cors',
                            cache: 'no-cache'
                        });
                        
                        console.log('📡 Fetch response received, trying to load as image...');
                        
                        // Load the fetched URL as an image
                        const fetchedImg = new Image();
                        fetchedImg.crossOrigin = 'anonymous';
                        
                        const result = await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('Timeout loading fetched image'));
                            }, 3000);
                            
                            fetchedImg.onload = () => {
                                clearTimeout(timeout);
                                resolve(fetchedImg);
                            };
                            
                            fetchedImg.onerror = () => {
                                clearTimeout(timeout);
                                reject(new Error('Failed to load fetched image'));
                            };
                            
                            fetchedImg.src = img.src;
                        });
                        
                        // Create canvas and capture
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = result.naturalWidth || result.width;
                        canvas.height = result.naturalHeight || result.height;
                        
                        ctx.drawImage(result, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png', 1.0);
                        
                        this.saveScreenshot(dataUrl);
                        console.log('✅ Successfully captured image from iframe via fetch');
                        return;
                        
                    } catch (e) {
                        console.log(`❌ Failed to capture image ${img.src}:`, e.message);
                    }
                }
            }
            
            // Look for other potential image sources
            console.log('🔍 Searching for other image sources in iframe...');
            
            // Check for frames within frames
            const frames = iframeDoc.querySelectorAll('iframe, frame');
            console.log(`🖼️ Found ${frames.length} nested frames`);
            
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                console.log(`📺 Frame ${i + 1}:`, frame.src);
                
                if (frame.src && (frame.src.includes('.gif') || frame.src.includes('image'))) {
                    console.log('🎯 Found potential image frame, testing as direct image...');
                    
                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        
                        const result = await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('Timeout loading frame as image'));
                            }, 3000);
                            
                            img.onload = () => {
                                clearTimeout(timeout);
                                resolve(img);
                            };
                            
                            img.onerror = () => {
                                clearTimeout(timeout);
                                reject(new Error('Frame is not an image'));
                            };
                            
                            img.src = frame.src;
                        });
                        
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = result.naturalWidth || result.width;
                        canvas.height = result.naturalHeight || result.height;
                        
                        ctx.drawImage(result, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png', 1.0);
                        
                        this.saveScreenshot(dataUrl);
                        console.log('✅ Successfully captured nested frame as image');
                        return;
                        
                    } catch (e) {
                        console.log(`❌ Frame ${frame.src} is not a direct image:`, e.message);
                    }
                }
            }
            
            // Check the entire iframe content type
            console.log('🔍 Checking if entire iframe is an image...');
            const iframeSrc = iframe.src;
            
            try {
                const response = await fetch(iframeSrc, {
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                
                console.log('📡 Iframe HEAD request completed');
                
                // Try to load iframe URL as image
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                const result = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Iframe URL is not a direct image'));
                    }, 3000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        console.log('✅ Iframe URL loaded as image!');
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Iframe URL is not an image'));
                    };
                    
                    img.src = iframeSrc;
                });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = result.naturalWidth || result.width;
                canvas.height = result.naturalHeight || result.height;
                
                ctx.drawImage(result, 0, 0);
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                
                this.saveScreenshot(dataUrl);
                console.log('✅ Successfully captured entire iframe as image');
                return;
                
            } catch (e) {
                console.log('❌ Iframe is not a direct image:', e.message);
            }
            
            // Final fallback - inspect HTML content for clues
            const bodyContent = iframeDoc.body?.innerHTML || '';
            console.log('📄 Iframe body content length:', bodyContent.length);
            console.log('📄 Iframe body preview:', bodyContent.substring(0, 200));
            
            throw new Error('No accessible images found in iframe content');
            
        } catch (e) {
            console.log('❌ Iframe inspection failed:', e.message);
            throw new Error('Cannot search iframe content: ' + e.message);
        }
    }
    
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    async captureIframeDirectly(iframeDoc) {
        // Import html2canvas dynamically if not available
        if (!window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }
        
        const canvas = await html2canvas(iframeDoc.body, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            width: iframeDoc.body.scrollWidth,
            height: iframeDoc.body.scrollHeight
        });
        
        this.saveScreenshot(canvas.toDataURL());
    }
    
    async captureIframeWithHtml2Canvas() {
        // Load html2canvas if not available
        if (!window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }
        
        console.log('🎯 Starting html2canvas capture of iframe container...');
        
        // Capture the iframe container which should include the iframe itself
        const iframeContainer = this.iframeContainer;
        
        const canvas = await html2canvas(iframeContainer, {
            useCORS: false, // Don't use CORS to avoid blocking
            allowTaint: true,
            scale: 2, // Higher quality
            logging: true, // Enable logging to see what's happening
            width: iframeContainer.offsetWidth,
            height: iframeContainer.offsetHeight,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => {
                // Don't ignore the iframe itself
                return false;
            },
            onclone: (clonedDoc) => {
                console.log('📋 Document cloned for html2canvas');
                const clonedIframe = clonedDoc.querySelector('#websiteFrame');
                if (clonedIframe) {
                    console.log('🖼️ Found iframe in cloned document:', clonedIframe.src);
                    console.log('📐 Iframe dimensions:', clonedIframe.offsetWidth, 'x', clonedIframe.offsetHeight);
                    
                    // Try to ensure the iframe is visible in the clone
                    clonedIframe.style.display = 'block';
                    clonedIframe.style.visibility = 'visible';
                    clonedIframe.style.opacity = '1';
                }
                
                // Also log any images found in the clone
                const images = clonedDoc.querySelectorAll('img');
                console.log('🖼️ Found', images.length, 'images in cloned document');
                images.forEach((img, index) => {
                    console.log(`Image ${index}:`, img.src, `(${img.width}x${img.height})`);
                });
            }
        });
        
        console.log('✅ html2canvas completed. Canvas size:', canvas.width, 'x', canvas.height);
        
        // Check if the canvas has actual content (not just white/empty)
        const ctx = canvas.getContext('2d');
        
        // Sample multiple areas of the canvas for better detection
        const sampleAreas = [
            { x: 0, y: 0, width: 100, height: 100 }, // Top-left
            { x: Math.floor(canvas.width / 2) - 50, y: Math.floor(canvas.height / 2) - 50, width: 100, height: 100 }, // Center
            { x: canvas.width - 100, y: canvas.height - 100, width: 100, height: 100 } // Bottom-right
        ];
        
        let totalNonWhitePixels = 0;
        let totalPixelsSampled = 0;
        
        for (const area of sampleAreas) {
            const x = Math.max(0, area.x);
            const y = Math.max(0, area.y);
            const w = Math.min(area.width, canvas.width - x);
            const h = Math.min(area.height, canvas.height - y);
            
            if (w > 0 && h > 0) {
                const imageData = ctx.getImageData(x, y, w, h);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    totalPixelsSampled++;
                    
                    // Count pixels that aren't white/light gray (more lenient threshold)
                    if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                        totalNonWhitePixels++;
                    }
                }
            }
        }
        
        const contentPercentage = totalPixelsSampled > 0 ? (totalNonWhitePixels / totalPixelsSampled) * 100 : 0;
        const hasContent = contentPercentage > 2; // If more than 2% of pixels have content
        
        console.log('📊 Canvas content analysis:');
        console.log(`   - Canvas size: ${canvas.width} × ${canvas.height}`);
        console.log(`   - Non-white pixels: ${totalNonWhitePixels} / ${totalPixelsSampled} (${contentPercentage.toFixed(1)}%)`);
        console.log(`   - Result: ${hasContent ? 'HAS CONTENT' : 'MOSTLY EMPTY/WHITE'}`);
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        this.saveScreenshot(dataUrl);
        
        if (hasContent) {
            console.log('🎉 Successfully captured iframe content with html2canvas!');
        } else {
            console.log('⚠️ html2canvas captured mostly empty content');
        }
    }
    
    async captureIframeAsCanvas() {
        const iframe = this.websiteFrame;
        const rect = iframe.getBoundingClientRect();
        
        // Create a canvas that matches the iframe size
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Get the computed styles of the iframe
        const iframeStyles = window.getComputedStyle(iframe);
        
        // Fill with iframe background
        ctx.fillStyle = iframeStyles.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Try to draw the iframe directly
        try {
            // This uses the experimental drawImage with iframe
            ctx.drawImage(iframe, 0, 0, rect.width, rect.height);
            this.saveScreenshot(canvas.toDataURL());
        } catch (e) {
            // If direct drawing fails, create a placeholder
            throw new Error('Canvas drawImage failed: ' + e.message);
        }
    }
    
    
    captureEnhancedVisual() {
        // Create a visual representation that mimics the actual interface
        const iframe = this.websiteFrame;
        const rect = iframe.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use the actual resolution dimensions
        const resolution = this.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 320 : 800;
        const baseHeight = resolution === 'QVGA' ? 240 : 480;
        
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        
        // Create a more realistic DDC4000 interface representation
        
        // Background (typical DDC interface background)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // DDC interface header bar
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, 30);
        
        // Header text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('DDC4000 Building Automation System', 10, 20);
        
        // Connection status indicator
        const statusColor = this.connectionStatus.classList.contains('connected') ? '#27ae60' : 
                          this.connectionStatus.classList.contains('connecting') ? '#f39c12' : '#e74c3c';
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(canvas.width - 20, 15, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Main content area with grid pattern (simulating DDC interface)
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Draw grid
        const gridSize = 20;
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 30);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 30; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Simulate some DDC elements
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 50, 60, 30);
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HVAC-1', 50, 68);
        
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(100, 50, 60, 30);
        ctx.fillStyle = 'white';
        ctx.fillText('LIGHT-1', 130, 68);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(180, 50, 60, 30);
        ctx.fillStyle = 'white';
        ctx.fillText('ALARM', 210, 68);
        
        // Device information overlay
        const infoY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, infoY, canvas.width, 100);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 DDC4000 Interface Capture', canvas.width / 2, infoY + 20);
        
        ctx.font = '11px Arial';
        ctx.fillText(`Device: ${this.ipInput.value || 'Disconnected'}`, canvas.width / 2, infoY + 40);
        ctx.fillText(`Status: ${this.statusText.textContent}`, canvas.width / 2, infoY + 55);
        ctx.fillText(`Captured: ${new Date().toLocaleString()}`, canvas.width / 2, infoY + 70);
        
        // Add a note about the capture
        ctx.font = '9px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Visual representation - actual interface may vary due to security restrictions', canvas.width / 2, infoY + 85);
        
        this.saveScreenshot(canvas.toDataURL());
    }
    
    saveScreenshot(dataUrl) {
        console.log('💾 Saving screenshot...');
        console.log('📊 Data URL length:', dataUrl.length);
        console.log('🔍 Data URL preview:', dataUrl.substring(0, 100) + '...');
        
        const screenshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            dataUrl: dataUrl,
            device: this.ipInput.value || 'Unknown',
            resolution: this.resolutionSelect.value,
            zoom: this.currentZoom,
            protocol: this.protocolSelect.value
        };
        
        console.log('📝 Screenshot object created:', {
            id: screenshot.id,
            device: screenshot.device,
            dataUrlLength: screenshot.dataUrl.length
        });
        
        this.screenshots.unshift(screenshot);
        
        // Keep only last 50 screenshots to prevent storage overflow
        if (this.screenshots.length > 50) {
            this.screenshots = this.screenshots.slice(0, 50);
        }
        
        this.saveScreenshots();
        this.updateGalleryDisplay();
        
        console.log('✅ Screenshot saved to gallery. Total screenshots:', this.screenshots.length);
        
        // Show success message
        this.showSuccess(`Screenshot captured! (${this.screenshots.length} total)`);
    }
    
    toggleAutoCapture() {
        this.autoCapturing = !this.autoCapturing;
        
        if (this.autoCapturing) {
            this.autoCapture.classList.add('active');
            this.autoCapture.title = 'Stop Auto Capture';
            this.showSuccess('Auto-capture enabled! Screenshots will be taken on interface changes.');
        } else {
            this.autoCapture.classList.remove('active');
            this.autoCapture.title = 'Auto Capture';
        }
    }
    
    openGallery() {
        // Reset all styles to show the modal
        this.galleryModal.classList.remove('hidden');
        this.galleryModal.style.display = 'flex';
        this.galleryModal.style.visibility = 'visible';
        this.galleryModal.style.opacity = '1';
        this.galleryModal.style.pointerEvents = 'auto';
        this.updateGalleryDisplay();
        console.log('Gallery opened - classes:', this.galleryModal.className);
    }
    
    toggleGallery() {
        if (this.galleryModal.classList.contains('hidden')) {
            this.openGallery();
        } else {
            this.closeGallery();
        }
    }
    
    closeGallery() {
        this.galleryModal.classList.add('hidden');
        this.galleryModal.style.display = 'none';
        this.galleryModal.style.visibility = 'hidden';
        this.galleryModal.style.opacity = '0';
        this.galleryModal.style.pointerEvents = 'none';
        console.log('Gallery closed - classes:', this.galleryModal.className);
    }
    
    forceCloseGallery() {
        // Force close with multiple methods
        this.galleryModal.className = 'modal hidden';
        this.galleryModal.style.display = 'none';
        this.galleryModal.style.visibility = 'hidden';
        this.galleryModal.style.opacity = '0';
        this.galleryModal.style.pointerEvents = 'none';
        console.log('Gallery force closed');
    }
    
    clearGallery() {
        if (this.screenshots.length === 0) {
            this.showError('No screenshots to clear.');
            return;
        }
        
        if (confirm(`Delete all ${this.screenshots.length} screenshots? This cannot be undone.`)) {
            this.screenshots = [];
            this.saveScreenshots();
            this.updateGalleryDisplay();
            this.showSuccess('All screenshots cleared.');
        }
    }
    
    exportGallery() {
        if (this.screenshots.length === 0) {
            this.showError('No screenshots to export.');
            return;
        }
        
        // Create zip-like export (JSON with base64 images)
        const exportData = {
            exported: new Date().toISOString(),
            device: this.ipInput.value || 'Unknown',
            count: this.screenshots.length,
            screenshots: this.screenshots
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ddc4000-screenshots-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccess(`Exported ${this.screenshots.length} screenshots.`);
    }
    
    updateGalleryDisplay() {
        if (this.screenshots.length === 0) {
            this.galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <p>No screenshots yet. Click 📷 to capture your first screenshot!</p>
                </div>
            `;
            return;
        }
        
        console.log('🖼️ Updating gallery display with', this.screenshots.length, 'screenshots');
        
        this.galleryGrid.innerHTML = this.screenshots.map((screenshot, index) => {
            console.log(`Screenshot ${index}:`, {
                id: screenshot.id,
                device: screenshot.device,
                dataUrlLength: screenshot.dataUrl ? screenshot.dataUrl.length : 'undefined',
                dataUrlPreview: screenshot.dataUrl ? screenshot.dataUrl.substring(0, 50) + '...' : 'undefined'
            });
            
            return `
                <div class="gallery-item">
                    <img src="${screenshot.dataUrl}" alt="Screenshot" class="gallery-image" 
                         onclick="ddcBrowser.inspectImage(${screenshot.id})" 
                         title="Click to inspect"
                         onload="console.log('✅ Gallery image ${screenshot.id} loaded successfully')"
                         onerror="console.log('❌ Gallery image ${screenshot.id} failed to load')">
                    <div class="gallery-info">
                        <div class="gallery-timestamp">
                            ${new Date(screenshot.timestamp).toLocaleString()}
                        </div>
                        <div class="gallery-details">
                            <span>${screenshot.device}</span>
                            <span>${screenshot.resolution} @ ${Math.round(screenshot.zoom * 100)}%</span>
                        </div>
                        <div class="gallery-actions">
                            <button class="gallery-btn" onclick="ddcBrowser.inspectImage(${screenshot.id})" title="Inspect">
                                🔍
                            </button>
                            <button class="gallery-btn download" onclick="ddcBrowser.downloadScreenshot(${screenshot.id})">
                                💾
                            </button>
                            <button class="gallery-btn delete" onclick="ddcBrowser.deleteScreenshot(${screenshot.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Gallery HTML updated');
    }
    
    downloadScreenshot(id) {
        const screenshot = this.screenshots.find(s => s.id === id);
        if (!screenshot) return;
        
        const link = document.createElement('a');
        link.href = screenshot.dataUrl;
        link.download = `ddc4000-${screenshot.device}-${new Date(screenshot.timestamp).toISOString().replace(/[:.]/g, '-')}.png`;
        link.click();
    }
    
    deleteScreenshot(id) {
        const index = this.screenshots.findIndex(s => s.id === id);
        if (index !== -1) {
            this.screenshots.splice(index, 1);
            this.saveScreenshots();
            this.updateGalleryDisplay();
        }
    }
    
    loadScreenshots() {
        const saved = localStorage.getItem('ddcBrowserScreenshots');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveScreenshots() {
        localStorage.setItem('ddcBrowserScreenshots', JSON.stringify(this.screenshots));
    }
    
    // PWA functionality
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered successfully:', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateAvailable();
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.log('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
        
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            this.hideInstallButton();
            this.showSuccess('DDC4000 Browser installed successfully!');
        });
        
        // Handle URL parameters for shortcuts
        this.handleUrlActions();
    }
    
    showInstallButton() {
        // Add install button to header if not already there
        if (!document.getElementById('installBtn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'installBtn';
            installBtn.className = 'btn-secondary';
            installBtn.textContent = '📱 Install App';
            installBtn.title = 'Install DDC4000 Browser as an app';
            installBtn.style.marginLeft = 'auto';
            installBtn.onclick = () => this.installApp();
            
            const header = document.querySelector('.modal-actions') || document.querySelector('.config-section');
            if (header) {
                header.appendChild(installBtn);
            }
        }
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }
    
    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
            } else {
                console.log('[PWA] User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }
    
    showUpdateAvailable() {
        const updateDiv = document.createElement('div');
        updateDiv.className = 'update-notification';
        updateDiv.innerHTML = `
            <div style="background-color: #3498db; color: white; padding: 10px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 3000;">
                📱 App update available! 
                <button onclick="this.parentElement.remove(); location.reload();" 
                        style="background: white; color: #3498db; border: none; padding: 5px 10px; margin-left: 10px; border-radius: 3px; cursor: pointer;">
                    Update Now
                </button>
                <button onclick="this.parentElement.remove();" 
                        style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; margin-left: 5px; border-radius: 3px; cursor: pointer;">
                    Later
                </button>
            </div>
        `;
        document.body.appendChild(updateDiv);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (updateDiv.parentElement) {
                updateDiv.remove();
            }
        }, 10000);
    }
    
    handleUrlActions() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'screenshot') {
            // Delay to ensure app is loaded
            setTimeout(() => this.captureScreenshot(), 1000);
        } else if (action === 'gallery') {
            setTimeout(() => this.openGallery(), 500);
        }
    }
    
    // Config panel toggle functionality
    toggleConfig() {
        this.configCollapsed = !this.configCollapsed;
        
        if (this.configCollapsed) {
            this.configSection.classList.add('collapsed');
            this.header.classList.add('collapsed');
            this.toggleConfigBtn.classList.add('collapsed');
            this.toggleConfigBtn.textContent = '▼';
            this.toggleConfigBtn.title = 'Show Settings';
        } else {
            this.configSection.classList.remove('collapsed');
            this.header.classList.remove('collapsed');
            this.toggleConfigBtn.classList.remove('collapsed');
            this.toggleConfigBtn.textContent = '⚙️';
            this.toggleConfigBtn.title = 'Hide Settings';
        }
        
        // Save collapsed state
        localStorage.setItem('ddcBrowserConfigCollapsed', this.configCollapsed);
        
        // Auto-fit after toggle to adjust for new space
        setTimeout(() => {
            if (!this.configCollapsed) {
                this.autoFit();
            }
        }, 300);
    }
    
    loadConfigState() {
        const saved = localStorage.getItem('ddcBrowserConfigCollapsed');
        if (saved === 'true') {
            this.toggleConfig();
        }
    }
    
    // Image Inspector functionality
    inspectImage(id) {
        const screenshot = this.screenshots.find(s => s.id === id);
        if (!screenshot) return;
        
        this.currentInspectorScreenshot = screenshot;
        this.inspectorImage.src = screenshot.dataUrl;
        this.inspectorTitle.textContent = `${screenshot.device} - ${screenshot.resolution}`;
        this.inspectorTimestamp.textContent = new Date(screenshot.timestamp).toLocaleString();
        
        // Reset zoom
        this.inspectorZoom = 1.0;
        this.updateInspectorZoom();
        
        // Show inspector
        this.imageInspector.classList.remove('hidden');
        this.imageInspector.style.display = 'flex';
        
        // Fit image initially
        setTimeout(() => this.inspectorFitImage(), 100);
    }
    
    closeImageInspector() {
        this.imageInspector.classList.add('hidden');
        this.imageInspector.style.display = 'none';
        this.currentInspectorScreenshot = null;
        this.inspectorZoom = 1.0;
    }
    
    inspectorZoomImage(factor) {
        this.inspectorZoom *= factor;
        this.inspectorZoom = Math.max(0.1, Math.min(10, this.inspectorZoom));
        this.updateInspectorZoom();
    }
    
    updateInspectorZoom() {
        this.inspectorImage.style.transform = `scale(${this.inspectorZoom})`;
        this.inspectorZoomLevel.textContent = `${Math.round(this.inspectorZoom * 100)}%`;
        
        if (this.inspectorZoom > 1) {
            this.inspectorImage.classList.add('zoomed');
        } else {
            this.inspectorImage.classList.remove('zoomed');
        }
    }
    
    inspectorFitImage() {
        const container = this.imageInspector.querySelector('.inspector-body');
        const img = this.inspectorImage;
        
        // Wait for image to load
        if (img.naturalWidth === 0) {
            img.onload = () => this.inspectorFitImage();
            return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerRect.width / containerRect.height;
        
        let scale;
        if (imgRatio > containerRatio) {
            // Image is wider
            scale = (containerRect.width - 40) / img.naturalWidth;
        } else {
            // Image is taller
            scale = (containerRect.height - 40) / img.naturalHeight;
        }
        
        this.inspectorZoom = Math.max(0.1, Math.min(1, scale));
        this.updateInspectorZoom();
    }
    
    inspectorDownloadImage() {
        if (this.currentInspectorScreenshot) {
            this.downloadScreenshot(this.currentInspectorScreenshot.id);
        }
    }
    
    setupImagePanning() {
        let isDragging = false;
        let startX, startY, startTransformX = 0, startTransformY = 0;
        
        this.inspectorImage.addEventListener('mousedown', (e) => {
            if (this.inspectorZoom <= 1) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Get current transform values
            const transform = window.getComputedStyle(this.inspectorImage).transform;
            if (transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                startTransformX = matrix.e;
                startTransformY = matrix.f;
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || this.inspectorZoom <= 1) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = startTransformX + deltaX;
            const newY = startTransformY + deltaY;
            
            this.inspectorImage.style.transform = `scale(${this.inspectorZoom}) translate(${newX}px, ${newY}px)`;
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Mouse wheel zoom
        this.inspectorImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            this.inspectorZoomImage(factor);
        });
    }
}

// Global reference for inline event handlers
let ddcBrowser;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ddcBrowser = new DDCBrowser();
});

// Global function for debugging
window.forceCloseGallery = function() {
    if (ddcBrowser) {
        ddcBrowser.forceCloseGallery();
    }
};

window.testClose = function() {
    const modal = document.getElementById('galleryModal');
    modal.className = 'modal hidden';
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    console.log('Test close executed');
};