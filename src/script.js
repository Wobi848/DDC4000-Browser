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
        
        this.presets = this.loadPresets();
        this.loadStartTime = null;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
        this.autoCapturing = false;
        this.screenshots = this.loadScreenshots();
        this.deferredPrompt = null;
        
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
        this.captureBtn.addEventListener('click', () => this.captureScreenshot());
        this.galleryBtn.addEventListener('click', () => this.openGallery());
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
                    this.openGallery();
                    break;
            }
        }
    }
    
    // Screenshot functionality
    async captureScreenshot() {
        try {
            this.captureBtn.textContent = '⏳';
            this.captureBtn.disabled = true;
            
            // Create canvas to capture the iframe content
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get iframe dimensions
            const iframe = this.websiteFrame;
            const iframeRect = iframe.getBoundingClientRect();
            
            // Set canvas size to iframe size
            canvas.width = iframeRect.width;
            canvas.height = iframeRect.height;
            
            // Try to capture iframe content (works for same-origin)
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeBody = iframeDoc.body;
                
                // Use html2canvas if available, otherwise fallback
                if (window.html2canvas) {
                    const canvas = await html2canvas(iframeBody);
                    this.saveScreenshot(canvas.toDataURL());
                } else {
                    // Fallback: capture the container
                    this.captureContainerScreenshot();
                }
            } catch (e) {
                // Cross-origin restriction, capture the container instead
                this.captureContainerScreenshot();
            }
            
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            this.showError('Screenshot capture failed. The interface may be cross-origin.');
        } finally {
            this.captureBtn.textContent = '📷';
            this.captureBtn.disabled = false;
        }
    }
    
    captureContainerScreenshot() {
        // Fallback method: use HTML5 canvas to capture visible content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const container = this.iframeContainer;
        const containerRect = container.getBoundingClientRect();
        
        canvas.width = containerRect.width;
        canvas.height = containerRect.height;
        
        // Draw a placeholder screenshot
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add frame outline
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Add timestamp and info
        const now = new Date();
        const timestamp = now.toLocaleString();
        
        ctx.fillStyle = '#495057';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DDC4000 Interface Screenshot', canvas.width / 2, 40);
        
        ctx.font = '12px Arial';
        ctx.fillText(`Captured: ${timestamp}`, canvas.width / 2, 60);
        ctx.fillText(`Device: ${this.ipInput.value || 'Not Connected'}`, canvas.width / 2, 80);
        ctx.fillText(`Resolution: ${this.resolutionSelect.value}`, canvas.width / 2, 100);
        ctx.fillText(`Zoom: ${Math.round(this.currentZoom * 100)}%`, canvas.width / 2, 120);
        
        // Note about cross-origin
        ctx.fillStyle = '#6c757d';
        ctx.font = '10px Arial';
        ctx.fillText('Note: Cross-origin restrictions prevent direct iframe capture', canvas.width / 2, canvas.height - 20);
        
        this.saveScreenshot(canvas.toDataURL());
    }
    
    saveScreenshot(dataUrl) {
        const screenshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            dataUrl: dataUrl,
            device: this.ipInput.value || 'Unknown',
            resolution: this.resolutionSelect.value,
            zoom: this.currentZoom,
            protocol: this.protocolSelect.value
        };
        
        this.screenshots.unshift(screenshot);
        
        // Keep only last 50 screenshots to prevent storage overflow
        if (this.screenshots.length > 50) {
            this.screenshots = this.screenshots.slice(0, 50);
        }
        
        this.saveScreenshots();
        this.updateGalleryDisplay();
        
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
        
        this.galleryGrid.innerHTML = this.screenshots.map(screenshot => `
            <div class="gallery-item">
                <img src="${screenshot.dataUrl}" alt="Screenshot" class="gallery-image" 
                     onclick="this.style.objectFit = this.style.objectFit === 'cover' ? 'contain' : 'cover'">
                <div class="gallery-info">
                    <div class="gallery-timestamp">
                        ${new Date(screenshot.timestamp).toLocaleString()}
                    </div>
                    <div class="gallery-details">
                        <span>${screenshot.device}</span>
                        <span>${screenshot.resolution} @ ${Math.round(screenshot.zoom * 100)}%</span>
                    </div>
                    <div class="gallery-actions">
                        <button class="gallery-btn download" onclick="ddcBrowser.downloadScreenshot(${screenshot.id})">
                            Download
                        </button>
                        <button class="gallery-btn delete" onclick="ddcBrowser.deleteScreenshot(${screenshot.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
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