// Zoom and viewport controls module
export class ZoomManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
    }

    setZoom(zoomLevel) {
        this.currentZoom = Math.max(0.25, Math.min(5.0, zoomLevel));
        this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom})`;
        this.updateZoomDisplay();
        this.updateFrameSize();
    }

    updateZoomDisplay() {
        this.ddcBrowser.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    updateFrameSize() {
        // Always set explicit dimensions based on resolution for proper centering
        const resolution = this.ddcBrowser.resolutionSelect.value;
        const baseWidth = resolution === 'QVGA' ? 320 : 800;
        const baseHeight = resolution === 'QVGA' ? 240 : 480;
        
        this.ddcBrowser.websiteFrame.style.width = `${baseWidth}px`;
        this.ddcBrowser.websiteFrame.style.height = `${baseHeight}px`;
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
        const baseWidth = resolution === 'QVGA' ? 320 : 800;
        const baseHeight = resolution === 'QVGA' ? 240 : 480;
        
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