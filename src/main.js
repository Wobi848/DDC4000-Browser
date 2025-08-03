// Main DDC Browser application
import { ScreenshotManager } from './modules/screenshot.js';
import { GalleryManager } from './modules/gallery.js';
import { PresetManager } from './modules/presets.js';
import { ZoomManager } from './modules/zoom.js';

// Application version
const APP_VERSION = '1.3.0';

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
        
        // Version elements
        this.versionBadge = document.getElementById('versionBadge');
        this.versionModal = document.getElementById('versionModal');
        this.closeVersionModal = document.getElementById('closeVersionModal');
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
        
        // Version modal controls
        this.versionBadge.addEventListener('click', () => this.showVersionModal());
        this.closeVersionModal.addEventListener('click', () => this.hideVersionModal());
        this.versionModal.addEventListener('click', (e) => {
            if (e.target === this.versionModal) {
                this.hideVersionModal();
            }
        });
        
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
        
        // Update version display
        this.versionBadge.textContent = `v${APP_VERSION}`;
        this.versionBadge.title = `DDC4000 Browser v${APP_VERSION} - Click for details`;
        
        // Reset form to clean state
        this.presetSelect.value = '';
        this.ipInput.value = '';
        
        // Load saved config state
        this.loadConfigState();
        
        // Handle mobile-specific initialization
        this.initializeMobileOptimizations();
        
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

    initializeMobileOptimizations() {
        // Auto-collapse settings in portrait mode on mobile
        const checkMobilePortrait = () => {
            const isMobile = window.innerWidth <= 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            
            if (isMobile && isPortrait && !this.configCollapsed) {
                // Auto-collapse in portrait mode for better iframe visibility
                console.log('Auto-collapsing settings for mobile portrait mode');
                this.toggleConfig();
            }
        };
        
        // Check on load
        setTimeout(checkMobilePortrait, 100);
        
        // Check on orientation change
        window.addEventListener('orientationchange', () => {
            console.log('Orientation change detected');
            setTimeout(() => {
                console.log(`After orientation change: ${window.innerWidth}x${window.innerHeight}`);
                checkMobilePortrait();
                // Force autofit after orientation change
                if (window.innerWidth <= 768) {
                    console.log('Triggering autofit after orientation change (mobile width)');
                    this.zoomManager.updateFrameSize();
                    setTimeout(() => this.zoomManager.autoFit(), 100);
                } else {
                    console.log('Triggering autofit after orientation change (landscape width)');
                    this.zoomManager.updateFrameSize();
                    setTimeout(() => this.zoomManager.autoFit(), 100);
                }
            }, 500);
        });
        
        // Check on window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                checkMobilePortrait();
                // Force autofit after resize if mobile
                if (window.innerWidth <= 768) {
                    this.zoomManager.autoFit();
                }
            }, 200);
        });
        
        // Add mobile-specific touch improvements
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
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

        // Build the target DDC URL
        let targetUrl;
        if (resolution === 'QVGA') {
            targetUrl = `${protocol}://${ip}/ddcdialog.html?useOvl=1&busyReload=1&type=${resolution}&x=0&y=0&fit=1`;
        } else {
            targetUrl = `${protocol}://${ip}/ddcdialog.html?useOvl=1&busyReload=1&type=${resolution}`;
        }

        // Check for mixed content (HTTPS site loading HTTP content)
        const isHttps = location.protocol === 'https:';
        const isHttpTarget = protocol === 'http';
        
        if (isHttps && isHttpTarget) {
            // Show warning but allow direct connection for now
            console.warn('Mixed content detected - using direct HTTP connection');
            this.showMixedContentWarning = true;
            return { 
                valid: true, 
                url: targetUrl,
                originalUrl: targetUrl,
                proxied: false,
                mixedContent: true
            };
        }
        
        return { 
            valid: true, 
            url: targetUrl,
            originalUrl: targetUrl,
            proxied: false
        };
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

        // Show appropriate connection message
        let statusMessage = 'Connecting to DDC4000...';
        if (urlResult.proxied) {
            statusMessage = 'Connecting via proxy (HTTP→HTTPS)...';
        } else if (urlResult.mixedContent) {
            statusMessage = 'Connecting (mixed content - HTTP over HTTPS)...';
        }
        
        this.setConnectionStatus('connecting', statusMessage);
        this.showLoading();
        this.hideError();
        this.hideSuccess();
        this.loadStartTime = Date.now();
        
        // Add timestamp to prevent caching issues
        const urlWithTimestamp = this.addTimestampToUrl(urlResult.url);
        
        // Set iframe attributes to help with DDC4000 compatibility
        this.websiteFrame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation');
        
        this.websiteFrame.src = urlWithTimestamp;
        
        // Store URL info for success handler
        this.currentUrlInfo = urlResult;
        
        this.websiteFrame.onload = () => this.handleLoadSuccess();
        this.websiteFrame.onerror = () => this.handleLoadError();
        
        // Set a timeout to detect failed loads
        this.loadTimeout = setTimeout(() => {
            if (this.loadingMessage && !this.loadingMessage.classList.contains('hidden')) {
                if (this.currentUrlInfo?.mixedContent) {
                    // Check if iframe actually loaded despite mixed content warnings
                    try {
                        const iframeDoc = this.websiteFrame.contentDocument || this.websiteFrame.contentWindow.document;
                        if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.trim()) {
                            // Iframe loaded successfully, just with some blocked resources
                            this.handlePartialMixedContentSuccess();
                            return;
                        }
                    } catch (e) {
                        // Cross-origin, but that's normal - assume it loaded
                        this.handlePartialMixedContentSuccess();
                        return;
                    }
                    this.handleMixedContentBlocked();
                } else {
                    this.setConnectionStatus('error', 'Connection timeout');
                    this.handleLoadError();
                }
            }
        }, 3000); // 3 second timeout for mixed content detection
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
        
        // Show connection status with proxy/mixed content info
        let statusText = 'Connected';
        if (this.currentUrlInfo?.proxied) {
            statusText = 'Connected (via proxy)';
        } else if (this.currentUrlInfo?.mixedContent) {
            statusText = 'Connected (mixed content)';
        }
        this.setConnectionStatus('connected', statusText);
        this.showLoadTime(loadTime);
        
        // Show success message with appropriate info
        let successMsg = 'DDC4000 Interface Loaded Successfully!';
        if (this.currentUrlInfo?.proxied) {
            successMsg = 'DDC4000 Interface Loaded via HTTPS Proxy!';
        } else if (this.currentUrlInfo?.mixedContent) {
            successMsg = 'DDC4000 Interface Loaded (HTTP over HTTPS - check browser security settings if blocked)';
        }
        this.showSuccess(successMsg);
        
        // Update frame size and auto-fit the interface to screen size
        this.zoomManager.updateFrameSize();
        
        // On mobile, ensure autofit happens and frame size is updated
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            setTimeout(() => {
                this.zoomManager.autoFit();
                setTimeout(() => this.zoomManager.updateFrameSize(), 100);
            }, 500);
        } else {
            setTimeout(() => this.zoomManager.autoFit(), 500);
        }
        
    }

    handleLoadError() {
        this.hideLoading();
        this.setConnectionStatus('error', 'Connection Failed');
        this.showError('Failed to load the DDC4000 interface. Please check the IP address and network connection.');
    }

    handlePartialMixedContentSuccess() {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
            this.loadTimeout = null;
        }
        
        const loadTime = Date.now() - this.loadStartTime;
        this.hideLoading();
        
        this.setConnectionStatus('connected', 'Connected (partial - some images blocked)');
        this.showLoadTime(loadTime);
        this.showSuccess('DDC4000 Interface Loaded! (Some images may be missing due to mixed content)');
        
        // Check for browser compatibility error after a short delay
        setTimeout(() => {
            this.checkForBrowserCompatibilityError();
        }, 2000);
        
        // Update frame size and auto-fit
        this.zoomManager.updateFrameSize();
        setTimeout(() => this.zoomManager.autoFit(), 500);
    }

    checkForBrowserCompatibilityError() {
        try {
            const iframe = this.websiteFrame;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (iframeDoc) {
                const bodyText = iframeDoc.body ? iframeDoc.body.innerText : '';
                
                // Check for German browser compatibility error
                if (bodyText.includes('nicht unterstützt') || bodyText.includes('Zurück zur Startseite')) {
                    this.showBrowserCompatibilityHelp();
                }
            }
        } catch (e) {
            // Cross-origin restrictions prevent checking, but that's normal
            console.log('Cannot check iframe content (cross-origin)');
        }
    }

    showBrowserCompatibilityHelp() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 3000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white; border-radius: 12px; padding: 30px;
            max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <h2 style="color: #f39c12; margin: 0;">Browser Compatibility Issue</h2>
                <p style="color: #7f8c8d; margin: 10px 0;">DDC4000 shows "Browser not supported" message</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2c3e50;">🔧 Solutions:</h3>
                
                <div style="margin: 15px 0;">
                    <strong>Option 1: Try IE Mode URL</strong>
                    <p style="margin: 10px 0;">DDC4000 systems often work with slightly different URLs:</p>
                    <button id="tryAlternateUrl" style="
                        background: #3498db; color: white; border: none; 
                        padding: 8px 16px; border-radius: 4px; cursor: pointer;
                        margin: 5px 0;
                    ">Try Alternative URL</button>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>Option 2: Ignore Warning</strong>
                    <p style="margin: 10px 0;">Sometimes the interface works despite the warning.</p>
                    <p style="font-size: 14px; color: #666;">Look for any working elements in the interface below the error message.</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button id="closeBrowserModal" style="
                    background: #6c757d; color: white; border: none; 
                    padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        modal.querySelector('#closeBrowserModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        modal.querySelector('#tryAlternateUrl').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.tryAlternativeUrl();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    tryAlternativeUrl() {
        const protocol = this.protocolSelect.value;
        const ip = this.ipInput.value.trim();
        const resolution = this.resolutionSelect.value;
        
        // Try different URL patterns that DDC4000 might accept
        let alternativeUrl;
        if (resolution === 'QVGA') {
            alternativeUrl = `${protocol}://${ip}/ddcdialog.html?type=${resolution}&useOvl=0`;
        } else {
            alternativeUrl = `${protocol}://${ip}/ddcdialog.html?type=${resolution}&useOvl=0`;
        }
        
        this.showLoading();
        this.setConnectionStatus('connecting', 'Trying alternative URL...');
        
        const urlWithTimestamp = this.addTimestampToUrl(alternativeUrl);
        this.websiteFrame.src = urlWithTimestamp;
        
        this.showSuccess('Trying alternative DDC4000 URL format...');
    }

    handleMixedContentBlocked() {
        this.hideLoading();
        this.setConnectionStatus('error', 'Mixed Content Blocked');
        
        const targetUrl = this.currentUrlInfo.originalUrl;
        const hostname = new URL(targetUrl).hostname;
        
        // Create detailed mixed content help modal
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 3000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white; border-radius: 12px; padding: 30px;
            max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-height: 80vh; overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔒</div>
                <h2 style="color: #e74c3c; margin: 0;">Mixed Content Blocked</h2>
                <p style="color: #7f8c8d; margin: 10px 0;">Chrome blocked the HTTP DDC4000 connection from this HTTPS site</p>
                <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">(HTTP redirects to HTTPS automatically)</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2c3e50;">🎯 Quick Solutions:</h3>
                
                <div style="margin: 15px 0;">
                    <strong>Option 1: Allow Mixed Content (Recommended)</strong>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Look for the 🛡️ shield icon in Chrome's address bar</li>
                        <li>Click it and select "Load unsafe scripts"</li>
                        <li>The page will reload and connect to your DDC4000</li>
                    </ol>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>Option 2: Chrome Settings</strong>
                    <p style="margin: 10px 0;">
                        <a href="chrome://settings/content/insecureContent" target="_blank" style="
                            display: inline-block; background: #3498db; color: white; 
                            padding: 8px 16px; text-decoration: none; border-radius: 4px;
                            margin: 5px 0;
                        ">Open Chrome Insecure Content Settings</a>
                    </p>
                    <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                        <li>Click "Add" next to "Allow"</li>
                        <li>Enter: <code>4000.rappo.dev</code></li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>Option 3: Local Development</strong>
                    <p style="margin: 10px 0;">For unrestricted access, run locally:</p>
                    <code style="display: block; background: #f1f2f6; padding: 10px; border-radius: 4px; font-size: 12px;">
                        git clone [repository]<br>
                        python -m http.server 8000<br>
                        Visit: http://localhost:8000
                    </code>
                </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>🔧 Technical Details:</strong>
                <p style="margin: 10px 0; font-size: 14px;">
                    Trying to connect to: <code style="background: #f1f2f6; padding: 2px 6px; border-radius: 3px;">${targetUrl}</code><br>
                    Device IP: <strong>${hostname}</strong>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button id="closeMixedContentModal" style="
                    background: #6c757d; color: white; border: none; 
                    padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    font-size: 14px;
                ">Close</button>
                
                <button id="tryAgainBtn" style="
                    background: #28a745; color: white; border: none; 
                    padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    font-size: 14px; margin-left: 10px;
                ">Try Again</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        modal.querySelector('#closeMixedContentModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        modal.querySelector('#tryAgainBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.loadWebsite();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
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
    
    showVersionModal() {
        // Update version info
        document.getElementById('modalVersionNumber').textContent = APP_VERSION;
        document.getElementById('protocolInfo').textContent = location.protocol.toUpperCase();
        
        // Get service worker info
        this.updateServiceWorkerInfo();
        
        this.versionModal.classList.remove('hidden');
        this.versionModal.style.display = 'flex';
    }
    
    hideVersionModal() {
        this.versionModal.classList.add('hidden');
        this.versionModal.style.display = 'none';
    }
    
    async updateServiceWorkerInfo() {
        const cacheVersionEl = document.getElementById('cacheVersion');
        const swStatusEl = document.getElementById('swStatus');
        
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    swStatusEl.textContent = registration.active ? '✅ Active' : '⏳ Installing';
                    
                    // Try to get cache version from service worker
                    if (registration.active) {
                        const messageChannel = new MessageChannel();
                        messageChannel.port1.onmessage = (event) => {
                            if (event.data && event.data.version) {
                                cacheVersionEl.textContent = event.data.version;
                            } else {
                                cacheVersionEl.textContent = 'v1.3.0-proxy';
                            }
                        };
                        registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
                    }
                } else {
                    swStatusEl.textContent = '❌ Not registered';
                    cacheVersionEl.textContent = 'N/A';
                }
            } else {
                swStatusEl.textContent = '❌ Not supported';
                cacheVersionEl.textContent = 'N/A';
            }
        } catch (error) {
            swStatusEl.textContent = '❌ Error';
            cacheVersionEl.textContent = 'Unknown';
            console.error('Failed to get service worker info:', error);
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