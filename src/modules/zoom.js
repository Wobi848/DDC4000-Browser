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
        
        // Add mobile-friendly exit options
        this.addMobileFullscreenExit();
    }

    addMobileFullscreenExit() {
        // Use the same mobile detection logic as other methods
        const isMobile = Math.min(window.innerWidth, window.innerHeight) <= 768;
        if (!isMobile) return;
        
        // Create mobile fullscreen exit overlay - positioned at bottom to avoid content
        this.mobileExitOverlay = document.createElement('div');
        this.mobileExitOverlay.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(6px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            border: 2px solid rgba(255,255,255,0.3);
            min-height: 44px;
            touch-action: manipulation;
            pointer-events: auto;
            visibility: visible;
            opacity: 1;
        `;
        
        // Create separate close button with better touch target
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            min-height: 32px;
            touch-action: manipulation;
            transition: background-color 0.2s ease;
        `;
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Exit fullscreen');
        
        // Create text span
        const textSpan = document.createElement('span');
        textSpan.textContent = '📱 Tap to exit fullscreen';
        textSpan.style.userSelect = 'none';
        
        this.mobileExitOverlay.appendChild(textSpan);
        this.mobileExitOverlay.appendChild(closeButton);
        
        // Add click handlers
        const exitHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.exitFullscreen();
        };
        
        // Both the overlay and close button should exit fullscreen
        this.mobileExitOverlay.addEventListener('click', exitHandler);
        this.mobileExitOverlay.addEventListener('touchend', exitHandler);
        
        // Add to document body instead of container to ensure it's always visible
        document.body.appendChild(this.mobileExitOverlay);
        
        console.log('Mobile fullscreen exit overlay created and added to body');
        
        // Create a simple always-visible floating exit button as backup
        this.mobileExitButton = document.createElement('button');
        this.mobileExitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            background: #e74c3c;
            color: white;
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            touch-action: manipulation;
            opacity: 0.8;
        `;
        this.mobileExitButton.innerHTML = '×';
        this.mobileExitButton.setAttribute('aria-label', 'Exit fullscreen');
        this.mobileExitButton.addEventListener('click', exitHandler);
        this.mobileExitButton.addEventListener('touchend', exitHandler);
        
        document.body.appendChild(this.mobileExitButton);
        
        // Auto-fade main overlay after 4 seconds, but keep it more visible
        this.hideMobileExitTimer = setTimeout(() => {
            if (this.mobileExitOverlay) {
                this.mobileExitOverlay.style.opacity = '0.6';
            }
        }, 4000);
        
        // Show on any touch in the container area
        this.fullscreenTapHandler = (e) => {
            // Don't interfere with DDC interface interactions
            if (e.target.closest('iframe')) return;
            
            if (this.mobileExitOverlay) {
                this.mobileExitOverlay.style.opacity = '1';
                clearTimeout(this.hideMobileExitTimer);
                this.hideMobileExitTimer = setTimeout(() => {
                    if (this.mobileExitOverlay) {
                        this.mobileExitOverlay.style.opacity = '0.6';
                    }
                }, 4000);
            }
        };
        
        // Listen for touches on the container but don't interfere with iframe
        this.ddcBrowser.iframeContainer.addEventListener('touchstart', this.fullscreenTapHandler, { passive: true });
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
        
        // Clean up mobile exit overlay and button
        if (this.mobileExitOverlay) {
            this.mobileExitOverlay.remove();
            this.mobileExitOverlay = null;
        }
        if (this.mobileExitButton) {
            this.mobileExitButton.remove();
            this.mobileExitButton = null;
        }
        if (this.hideMobileExitTimer) {
            clearTimeout(this.hideMobileExitTimer);
            this.hideMobileExitTimer = null;
        }
        if (this.fullscreenTapHandler) {
            this.ddcBrowser.iframeContainer.removeEventListener('touchstart', this.fullscreenTapHandler, { passive: true });
            this.fullscreenTapHandler = null;
        }
        
        // Reset zoom to fit normal container
        setTimeout(() => this.autoFit(), 100);
    }
}