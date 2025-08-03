// Gallery functionality module
export class GalleryManager {
    constructor(ddcBrowser) {
        this.ddcBrowser = ddcBrowser;
        this.inspectorZoom = 1.0;
        this.currentInspectorScreenshot = null;
    }

    toggleGallery() {
        if (this.ddcBrowser.galleryModal.classList.contains('hidden')) {
            this.openGallery();
        } else {
            this.closeGallery();
        }
    }

    openGallery() {
        this.ddcBrowser.galleryModal.classList.remove('hidden');
        this.ddcBrowser.galleryModal.style.display = 'flex';
        this.ddcBrowser.galleryModal.style.visibility = 'visible';
        this.ddcBrowser.galleryModal.style.opacity = '1';
        this.ddcBrowser.galleryModal.style.pointerEvents = 'auto';
        this.updateGalleryDisplay();
        console.log('Gallery opened - classes:', this.ddcBrowser.galleryModal.className);
    }

    closeGallery() {
        this.ddcBrowser.galleryModal.classList.add('hidden');
        this.ddcBrowser.galleryModal.style.display = 'none';
        this.ddcBrowser.galleryModal.style.visibility = 'hidden';
        this.ddcBrowser.galleryModal.style.opacity = '0';
        this.ddcBrowser.galleryModal.style.pointerEvents = 'none';
        console.log('Gallery closed - classes:', this.ddcBrowser.galleryModal.className);
    }

    clearGallery() {
        if (this.ddcBrowser.screenshotManager.screenshots.length === 0) {
            this.ddcBrowser.showError('No screenshots to clear.');
            return;
        }
        
        if (confirm(`Delete all ${this.ddcBrowser.screenshotManager.screenshots.length} screenshots? This cannot be undone.`)) {
            this.ddcBrowser.screenshotManager.screenshots = [];
            this.ddcBrowser.screenshotManager.saveScreenshots();
            this.updateGalleryDisplay();
            this.ddcBrowser.showSuccess('All screenshots cleared.');
        }
    }

    exportGallery() {
        const screenshots = this.ddcBrowser.screenshotManager.screenshots;
        if (screenshots.length === 0) {
            this.ddcBrowser.showError('No screenshots to export.');
            return;
        }

        // Create and download a ZIP file with all screenshots
        this.createAndDownloadZip(screenshots);
    }

    async createAndDownloadZip(screenshots) {
        try {
            this.ddcBrowser.showSuccess('Preparing screenshots for download...');
            
            // Simple approach: download screenshots individually
            for (let i = 0; i < screenshots.length; i++) {
                const screenshot = screenshots[i];
                const link = document.createElement('a');
                link.href = screenshot.dataUrl;
                link.download = screenshot.filename;
                link.click();
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            this.ddcBrowser.showSuccess(`Downloaded ${screenshots.length} screenshots!`);
        } catch (error) {
            console.error('Export failed:', error);
            this.ddcBrowser.showError('Failed to export screenshots.');
        }
    }

    updateGalleryDisplay() {
        const screenshots = this.ddcBrowser.screenshotManager.screenshots;
        
        if (screenshots.length === 0) {
            this.ddcBrowser.galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <p>No screenshots yet. Click 📷 to capture your first screenshot!</p>
                </div>
            `;
            return;
        }

        const galleryHtml = screenshots.map(screenshot => {
            // Create a temporary image to get dimensions
            const img = new Image();
            img.src = screenshot.dataUrl;
            
            return `
                <div class="gallery-item" data-screenshot-id="${screenshot.id}">
                    <img src="${screenshot.dataUrl}" alt="Screenshot" class="gallery-image">
                    <div class="gallery-info">
                        <div class="gallery-timestamp">${new Date(screenshot.timestamp).toLocaleString()}</div>
                        <div class="gallery-details">
                            <span>DDC Screenshot</span>
                            <span>${screenshot.filename.includes('qvga') || screenshot.dataUrl.includes('type=QVGA') ? 'QVGA' : 'WVGA'}</span>
                        </div>
                        <div class="gallery-actions">
                            <button class="gallery-btn inspect-btn" title="Inspect">🔍</button>
                            <button class="gallery-btn download" title="Download">💾</button>
                            <button class="gallery-btn delete" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.ddcBrowser.galleryGrid.innerHTML = galleryHtml;

        // Add event listeners
        this.ddcBrowser.galleryGrid.querySelectorAll('.gallery-image').forEach((img, index) => {
            img.addEventListener('click', () => {
                this.inspectScreenshot(screenshots[index]);
            });
            img.style.cursor = 'pointer';
        });

        this.ddcBrowser.galleryGrid.querySelectorAll('.inspect-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.inspectScreenshot(screenshots[index]);
            });
        });

        this.ddcBrowser.galleryGrid.querySelectorAll('.download-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadScreenshot(screenshots[index]);
            });
        });

        this.ddcBrowser.galleryGrid.querySelectorAll('.delete-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteScreenshot(screenshots[index].id);
            });
        });
    }

    inspectScreenshot(screenshot) {
        this.currentInspectorScreenshot = screenshot;
        this.inspectorZoom = 1.0;
        
        this.ddcBrowser.inspectorImage.src = screenshot.dataUrl;
        this.ddcBrowser.inspectorTitle.textContent = 'Screenshot Inspector';
        this.ddcBrowser.inspectorTimestamp.textContent = new Date(screenshot.timestamp).toLocaleString();
        this.ddcBrowser.inspectorZoomLevel.textContent = '100%';
        
        this.ddcBrowser.imageInspector.classList.remove('hidden');
        this.ddcBrowser.imageInspector.style.display = 'flex';
        
        console.log('Inspector opened for screenshot:', screenshot.filename);
    }

    closeInspector() {
        this.ddcBrowser.imageInspector.classList.add('hidden');
        this.ddcBrowser.imageInspector.style.display = 'none';
        this.currentInspectorScreenshot = null;
    }

    downloadScreenshot(screenshot) {
        const link = document.createElement('a');
        link.href = screenshot.dataUrl;
        link.download = screenshot.filename;
        link.click();
        console.log('Downloaded:', screenshot.filename);
    }

    deleteScreenshot(screenshotId) {
        if (!confirm('Delete this screenshot? This cannot be undone.')) {
            return;
        }

        const screenshots = this.ddcBrowser.screenshotManager.screenshots;
        const index = screenshots.findIndex(s => s.id === screenshotId);
        if (index !== -1) {
            screenshots.splice(index, 1);
            this.ddcBrowser.screenshotManager.saveScreenshots();
            this.updateGalleryDisplay();
            this.ddcBrowser.showSuccess('Screenshot deleted.');
        }
    }

    // Inspector zoom controls
    inspectorZoomIn() {
        this.inspectorZoom = Math.min(this.inspectorZoom * 1.2, 5.0);
        this.updateInspectorZoom();
    }

    inspectorZoomOut() {
        this.inspectorZoom = Math.max(this.inspectorZoom / 1.2, 0.1);
        this.updateInspectorZoom();
    }

    inspectorFitToScreen() {
        this.inspectorZoom = 1.0;
        this.updateInspectorZoom();
    }

    updateInspectorZoom() {
        this.ddcBrowser.inspectorImage.style.transform = `scale(${this.inspectorZoom})`;
        this.ddcBrowser.inspectorZoomLevel.textContent = `${Math.round(this.inspectorZoom * 100)}%`;
    }

    downloadCurrentInspectorImage() {
        if (this.currentInspectorScreenshot) {
            this.downloadScreenshot(this.currentInspectorScreenshot);
        }
    }
}