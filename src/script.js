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
        this.captureBtn.addEventListener('click', () => this.captureScreenshot());
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
    
    // Screenshot functionality
    async captureScreenshot() {
        try {
            this.captureBtn.textContent = '⏳';
            this.captureBtn.disabled = true;
            
            // Method 1: Try html2canvas on the entire iframe container
            try {
                console.log('✅ Attempting html2canvas iframe container capture');
                await this.captureIframeWithHtml2Canvas();
                return;
            } catch (e) {
                console.log('❌ html2canvas container failed:', e.message);
            }
            
            // Method 2: Try direct iframe content access (same-origin)
            try {
                const iframe = this.websiteFrame;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                if (iframeDoc && iframeDoc.body) {
                    console.log('✅ Capturing iframe content directly');
                    await this.captureIframeDirectly(iframeDoc);
                    return;
                }
            } catch (e) {
                console.log('❌ Direct access failed:', e.message);
            }
            
            // Method 3: Try canvas drawing of iframe area
            try {
                console.log('✅ Attempting canvas iframe capture');
                await this.captureIframeAsCanvas();
                return;
            } catch (e) {
                console.log('❌ Canvas capture failed:', e.message);
            }
            
            // Method 4: Create a better visual representation
            console.log('📝 Using enhanced visual capture');
            this.captureEnhancedVisual();
            
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            this.showError('Screenshot capture failed. Creating visual representation instead.');
            this.captureEnhancedVisual();
        } finally {
            this.captureBtn.textContent = '📷';
            this.captureBtn.disabled = false;
        }
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
        
        // Capture the iframe container which should include the iframe itself
        const iframeContainer = this.iframeContainer;
        
        const canvas = await html2canvas(iframeContainer, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            logging: false,
            ignoreElements: (element) => {
                // Don't ignore the iframe itself
                return false;
            },
            onclone: (clonedDoc) => {
                // Try to access the iframe in the cloned document
                const clonedIframe = clonedDoc.querySelector('#websiteFrame');
                if (clonedIframe) {
                    console.log('Found iframe in cloned document');
                }
            }
        });
        
        this.saveScreenshot(canvas.toDataURL());
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
        
        this.galleryGrid.innerHTML = this.screenshots.map(screenshot => `
            <div class="gallery-item">
                <img src="${screenshot.dataUrl}" alt="Screenshot" class="gallery-image" 
                     onclick="ddcBrowser.inspectImage(${screenshot.id})" 
                     title="Click to inspect">
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