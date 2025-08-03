// Zoom and viewport controls module
export class ZoomManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.currentZoom = 1.0;
        this.isFullscreen = false;
        this.initializeTouchGestures();
    }
    
    initializeTouchGestures() {
        // Add touch gesture support for mobile
        const iframe = this.ddcBrowser.websiteFrame;
        const container = this.ddcBrowser.iframeContainer;
        
        // Variables for touch handling
        this.touchStartDistance = 0;
        this.initialZoom = 1.0;
        this.touchStartTime = 0;
        
        // Double-tap to auto-fit
        let lastTouchTime = 0;
        container.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTouchTime;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                this.autoFit();
            }
            lastTouchTime = currentTime;
        });
        
        // Pinch-to-zoom gesture
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                this.touchStartDistance = this.getTouchDistance(e.touches);
                this.initialZoom = this.currentZoom;
                this.touchStartTime = Date.now();
            }
        });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getTouchDistance(e.touches);
                const scale = currentDistance / this.touchStartDistance;
                const newZoom = Math.max(0.25, Math.min(5.0, this.initialZoom * scale));
                this.setZoom(newZoom);
            }
        });
        
        // Prevent default touch behavior on iframe to allow gestures
        iframe.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
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
        const resolution = this.ddcBrowser.resolutionSelect.value;
        // Consider both dimensions for mobile detection (handles landscape)
        const isMobile = Math.min(window.innerWidth, window.innerHeight) <= 768;
        
        if (isMobile) {
            // Mobile: Use full width but calculate proper height based on DDC aspect ratio
            const container = this.ddcBrowser.iframeContainer;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // DDC4000 content dimensions and aspect ratio
            const ddcWidth = resolution === 'QVGA' ? 320 : 800;
            const ddcHeight = resolution === 'QVGA' ? 240 : 480;
            const ddcAspectRatio = ddcHeight / ddcWidth; // height/width ratio
            
            // Calculate iframe dimensions based on orientation
            const isPortrait = containerHeight > containerWidth;
            let iframeWidth, iframeHeight;
            
            if (isPortrait) {
                // Portrait: use full width, calculate height from aspect ratio
                iframeWidth = containerWidth;
                iframeHeight = Math.min(iframeWidth * ddcAspectRatio, containerHeight);
            } else {
                // Landscape: prioritize using full height to maximize interface size
                const heightBasedWidth = containerHeight / ddcAspectRatio;
                const widthBasedHeight = containerWidth * ddcAspectRatio;
                
                console.log(`Landscape options: height-based width=${Math.round(heightBasedWidth)}, width-based height=${Math.round(widthBasedHeight)}`);
                
                if (heightBasedWidth <= containerWidth) {
                    // Can use full height - this gives us the larger interface
                    iframeHeight = containerHeight;
                    iframeWidth = heightBasedWidth;
                    console.log(`Using full height: ${Math.round(iframeWidth)}x${Math.round(iframeHeight)}`);
                } else {
                    // Must constrain by width
                    iframeWidth = containerWidth;
                    iframeHeight = widthBasedHeight;
                    console.log(`Constrained by width: ${Math.round(iframeWidth)}x${Math.round(iframeHeight)}`);
                }
            }
            
            console.log(`Mobile container: ${containerWidth}x${containerHeight} (${isPortrait ? 'portrait' : 'landscape'})`);
            console.log(`DDC content: ${ddcWidth}x${ddcHeight} (ratio: ${ddcAspectRatio.toFixed(3)})`);
            console.log(`Iframe size: ${Math.round(iframeWidth)}x${Math.round(iframeHeight)}`);
            
            // Set iframe dimensions
            this.ddcBrowser.websiteFrame.style.width = `${iframeWidth}px`;
            this.ddcBrowser.websiteFrame.style.height = `${iframeHeight}px`;
            this.ddcBrowser.websiteFrame.style.minWidth = `${iframeWidth}px`;
            this.ddcBrowser.websiteFrame.style.maxWidth = `${iframeWidth}px`;
            
            // Calculate scale to fit the DDC content to iframe
            const scaleX = iframeWidth / ddcWidth;
            const scaleY = iframeHeight / ddcHeight;
            const baseScale = Math.min(scaleX, scaleY); // Use the smaller scale to fit both dimensions
            const finalZoom = baseScale * this.currentZoom;
            
            console.log(`Mobile scaling: ${baseScale.toFixed(3)}x (final: ${finalZoom.toFixed(3)}x)`);
            
            this.ddcBrowser.websiteFrame.style.zoom = finalZoom;
            this.ddcBrowser.websiteFrame.style.transform = 'none';
            this.ddcBrowser.websiteFrame.style.transformOrigin = 'top left';
            this.ddcBrowser.websiteFrame.style.overflow = 'hidden';
            this.ddcBrowser.websiteFrame.style.clipPath = 'none';
            this.ddcBrowser.websiteFrame.style.marginLeft = '0px';
            
            // Store the base scale for autofit reference
            this.mobileBaseScale = baseScale;
        } else {
            // Desktop: Use original fixed dimensions
            const baseWidth = resolution === 'QVGA' ? 720 : 800;
            const baseHeight = resolution === 'QVGA' ? 480 : 480;
            
            this.ddcBrowser.websiteFrame.style.width = `${baseWidth}px`;
            this.ddcBrowser.websiteFrame.style.height = `${baseHeight}px`;
            
            if (resolution === 'QVGA') {
                this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom}) translateX(-85px)`;
                this.ddcBrowser.websiteFrame.style.overflow = 'hidden';
                this.ddcBrowser.websiteFrame.style.clipPath = 'inset(0 0 0 85px)';
                this.ddcBrowser.websiteFrame.style.transformOrigin = 'center center';
            } else {
                this.ddcBrowser.websiteFrame.style.transform = `scale(${this.currentZoom})`;
                this.ddcBrowser.websiteFrame.style.overflow = 'auto';
                this.ddcBrowser.websiteFrame.style.clipPath = 'none';
                this.ddcBrowser.websiteFrame.style.transformOrigin = 'center center';
            }
            this.ddcBrowser.websiteFrame.style.marginLeft = '0px';
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
        const isMobile = Math.min(window.innerWidth, window.innerHeight) <= 768;
        const resolution = this.ddcBrowser.resolutionSelect.value;
        
        console.log(`AutoFit called: ${window.innerWidth}x${window.innerHeight}, isMobile: ${isMobile}`);
        
        if (isMobile) {
            // Mobile: Set zoom to 1.0 to use the base scale calculated in updateFrameSize
            this.setZoom(1.0);
            
            // Show the base scale info
            const ddcWidth = resolution === 'QVGA' ? 320 : 800;
            const baseScale = this.mobileBaseScale || 1.0;
            const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            
            this.ddcBrowser.showSuccess(`Mobile auto-fit (${orientation}): ${Math.round(baseScale * 100)}%`);
        } else {
            // Desktop: Use original logic
            const baseWidth = resolution === 'QVGA' ? 720 : 800;
            const baseHeight = resolution === 'QVGA' ? 480 : 480;
            
            const container = this.ddcBrowser.iframeContainer;
            const padding = resolution === 'QVGA' ? 20 : 40;
            const containerWidth = container.clientWidth - padding;
            const containerHeight = container.clientHeight - padding;
            
            const scaleX = containerWidth / baseWidth;
            const scaleY = containerHeight / baseHeight;
            const optimalScale = Math.min(scaleX, scaleY, 3.0);
            
            this.setZoom(optimalScale);
            this.ddcBrowser.showSuccess(`Auto-fit applied: ${Math.round(optimalScale * 100)}%`);
        }
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