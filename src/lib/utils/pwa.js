// Utilidades para PWA
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
          
          // Escuchar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  console.log('🔄 Nueva versión disponible');
                  // Opcional: mostrar notificación al usuario
                  if (confirm('Hay una nueva versión disponible. ¿Quieres actualizar?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    });
    
    // Escuchar cambios de estado del service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker actualizado, recargando...');
      window.location.reload();
    });
  }
}

export function isPWAInstalled() {
  if (typeof window === 'undefined') return false;
  
  // Detectar si está instalado como PWA
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export async function installPWA() {
  if (typeof window === 'undefined') return false;
  
  // Buscar el evento de instalación
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  
  return false;
}

export function showInstallPrompt() {
  if (typeof window === 'undefined') return;
  
  // Crear un banner de instalación personalizado
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 border border-gray-200 dark:border-gray-700';
  banner.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 dark:text-gray-200">Instalar Rental Manager</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Instala la app para acceso rápido y uso offline</p>
      </div>
      <div class="flex gap-2">
        <button id="pwa-install-btn" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
          Instalar
        </button>
        <button id="pwa-dismiss-btn" class="px-4 py-2 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Ahora no
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    const installed = await installPWA();
    if (installed) {
      banner.remove();
    }
  });
  
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  });
  
  // Auto-ocultar después de 10 segundos
  setTimeout(() => {
    if (document.getElementById('pwa-install-banner')) {
      banner.remove();
    }
  }, 10000);
}

