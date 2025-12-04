/**
 * Servicio para gestionar notificaciones del navegador (Browser Notifications API)
 */

const DEFAULT_OPTIONS = {
  icon: '/favicon.png',
  badge: '/favicon.png',
  tag: 'rental-manager',
  requireInteraction: false,
  silent: false
};

/**
 * Solicitar permisos para notificaciones del navegador
 * @returns {Promise<string>} 'granted', 'denied', o 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return 'unsupported';
  }

  try {
    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return 'denied';
  }
}

/**
 * Verificar si las notificaciones están permitidas
 * @returns {boolean}
 */
export function hasNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Obtener el estado actual de los permisos
 * @returns {string} 'granted', 'denied', 'default', o 'unsupported'
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Mostrar una notificación del navegador
 * @param {string} title
 * @param {object} options
 * @returns {Notification|null}
 */
export function showBrowserNotification(title, options = {}) {
  if (!hasNotificationPermission()) {
    console.warn('No hay permisos para mostrar notificaciones');
    return null;
  }

  try {
    const notificationOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    const notification = new Notification(title, notificationOptions);

    // Cerrar automáticamente después de 5 segundos (si no requiere interacción)
    if (!notificationOptions.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  } catch (error) {
    console.error('Error al mostrar notificación:', error);
    return null;
  }
}

/**
 * Configurar Service Worker para notificaciones (PWA)
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function setupServiceWorkerNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers no están soportados');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Error al configurar Service Worker para notificaciones:', error);
    return null;
  }
}



