// Screenshot functionality module
export class ScreenshotManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.screenshots = this.loadScreenshots();
    }

    async handleCaptureClick() {
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        
        if (isSecure && hasGetDisplayMedia) {
            try {
                this.ddcBrowser.captureBtn.textContent = '🎬';
                this.ddcBrowser.captureBtn.disabled = true;
                await this.captureViaScreenShare();
                return;
            } catch (error) {
                console.log('Direct screen capture failed:', error.message);
                this.ddcBrowser.showError('Screen capture failed: ' + error.message);
            } finally {
                this.ddcBrowser.captureBtn.textContent = '📷';
                this.ddcBrowser.captureBtn.disabled = false;
            }
        }
        
        this.showScreenshotOptions();
    }

    async captureViaScreenShare() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen sharing not supported in this browser');
        }

        console.log('🎥 Starting screen sharing capture...');
        
        this.showScreenShareInstructions();
        this.highlightIframeForCapture();
        
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false
            });
            
            console.log('✅ Screen sharing permission granted');
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            
            this.hideScreenShareInstructions();
            this.showScreenCaptureInterface(video, stream);
            
            return new Promise((resolve, reject) => {
                video.onloadedmetadata = () => {
                    console.log(`📺 Video loaded: ${video.videoWidth}x${video.videoHeight}`);
                    setTimeout(() => {
                        this.captureFromVideoStream(video, stream, true);
                        resolve();
                    }, 2000);
                };
                
                video.onerror = (error) => {
                    console.log('❌ Video error:', error);
                    stream.getTracks().forEach(track => track.stop());
                    reject(new Error('Video stream error'));
                };
                
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

    captureFromVideoStream(video, stream, cropToIframe = false) {
        try {
            console.log('📸 Capturing from video stream...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            ctx.drawImage(video, 0, 0);
            
            let finalCanvas = canvas;
            
            if (cropToIframe) {
                console.log('🎯 Auto-cropping to iframe area...');
                finalCanvas = this.cropToIframe(canvas);
            }
            
            const dataUrl = finalCanvas.toDataURL('image/png', 1.0);
            
            stream.getTracks().forEach(track => track.stop());
            
            const captureInterface = document.getElementById('screenCaptureInterface');
            if (captureInterface) captureInterface.remove();
            
            const highlight = document.getElementById('iframeHighlight');
            if (highlight) highlight.remove();
            
            this.saveScreenshot(dataUrl);
            
            const message = cropToIframe ? 'Screenshot auto-cropped to iframe!' : 'Screenshot captured from screen sharing!';
            console.log('🎉 Screen capture completed successfully!');
            this.ddcBrowser.showSuccess(message);
            
        } catch (error) {
            console.log('❌ Capture from stream failed:', error);
            this.ddcBrowser.showError('Failed to capture from video stream');
        }
    }

    cropToIframe(sourceCanvas) {
        try {
            const iframe = this.ddcBrowser.websiteFrame;
            const iframeRect = iframe.getBoundingClientRect();
            const resolution = this.ddcBrowser.resolutionSelect.value;
            
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            const docWidth = document.documentElement.scrollWidth;
            const docHeight = document.documentElement.scrollHeight;
            
            const scaleX = sourceCanvas.width / docWidth;
            const scaleY = sourceCanvas.height / docHeight;
            
            // Calculate base crop area
            let cropX = Math.max(0, (iframeRect.left + scrollX) * scaleX);
            let cropY = Math.max(0, (iframeRect.top + scrollY) * scaleY);
            let cropWidth = Math.min(sourceCanvas.width - cropX, iframeRect.width * scaleX);
            let cropHeight = Math.min(sourceCanvas.height - cropY, iframeRect.height * scaleY);
            
            // For QVGA, adjust for the transform and clipping
            if (resolution === 'QVGA') {
                // Account for the 85px left shift and clipping
                const shiftPx = 85;
                const adjustedShift = shiftPx * scaleX;
                
                // Adjust crop area to account for the transform
                cropX += adjustedShift; // Shift crop area right to compensate for content shift left
                cropWidth = Math.min(320 * scaleX, cropWidth); // Limit to actual QVGA content width
                
                console.log(`🎯 QVGA Adjusted crop: shift=${adjustedShift}px`);
            }
            
            console.log(`🎯 Final crop area (${resolution}): ${cropX}, ${cropY}, ${cropWidth}x${cropHeight}`);
            console.log(`🎯 Source canvas: ${sourceCanvas.width}x${sourceCanvas.height}`);
            console.log(`🎯 Iframe rect: ${iframeRect.left}, ${iframeRect.top}, ${iframeRect.width}x${iframeRect.height}`);
            
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            
            croppedCanvas.width = cropWidth;
            croppedCanvas.height = cropHeight;
            
            croppedCtx.drawImage(
                sourceCanvas,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );
            
            return croppedCanvas;
            
        } catch (error) {
            console.log('❌ Auto-crop failed, using full image:', error);
            return sourceCanvas;
        }
    }

    highlightIframeForCapture() {
        const highlight = document.createElement('div');
        highlight.id = 'iframeHighlight';
        highlight.style.cssText = `
            position: absolute;
            border: 3px solid #e74c3c;
            border-radius: 8px;
            pointer-events: none;
            z-index: 2000;
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
            animation: pulse 2s infinite;
        `;
        
        const iframe = this.ddcBrowser.websiteFrame;
        const rect = iframe.getBoundingClientRect();
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.02); }
                100% { opacity: 0.7; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(highlight);
        
        setTimeout(() => {
            if (highlight.parentNode) highlight.remove();
            if (style.parentNode) style.remove();
        }, 10000);
    }

    showScreenShareInstructions() {
        const modal = document.createElement('div');
        modal.id = 'screenShareModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 3000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; text-align: center;">
                <h2 style="color: #2c3e50; margin-bottom: 20px;">📷 Iframe Screenshot</h2>
                <div style="font-size: 48px; margin-bottom: 20px;">🎯</div>
                <p style="margin-bottom: 15px;"><strong>Red border shows iframe area to capture!</strong></p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                    <strong>Recommended:</strong><br>
                    📱 <strong>Browser Tab</strong> - Best for cropping to iframe<br>
                    🪟 <strong>Application Window</strong> - Shows full browser<br>
                    🖥️ <strong>Entire Screen</strong> - Captures everything
                </div>
                <div style="background: #e8f4f8; padding: 10px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3498db;">
                    💡 <strong>Tip:</strong> After capture, you can crop the image to focus on just the DDC interface area highlighted in red!
                </div>
                <p style="color: #666; font-size: 12px;">Screenshot taken automatically after selection</p>
                <div style="margin-top: 20px;">
                    <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 10px; color: #666;">Waiting for screen selection...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    hideScreenShareInstructions() {
        const modal = document.getElementById('screenShareModal');
        if (modal) modal.remove();
    }

    showScreenCaptureInterface(video, stream) {
        const captureInterface = document.createElement('div');
        captureInterface.id = 'screenCaptureInterface';
        captureInterface.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: white;
            padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 3001; min-width: 300px;
        `;
        
        captureInterface.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📺 Screen Capture Active</h3>
            <p style="margin-bottom: 15px; color: #666;">Capturing: <span id="captureSource">Screen/Window</span></p>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="captureNowBtn" style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📷 Capture Full
                </button>
                <button id="cropCaptureBtn" style="flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🎯 Crop to Iframe
                </button>
                <button id="stopCaptureBtn" style="flex: 1; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ❌ Stop
                </button>
            </div>
            <div style="font-size: 11px; color: #666;">Auto-capture in 2 seconds...</div>
        `;
        
        document.body.appendChild(captureInterface);
        
        document.getElementById('captureNowBtn').onclick = () => {
            this.captureFromVideoStream(video, stream, false);
        };
        
        document.getElementById('cropCaptureBtn').onclick = () => {
            this.captureFromVideoStream(video, stream, true);
        };
        
        document.getElementById('stopCaptureBtn').onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            captureInterface.remove();
        };
        
        stream.getTracks()[0].addEventListener('ended', () => {
            captureInterface.remove();
        });
    }

    showScreenshotOptions() {
        const options = [
            {
                text: '📷 Try Auto Capture',
                description: 'Attempt automatic screenshot with iframe2image',
                action: () => this.captureScreenshot()
            },
            {
                text: '🖥️ Check Screen Capture',
                description: 'Test if screen sharing is available',
                action: () => this.checkScreenCapture()
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
            },
            {
                text: '📱 Simple Canvas Capture',
                description: 'Try basic iframe area capture',
                action: () => this.simpleIframeCapture()
            },
            {
                text: '🎯 Iframe-Focused Capture',
                description: 'Screen capture with iframe highlighting',
                action: () => this.captureViaScreenShare()
            }
        ];

        const menu = this.ddcBrowser.createOptionsMenu('Screenshot Options', options);
        document.body.appendChild(menu);
    }

    async checkScreenCapture() {
        const diagnostics = [];
        
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        diagnostics.push(`🔒 Secure context: ${isSecure ? '✅ Yes' : '❌ No (HTTPS required)'}`);
        
        const hasGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        diagnostics.push(`📺 Screen Capture API: ${hasGetDisplayMedia ? '✅ Available' : '❌ Not available'}`);
        
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        diagnostics.push(`🌐 Browser: ${browser}`);
        
        if (hasGetDisplayMedia && isSecure) {
            diagnostics.push(`🧪 Testing screen capture...`);
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                diagnostics.push(`✅ Screen capture works!`);
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                diagnostics.push(`❌ Screen capture failed: ${error.message}`);
            }
        }
        
        alert(`Screen Capture Diagnostics:\n\n${diagnostics.join('\n')}\n\nIf screen capture is not working:\n• Use HTTPS instead of HTTP\n• Try Chrome/Edge browsers\n• Use 'Open DDC in New Tab' option instead`);
    }

    saveScreenshot(dataUrl) {
        const timestamp = new Date().toISOString();
        const screenshot = {
            id: Date.now().toString(),
            dataUrl: dataUrl,
            timestamp: timestamp,
            filename: `ddc-screenshot-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.png`
        };
        
        this.screenshots.push(screenshot);
        this.saveScreenshots();
        this.ddcBrowser.updateGalleryDisplay();
        
        console.log('📷 Screenshot saved:', screenshot.filename);
    }

    loadScreenshots() {
        try {
            const saved = localStorage.getItem('ddc_screenshots');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load screenshots:', error);
            return [];
        }
    }

    saveScreenshots() {
        try {
            localStorage.setItem('ddc_screenshots', JSON.stringify(this.screenshots));
        } catch (error) {
            console.error('Failed to save screenshots:', error);
        }
    }

    // Additional capture methods
    async captureScreenshot() {
        try {
            this.ddcBrowser.captureBtn.textContent = '⏳';
            this.ddcBrowser.captureBtn.disabled = true;
            
            const currentIframeUrl = this.ddcBrowser.websiteFrame.src;
            console.log('🔍 Current iframe URL:', currentIframeUrl);
            
            if (!currentIframeUrl || currentIframeUrl.includes('127.0.0.1') || currentIframeUrl.includes('localhost')) {
                this.ddcBrowser.showError('Please load a DDC interface first! Enter an IP address and click "Load DDC Interface".');
                return;
            }
            
            console.log('📸 Starting iframe visual content capture...');
            
            // Try screen sharing first
            try {
                console.log('✅ Attempting screen sharing capture');
                await this.captureViaScreenShare();
                return;
            } catch (e) {
                console.log('❌ Screen sharing failed:', e.message);
            }
            
            // Fallback to simple capture
            console.log('📝 Creating visual representation with capture instructions');
            this.simpleIframeCapture();
            
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            this.ddcBrowser.showError('Screenshot capture failed. Creating visual representation instead.');
            this.simpleIframeCapture();
        } finally {
            this.ddcBrowser.captureBtn.textContent = '📷';
            this.ddcBrowser.captureBtn.disabled = false;
        }
    }

    async simpleIframeCapture() {
        try {
            this.ddcBrowser.showSuccess('Attempting simple iframe capture...');
            
            const iframe = this.ddcBrowser.websiteFrame;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = iframe.offsetWidth || 800;
            canvas.height = iframe.offsetHeight || 600;
            
            // Fill with background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width-2, canvas.height-2);
            
            // Add text info
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            
            const iframeUrl = iframe.src;
            const lines = [
                'DDC4000 Interface Screenshot',
                `URL: ${iframeUrl}`,
                `Size: ${canvas.width}x${canvas.height}`,
                '',
                'Note: Due to browser security,',
                'iframe content cannot be captured directly.',
                '',
                'Try these alternatives:',
                '• Use browser screenshot (Ctrl+Shift+S)',
                '• Open DDC in new tab and screenshot',
                '• Use screen capture tool'
            ];
            
            lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width/2, 60 + (index * 25));
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            this.saveScreenshot(dataUrl);
            
            this.ddcBrowser.showSuccess('Placeholder screenshot created with DDC info!');
            
        } catch (error) {
            console.error('Simple capture failed:', error);
            this.ddcBrowser.showError('Simple capture failed: ' + error.message);
        }
    }

    openDdcInNewTab() {
        const iframe = this.ddcBrowser.websiteFrame;
        if (!iframe.src) {
            this.ddcBrowser.showError('No DDC interface loaded. Please load an interface first.');
            return;
        }
        
        window.open(iframe.src, '_blank');
        this.ddcBrowser.showSuccess('DDC interface opened in new tab. You can now take a manual screenshot!');
    }

    copyDdcUrl() {
        const iframe = this.ddcBrowser.websiteFrame;
        if (!iframe.src) {
            this.ddcBrowser.showError('No DDC interface loaded. Please load an interface first.');
            return;
        }
        
        navigator.clipboard.writeText(iframe.src).then(() => {
            this.ddcBrowser.showSuccess('DDC URL copied to clipboard!');
        }).catch(() => {
            this.ddcBrowser.showError('Failed to copy URL to clipboard.');
        });
    }

    openDdcImageDirect() {
        const ip = this.ddcBrowser.ipInput.value.trim();
        if (!ip) {
            this.ddcBrowser.showError('Please enter an IP address first.');
            return;
        }
        
        const protocol = this.ddcBrowser.protocolSelect.value;
        const imageUrl = `${protocol}://${ip}/image.jpg`;
        
        window.open(imageUrl, '_blank');
        this.ddcBrowser.showSuccess('Direct image URL opened in new tab!');
    }
}