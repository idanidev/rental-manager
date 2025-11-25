// Service Worker para Rental Manager PWA
const CACHE_NAME = 'rental-manager-v1';
const STATIC_CACHE = 'rental-manager-static-v1';
const DYNAMIC_CACHE = 'rental-manager-dynamic-v1';

// Archivos estáticos a cachear (se cachearán cuando se accedan)
const STATIC_ASSETS = [
  '/manifest.json'
];

// Estrategia: Cache First para estáticos, Network First para API
const CACHE_FIRST = [
  '/',
  '/manifest.json',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación - Cachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - Limpiar caches viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Eliminando cache viejo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - Estrategia de caché
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests a Supabase y otros servicios externos
  if (url.origin.includes('supabase.co') || 
      url.origin.includes('vercel.app') ||
      request.method !== 'GET') {
    return; // Dejar pasar sin cachear
  }

  // Cache First para assets estáticos
  if (CACHE_FIRST.some(path => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network First para páginas HTML
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale While Revalidate para otros recursos
  event.respondWith(staleWhileRevalidate(request));
});

// Estrategia: Cache First
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Error en cacheFirst:', error);
    // Retornar página offline si es HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/');
    }
    throw error;
  }
}

// Estrategia: Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network falló, usando cache:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Si es HTML y no hay cache, retornar página principal
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/');
    }
    throw error;
  }
}

// Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Si falla, retornar cache si existe
    return cached;
  });

  return cached || fetchPromise;
}

// Mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================

// Escuchar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recibida:', event);
  
  let notificationData = {
    title: 'Rental Manager',
    body: 'Tienes una nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-180.png',
    tag: 'rental-manager-notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions || [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icon-180.png'
        },
        {
          action: 'dismiss',
          title: 'Descartar'
        }
      ],
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = '/';

  // Determinar URL según el tipo de notificación
  if (notificationData.url) {
    urlToOpen = notificationData.url;
  } else if (notificationData.type === 'contract_expiring' || notificationData.type === 'contract_expired') {
    urlToOpen = notificationData.propertyId ? `/properties/${notificationData.propertyId}` : '/notifications';
  } else if (notificationData.type === 'invoice_pending') {
    urlToOpen = notificationData.propertyId ? `/properties/${notificationData.propertyId}` : '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir una nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejar acciones de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});


