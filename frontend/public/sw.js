// Service Worker for ParkOS
const CACHE_NAME = 'parkos-v1.2'; // Increased version number

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/fonts/GeneralSans-Variable.woff2',
  '/fonts/GeneralSans-VariableItalic.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Cache static assets failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the service worker takes control of the page immediately
        return self.clients.claim();
      })
      .catch(err => console.error('Clean up caches failed:', err))
  );
});

// Fetch event - network-first for most resources, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API calls - we want these to always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML navigation - network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before using it
          const responseClone = response.clone();
          
          // Update the cache with the latest version
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          }).catch(err => console.error('Failed to cache navigation response:', err));
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to index if nothing else works
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Static assets (fonts, images, css, js) - cache-first strategy
  if (
    event.request.url.match(/\.(woff2|jpg|jpeg|png|gif|svg|css|js)$/) ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses or opaque responses
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            
            // Clone the response and cache it
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            }).catch(err => console.error('Failed to cache asset:', err));
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed for asset:', error);
            // Return a fallback response if we can't fetch the asset
            return new Response('Network error loading asset', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
    );
    return;
  }

  // For other requests - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        }).catch(err => console.error('Failed to cache response:', err));
        
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from ParkOS',
      icon: '/icons/icon-192.png',
      badge: '/icons/notification-badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'ParkOS Notification', 
        options
      )
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
