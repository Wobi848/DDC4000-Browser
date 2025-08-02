class DDCBrowser {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.loadBtn = document.getElementById('loadBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.websiteFrame = document.getElementById('websiteFrame');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingMessage = document.getElementById('loadingMessage');
        
        this.init();
    }
    
    init() {
        this.loadBtn.addEventListener('click', () => this.loadWebsite());
        this.refreshBtn.addEventListener('click', () => this.refreshWebsite());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadWebsite();
            }
        });
        
        // Load saved URL on startup
        this.loadSavedUrl();
        
        // Handle iframe load events
        this.websiteFrame.addEventListener('load', () => this.onFrameLoad());
        this.websiteFrame.addEventListener('error', () => this.onFrameError());
    }
    
    loadSavedUrl() {
        const savedUrl = localStorage.getItem('ddcBrowserUrl');
        if (savedUrl) {
            this.urlInput.value = savedUrl;
            this.loadWebsite();
        }
    }
    
    validateUrl(url) {
        if (!url.trim()) {
            return { valid: false, error: 'URL cannot be empty' };
        }
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }
        
        try {
            new URL(url);
            return { valid: true, url: url };
        } catch (e) {
            return { valid: false, error: 'Invalid URL format' };
        }
    }
    
    loadWebsite() {
        const inputUrl = this.urlInput.value.trim();
        const validation = this.validateUrl(inputUrl);
        
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }
        
        const url = validation.url;
        
        // Save URL to localStorage
        localStorage.setItem('ddcBrowserUrl', url);
        
        this.showLoading();
        this.hideError();
        
        // Add timestamp to prevent caching issues
        const urlWithTimestamp = this.addTimestampToUrl(url);
        this.websiteFrame.src = urlWithTimestamp;
    }
    
    refreshWebsite() {
        if (this.websiteFrame.src) {
            this.showLoading();
            this.hideError();
            
            // Force refresh by removing old timestamp and adding new one
            let currentUrl = this.websiteFrame.src;
            // Remove the timestamp parameter if it exists
            currentUrl = currentUrl.replace(/[&?]_t=\d+/, '');
            const urlWithTimestamp = this.addTimestampToUrl(currentUrl);
            this.websiteFrame.src = urlWithTimestamp;
        }
    }
    
    addTimestampToUrl(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}`;
    }
    
    onFrameLoad() {
        this.hideLoading();
        this.hideError();
        
        // Check if the frame actually loaded content
        try {
            if (this.websiteFrame.contentDocument) {
                const frameContent = this.websiteFrame.contentDocument.body;
                if (!frameContent || frameContent.children.length === 0) {
                    this.showError('The website appears to be empty or failed to load content');
                }
            }
        } catch (e) {
            // Cross-origin restrictions prevent access, but that's okay
            // The frame loaded successfully
        }
    }
    
    onFrameError() {
        this.hideLoading();
        this.showError('Failed to load the website. The server may be unreachable or the URL may be incorrect.');
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
    }
    
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DDCBrowser();
});