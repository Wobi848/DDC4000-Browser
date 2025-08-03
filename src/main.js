// Main DDC Browser application
import { ScreenshotManager } from './modules/screenshot.js';
import { GalleryManager } from './modules/gallery.js';
import { PresetManager } from './modules/presets.js';
import { ZoomManager } from './modules/zoom.js';

class DDCBrowser {
    constructor() {
        this.initializeElements();
        this.initializeManagers();
        this.initializeEventListeners();
        this.initializePWA();
        
        this.loadStartTime = null;
        this.deferredPrompt = null;
        this.configCollapsed = false;
        
        this.init();
    }

    initializeElements() {
        // Form elements
        this.protocolSelect = document.getElementById('protocolSelect');
        this.ipInput = document.getElementById('ipInput');
        this.resolutionSelect = document.getElementById('resolutionSelect');
        this.presetSelect = document.getElementById('presetSelect');
        this.presetName = document.getElementById('presetName');
        this.autoloadPresetSelect = document.getElementById('autoloadPresetSelect');
        this.loadBtn = document.getElementById('loadBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.savePresetBtn = document.getElementById('savePresetBtn');
        this.deletePresetBtn = document.getElementById('deletePresetBtn');
        
        // Display elements
        this.websiteFrame = document.getElementById('websiteFrame');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.successMessage = document.getElementById('successMessage');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.loadTime = document.getElementById('loadTime');
        this.ipSuggestions = document.getElementById('ipSuggestions');
        
        // Control elements
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.autoFitBtn = document.getElementById('autoFitBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.iframeContainer = document.getElementById('iframeContainer');
        
        // Screenshot elements
        this.captureBtn = document.getElementById('captureBtn');
        this.galleryBtn = document.getElementById('galleryBtn');
        this.galleryModal = document.getElementById('galleryModal');
        this.galleryGrid = document.getElementById('galleryGrid');
        this.closeGalleryBtn = document.getElementById('closeGalleryBtn');
        this.clearGalleryBtn = document.getElementById('clearGalleryBtn');
        this.exportGalleryBtn = document.getElementById('exportGalleryBtn');
        
        // Config elements
        this.toggleConfigBtn = document.getElementById('toggleConfigBtn');
        this.configSection = document.getElementById('configSection');
        this.header = document.querySelector('.header');
        
        // Inspector elements
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
    }

    initializeManagers() {
        this.screenshotManager = new ScreenshotManager(this);
        this.galleryManager = new GalleryManager(this);
        this.presetManager = new PresetManager(this);
        this.zoomManager = new ZoomManager(this);
    }

    initializeEventListeners() {
        // Main controls
        this.loadBtn.addEventListener('click', () => this.loadWebsite());
        this.refreshBtn.addEventListener('click', () => this.refreshWebsite());
        this.savePresetBtn.addEventListener('click', () => this.presetManager.savePreset());
        this.deletePresetBtn.addEventListener('click', () => this.presetManager.deletePreset());
        
        this.presetSelect.addEventListener('change', () => this.presetManager.loadPreset());
        this.autoloadPresetSelect.addEventListener('change', () => this.presetManager.setAutoloadPreset());
        this.ipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadWebsite();
            }
        });
        
        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoomManager.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomManager.zoomOut());
        this.autoFitBtn.addEventListener('click', () => this.zoomManager.autoFit());
        this.fullscreenBtn.addEventListener('click', () => this.zoomManager.toggleFullscreen());
        this.resetZoomBtn.addEventListener('click', () => this.zoomManager.resetZoom());
        
        // Screenshot controls
        this.captureBtn.addEventListener('click', () => this.screenshotManager.handleCaptureClick());
        this.galleryBtn.addEventListener('click', () => this.galleryManager.toggleGallery());
        this.closeGalleryBtn.addEventListener('click', () => this.galleryManager.closeGallery());
        this.clearGalleryBtn.addEventListener('click', () => this.galleryManager.clearGallery());
        this.exportGalleryBtn.addEventListener('click', () => this.galleryManager.exportGallery());
        
        // Modal controls
        this.galleryModal.addEventListener('click', (e) => {
            if (e.target === this.galleryModal) {
                this.galleryManager.closeGallery();
            }
        });
        
        this.imageInspector.addEventListener('click', (e) => {
            if (e.target === this.imageInspector) {
                this.galleryManager.closeInspector();
            }
        });
        
        // Inspector controls
        this.inspectorZoomIn.addEventListener('click', () => this.galleryManager.inspectorZoomIn());
        this.inspectorZoomOut.addEventListener('click', () => this.galleryManager.inspectorZoomOut());
        this.inspectorFit.addEventListener('click', () => this.galleryManager.inspectorFitToScreen());
        this.inspectorDownload.addEventListener('click', () => this.galleryManager.downloadCurrentInspectorImage());
        this.closeInspector.addEventListener('click', () => this.galleryManager.closeInspector());
        
        // Config toggle
        this.toggleConfigBtn.addEventListener('click', () => this.toggleConfig());
        
        // IP suggestions
        this.ipInput.addEventListener('input', () => this.updateIpSuggestions());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializePWA() {
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('PWA install prompt available');
        });
        
        // Service worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    }

    init() {
        this.setConnectionStatus('disconnected', 'Not Connected');
        this.updateIpSuggestions();
        this.galleryManager.updateGalleryDisplay();
        
        // Reset form to clean state
        this.presetSelect.value = '';
        this.ipInput.value = '';
        
        // Load saved config state
        this.loadConfigState();
        
        // Check for URL params first (takes priority over autoload)
        const params = new URLSearchParams(window.location.search);
        if (params.get('ip')) {
            this.ipInput.value = params.get('ip');
            if (params.get('autoload') === 'true') {
                setTimeout(() => this.loadWebsite(), 1000);
            }
        } else {
            // Check and load autoload preset if no URL params
            setTimeout(() => {
                this.presetManager.checkAndLoadAutoPreset();
            }, 500);
        }
    }

    loadConfigState() {
        const saved = localStorage.getItem('ddcBrowserConfigCollapsed');
        if (saved === 'true') {
            this.toggleConfig();
        }
    }

    buildDdcUrl() {
        const protocol = this.protocolSelect.value;
        const ip = this.ipInput.value.trim();
        const resolution = this.resolutionSelect.value;

        if (!ip) {
            return { valid: false, error: 'Please enter an IP address.' };
        }

        // For QVGA, try different URL parameters to improve content positioning
        let url;
        if (resolution === 'QVGA') {
            url = `${protocol}://${ip}/ddcdialog.html?useOvl=1&busyReload=1&type=${resolution}&x=0&y=0&fit=1`;
        } else {
            url = `${protocol}://${ip}/ddcdialog.html?useOvl=1&busyReload=1&type=${resolution}`;
        }
        return { valid: true, url: url };
    }

    addTimestampToUrl(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}`;
    }

    loadWebsite() {
        const urlResult = this.buildDdcUrl();
        
        if (!urlResult.valid) {
            this.showError(urlResult.error);
            return;
        }

        this.setConnectionStatus('connecting', 'Connecting to DDC4000...');
        this.showLoading();
        this.hideError();
        this.hideSuccess();
        this.loadStartTime = Date.now();
        
        // Add timestamp to prevent caching issues
        const urlWithTimestamp = this.addTimestampToUrl(urlResult.url);
        this.websiteFrame.src = urlWithTimestamp;
        this.websiteFrame.onload = () => this.handleLoadSuccess(urlResult.url);
        this.websiteFrame.onerror = () => this.handleLoadError();
        
        // Set a timeout to detect failed loads
        this.loadTimeout = setTimeout(() => {
            if (this.loadingMessage && !this.loadingMessage.classList.contains('hidden')) {
                this.setConnectionStatus('error', 'Connection timeout');
                this.handleLoadError();
            }
        }, 15000); // 15 second timeout
    }

    refreshWebsite() {
        if (this.websiteFrame.src) {
            this.loadStartTime = Date.now();
            this.showLoading();
            this.setConnectionStatus('connecting', 'Refreshing...');
            this.websiteFrame.src = this.websiteFrame.src;
        } else {
            this.loadWebsite();
        }
    }

    handleLoadSuccess(url) {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
            this.loadTimeout = null;
        }
        
        const loadTime = Date.now() - this.loadStartTime;
        this.hideLoading();
        this.setConnectionStatus('connected', 'Connected');
        this.showLoadTime(loadTime);
        this.showSuccess('DDC4000 Interface Loaded Successfully!');
        
        // Update frame size and auto-fit the interface to screen size
        this.zoomManager.updateFrameSize();
        setTimeout(() => this.zoomManager.autoFit(), 500);
        
    }

    handleLoadError() {
        this.hideLoading();
        this.setConnectionStatus('error', 'Connection Failed');
        this.showError('Failed to load the DDC4000 interface. Please check the IP address and network connection.');
    }

    // UI helper methods
    showLoading() {
        this.hideAllMessages();
        this.loadingMessage.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingMessage.classList.add('hidden');
    }

    showError(message) {
        this.hideAllMessages();
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        setTimeout(() => this.errorMessage.classList.add('hidden'), 5000);
    }

    showSuccess(message) {
        this.hideAllMessages();
        this.successMessage.textContent = message;
        this.successMessage.classList.remove('hidden');
        setTimeout(() => this.successMessage.classList.add('hidden'), 3000);
    }

    hideAllMessages() {
        this.errorMessage.classList.add('hidden');
        this.loadingMessage.classList.add('hidden');
        this.successMessage.classList.add('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    hideSuccess() {
        this.successMessage.classList.add('hidden');
    }

    setConnectionStatus(status, text) {
        this.connectionStatus.className = `connection-status ${status}`;
        this.statusText.textContent = text;
    }

    showLoadTime(ms) {
        this.loadTime.textContent = `Load time: ${ms}ms`;
        this.loadTime.classList.remove('hidden');
    }

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
            this.zoomManager.autoFit();
        }, 300);
    }


    updateIpSuggestions() {
        const commonIPs = [
            '192.168.1.1', '192.168.0.1', '192.168.10.21',
            '10.0.0.1', '172.16.0.1', '127.0.0.1'
        ];
        
        this.ipSuggestions.innerHTML = '';
        commonIPs.forEach(ip => {
            const option = document.createElement('option');
            option.value = ip;
            this.ipSuggestions.appendChild(option);
        });
    }

    updateGalleryDisplay() {
        this.galleryManager.updateGalleryDisplay();
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
                    this.zoomManager.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomManager.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.zoomManager.resetZoom();
                    break;
                case 'r':
                    e.preventDefault();
                    this.refreshWebsite();
                    break;
                case 's':
                    e.preventDefault();
                    this.screenshotManager.handleCaptureClick();
                    break;
                case 'g':
                    e.preventDefault();
                    this.galleryManager.toggleGallery();
                    break;
            }
        } else {
            switch(e.key) {
                case 'F11':
                    e.preventDefault();
                    this.zoomManager.toggleFullscreen();
                    break;
                case 'Escape':
                    if (this.zoomManager.isFullscreen) {
                        e.preventDefault();
                        this.zoomManager.exitFullscreen();
                    } else if (!this.galleryModal.classList.contains('hidden')) {
                        e.preventDefault();
                        this.galleryManager.closeGallery();
                    } else if (!this.imageInspector.classList.contains('hidden')) {
                        e.preventDefault();
                        this.galleryManager.closeInspector();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    this.zoomManager.autoFit();
                    break;
            }
        }
    }

    createOptionsMenu(title, options) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const menu = document.createElement('div');
        menu.style.cssText = `
            background: white; border-radius: 12px; padding: 20px;
            max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        menu.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">${title}</h3>
            ${options.map(option => `
                <button class="menu-option" style="
                    display: block; width: 100%; padding: 12px; margin: 8px 0;
                    background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px;
                    text-align: left; cursor: pointer; transition: background 0.2s;
                " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                    <strong>${option.text}</strong><br>
                    <small style="color: #666;">${option.description}</small>
                </button>
            `).join('')}
            <button id="closeMenu" style="
                width: 100%; padding: 10px; margin-top: 10px;
                background: #6c757d; color: white; border: none; border-radius: 6px;
                cursor: pointer;
            ">Close</button>
        `;
        
        overlay.appendChild(menu);
        
        // Add event listeners
        menu.querySelectorAll('.menu-option').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                overlay.remove();
                options[index].action();
            });
        });
        
        menu.querySelector('#closeMenu').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        return overlay;
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    try {
        window.ddcBrowser = new DDCBrowser();
    } catch (error) {
        console.error('Failed to initialize DDC Browser:', error);
    }
});