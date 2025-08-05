# DDC4000 Browser

Professional building automation interface browser for DDC4000 systems with advanced screenshot capabilities.

🌐 **Live Demo**: Currently offline (SSL certificate issue)

## Features

### 🏢 DDC4000 Interface
- **Multi-resolution support**: QVGA (320×240) and WVGA (800×480)
- **Protocol flexibility**: HTTP/HTTPS support
- **Real-time connection status** with visual indicators
- **Auto-fit scaling** for optimal viewing
- **Fullscreen mode** with ESC key support

### 📸 Advanced Screenshots
- **Screen sharing capture** with automatic iframe cropping
- **Multiple capture methods** with fallback options
- **High-quality PNG exports** with metadata
- **Gallery management** with preview and download
- **Auto-cropping** for perfect DDC interface capture

### ⚙️ Smart Configuration
- **Preset management** for frequently used devices
- **Auto-load presets** for instant startup
- **IP address suggestions** with common ranges
- **Collapsible interface** for distraction-free viewing
- **LocalStorage persistence** for user preferences

### ⌨️ Keyboard Shortcuts
- `Ctrl + +/-` - Zoom in/out
- `Ctrl + 0` - Reset zoom
- `Ctrl + R` - Refresh interface
- `Ctrl + S` - Take screenshot
- `Ctrl + G` - Toggle gallery
- `F11` - Toggle fullscreen
- `F` - Auto-fit interface
- `Escape` - Exit modes/close dialogs

### 📱 Progressive Web App (PWA)
- **Install on any device** (desktop, mobile, tablet)
- **Offline support** with service worker caching
- **App shortcuts** for quick screenshot and gallery access
- **Native app experience** with standalone display

## Quick Start

1. **Enter DDC4000 IP address** (e.g., 192.168.10.21)
2. **Select protocol** (HTTP/HTTPS) and resolution
3. **Click "Load DDC Interface"** to connect
4. **Take screenshots** using the camera button or `Ctrl + S`
5. **View gallery** to manage captured screenshots

## Installation

### As a Web App
Deploy the web app to your preferred hosting service and click the install button in your browser.

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd DDC4000-Browser

# Serve locally (Python)
python -m http.server 8000

# Serve locally (Node.js)
npx serve .

# Access at http://localhost:8000
```

## Browser Compatibility

- ✅ **Chrome/Edge**: Full feature support including screen sharing
- ✅ **Firefox**: Core features with fallback screenshot methods
- ✅ **Safari**: PWA installation and basic functionality
- ✅ **Mobile browsers**: Responsive design with touch support

## Architecture

### Modular Design
- `src/main.js` - Core application logic
- `src/modules/screenshot.js` - Screenshot management
- `src/modules/gallery.js` - Image gallery functionality
- `src/modules/presets.js` - Configuration presets
- `src/modules/zoom.js` - Viewport and zoom controls

### PWA Components
- `manifest.json` - App metadata and installation
- `sw.js` - Service worker for offline support
- Icon sets optimized for all platforms

## Configuration

### Preset Management
Save frequently used DDC4000 configurations:
- Device IP addresses
- Protocol preferences (HTTP/HTTPS)
- Resolution settings (QVGA/WVGA)
- Auto-load on startup option

### Screenshot Settings
- Automatic cropping to iframe content
- Multiple capture methods with fallback
- Gallery management with metadata

## Security & Privacy

- **No data collection** - all settings stored locally
- **No external dependencies** - works completely offline
- **Secure connections** - HTTPS support for encrypted communication
- **Local storage only** - screenshots and presets never leave your device

## Technical Requirements

- **Modern web browser** with ES6 module support
- **HTTPS or localhost** for screen sharing features
- **Network access** to DDC4000 devices
- **LocalStorage** for settings persistence

## License

This project is open source. See the LICENSE file for details.

## Support

For issues, feature requests, or contributions, please visit the project repository.

---

**Built for building automation professionals** | **Powered by modern web technologies**