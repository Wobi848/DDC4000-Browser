const CACHE_NAME = 'ddc4000-browser-v1.3.0';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/modules/screenshot.js',
  '/src/modules/gallery.js',
  '/src/modules/presets.js',
  '/src/modules/zoom.js',
  '/src/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/sitemap.xml',
  '/robots.txt'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Handle app shell requests
  if (STATIC_CACHE_URLS.includes(requestUrl.pathname) || requestUrl.pathname === '/') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, try to fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              // Cache successful responses
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              // Offline fallback for app shell
              if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
                return caches.match('/index.html');
              }
            });
        })
    );
    return;
  }
  
  // Handle HTTP proxy requests for DDC4000 mixed content
  if (requestUrl.pathname.startsWith('/proxy-ddc')) {
    const targetUrl = requestUrl.searchParams.get('url');
    if (targetUrl) {
      event.respondWith(
        fetch(targetUrl, {
          mode: 'no-cors',
          credentials: 'omit',
          headers: {
            'User-Agent': 'DDC4000-Browser/1.0'
          }
        }).then(response => {
          // Clone the response to read headers
          const responseHeaders = new Headers();
          
          // Copy important headers
          for (const [key, value] of response.headers.entries()) {
            if (!key.toLowerCase().startsWith('x-') && 
                !['content-security-policy', 'x-frame-options'].includes(key.toLowerCase())) {
              responseHeaders.set(key, value);
            }
          }
          
          // Add CORS and security headers
          responseHeaders.set('Access-Control-Allow-Origin', '*');
          responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST');
          responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
          responseHeaders.delete('X-Frame-Options');
          responseHeaders.delete('Content-Security-Policy');
          
          // Create new response with proper headers
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
          });
        }).catch(error => {
          console.error('DDC Proxy failed:', error);
          console.error('Target URL:', targetUrl);
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>DDC4000 - Connection Failed</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f8f9fa;
                }
                .error { color: #e74c3c; }
                .debug { 
                  background: #fff; 
                  border: 1px solid #ddd; 
                  border-radius: 8px; 
                  padding: 20px; 
                  margin: 20px auto; 
                  max-width: 600px; 
                  text-align: left;
                }
                .debug h3 { margin-top: 0; color: #2c3e50; }
                .debug pre { 
                  background: #f1f2f6; 
                  padding: 10px; 
                  border-radius: 4px; 
                  overflow-x: auto;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <h1 class="error">DDC4000 Connection Failed</h1>
              <p>Unable to connect to DDC4000 device</p>
              
              <div class="debug">
                <h3>Connection Details:</h3>
                <p><strong>Target URL:</strong> ${targetUrl}</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Error Type:</strong> ${error.name}</p>
                
                <h3>Troubleshooting:</h3>
                <ul>
                  <li>Check if the DDC4000 device is powered on</li>
                  <li>Verify the IP address (${new URL(targetUrl).hostname}) is correct</li>
                  <li>Ensure the device is on the same network</li>
                  <li>Try accessing the device directly: <a href="${targetUrl}" target="_blank">${targetUrl}</a></li>
                </ul>
              </div>
            </body>
            </html>
          `, { 
            status: 502,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
      );
      return;
    }
  }
  
  // Handle screenshot proxy requests
  if (requestUrl.pathname.startsWith('/proxy-screenshot')) {
    const targetUrl = requestUrl.searchParams.get('url');
    if (targetUrl) {
      event.respondWith(
        fetch(targetUrl, {
          mode: 'no-cors',
          credentials: 'omit'
        }).then(response => {
          // Create a new response with CORS headers
          const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream'
            }
          });
          return newResponse;
        }).catch(() => {
          return new Response('Proxy fetch failed', { status: 500 });
        })
      );
      return;
    }
  }
  
  // Handle DDC4000 device requests (pass through, don't cache)
  if (requestUrl.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) || 
      requestUrl.pathname.includes('ddcdialog.html') ||
      requestUrl.pathname.includes('ddcerror.html')) {
    
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return offline page for DDC requests
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>DDC4000 - Offline</title>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f0f0f0;
                  text-align: center;
                }
                .offline-message {
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  max-width: 400px;
                }
                .status-indicator {
                  font-size: 48px;
                  margin-bottom: 20px;
                }
                h1 {
                  color: #e74c3c;
                  margin: 0 0 15px 0;
                }
                p {
                  color: #7f8c8d;
                  margin: 10px 0;
                }
                .retry-btn {
                  background-color: #3498db;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="offline-message">
                <div class="status-indicator">📡</div>
                <h1>DDC4000 Device Offline</h1>
                <p>Cannot connect to the DDC4000 device at ${requestUrl.hostname}</p>
                <p>Check your network connection and device status.</p>
                <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }
  
  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync for screenshots (when available)
self.addEventListener('sync', (event) => {
  if (event.tag === 'screenshot-sync') {
    event.waitUntil(
      // Could implement background screenshot syncing here
      console.log('[Service Worker] Background sync: screenshot-sync')
    );
  }
});

// Push notifications (for future DDC alerts)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'DDC4000 Alert',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'ddc4000-alert',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Interface'
        },
        {
          action: 'screenshot',
          title: 'Take Screenshot'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'DDC4000 Browser', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'screenshot') {
    event.waitUntil(
      clients.openWindow('/?action=screenshot')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});