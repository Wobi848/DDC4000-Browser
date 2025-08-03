// Zoom and viewport controls module
export class ZoomManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
    }

    setZoom(zoomLevel) {
        this.currentZoom = Math.max(0.25, Math.min(5.0, zoomLevel));
        
        // Apply zoom with resolution-specific transform
        const resolution = this.ddcBrowser.resolutionSelect.value;
        if (resolution === 'QVGA') {
            this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom}) translateX(-85px)`;
        } else {
            this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom})`;
        }
        
        this.updateZoomDisplay();
        this.updateFrameSize();
    }

    updateZoomDisplay() {
        this.ddcBrowser.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    updateFrameSize() {
        // Set iframe dimensions and scroll position
        const resolution = this.ddcBrowser.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 750 : 800;  // QVGA: 320 + 85 shift = 405px total needed
        const baseHeight = resolution === 'QVGA' ? 480 : 480;
        
        this.ddcBrowser.websiteFrame.style.width = `${baseWidth}px`;
        this.ddcBrowser.websiteFrame.style.height = `${baseHeight}px`;
        
        // For QVGA, try to adjust iframe content positioning with transform
        if (resolution === 'QVGA') {
            // Use transform to shift content left and clip the view - fine-tuned values
            this.ddcBrowser.websiteFrame.style.marginLeft = '0px';
            this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom}) translateX(-85px)`;
            this.ddcBrowser.websiteFrame.style.overflow = 'hidden';
            this.ddcBrowser.websiteFrame.style.clipPath = 'inset(0 0 0 85px)';
        } else {
            this.ddcBrowser.websiteFrame.style.marginLeft = '0px';
            this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom})`;
            this.ddcBrowser.websiteFrame.style.overflow = 'auto';
            this.ddcBrowser.websiteFrame.style.clipPath = 'none';
        }
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
        const resolution = this.ddcBrowser.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 750 : 800;  // Use same dimensions as updateFrameSize
        const baseHeight = resolution === 'QVGA' ? 480 : 480;
        
        const container = this.ddcBrowser.iframeContainer;
        // For QVGA, use less padding to give more space
        const padding = resolution === 'QVGA' ? 20 : 40;
        const containerWidth = container.clientWidth - padding;
        const containerHeight = container.clientHeight - padding;
        
        const scaleX = containerWidth / baseWidth;
        const scaleY = containerHeight / baseHeight;
        const optimalScale = Math.min(scaleX, scaleY, 3.0); // Max 3x zoom
        
        this.setZoom(optimalScale);
        this.ddcBrowser.showSuccess(`Auto-fit applied: ${Math.round(optimalScale * 100)}%`);
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        this.ddcBrowser.iframeContainer.classList.add('fullscreen');
        this.ddcBrowser.fullscreenBtn.textContent = '⊡'; // Exit fullscreen icon
        this.ddcBrowser.fullscreenBtn.title = 'Exit Fullscreen';
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
        this.ddcBrowser.iframeContainer.classList.remove('fullscreen');
        this.ddcBrowser.fullscreenBtn.textContent = '⛶'; // Fullscreen icon
        this.ddcBrowser.fullscreenBtn.title = 'Fullscreen';
        this.isFullscreen = false;
        
        // Remove ESC handler
        if (this.fullscreenEscHandler) {
            document.removeEventListener('keydown', this.fullscreenEscHandler);
        }
        
        // Reset zoom to fit normal container
        setTimeout(() => this.autoFit(), 100);
    }
}