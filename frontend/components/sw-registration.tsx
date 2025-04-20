'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register service worker in production
      if (process.env.NODE_ENV === 'production') {
        const registerServiceWorker = async () => {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/'
            });
            
            console.log('ServiceWorker registration successful with scope:', registration.scope);
            
            // Check if there's an update available
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show a toast notification
                    toast.info('App update available', {
                      description: 'Refresh the page to apply updates',
                      duration: 10000,
                      action: {
                        label: 'Refresh',
                        onClick: () => window.location.reload()
                      }
                    });
                  }
                });
              }
            });
            
            // Handle service worker updates
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (!refreshing) {
                refreshing = true;
                window.location.reload();
              }
            });
            
          } catch (error) {
            console.error('ServiceWorker registration failed:', error);
          }
        };
        
        // Wait for the page to load before registering
        window.addEventListener('load', registerServiceWorker);
        
        return () => {
          window.removeEventListener('load', registerServiceWorker);
        };
      } else {
        console.log('ServiceWorker not registered in development mode');
      }
    }
  }, []);
  
  return null;
}
