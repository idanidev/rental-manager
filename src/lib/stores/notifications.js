import { writable, derived } from 'svelte/store';
import { supabase } from '../services/supabase';
import { notificationsService } from '../services/notifications';

function createNotificationsStore() {
  const { subscribe, set, update } = writable([]);
  let realtimeSubscription = null;
  let userId = null;

  return {
    subscribe,
    
    /**
     * Inicializar store y suscribirse a Realtime
     * @param {string} user_id
     */
    async init(user_id) {
      if (!user_id) return;
      
      try {
        userId = user_id;
        
        // Cargar notificaciones iniciales (silenciosamente, no romper si falla)
        await this.load();
        
        // Suscribirse a cambios en tiempo real (silenciosamente, no romper si falla)
        this.subscribeToRealtime();
      } catch (error) {
        // No romper la aplicación si las notificaciones fallan
        console.warn('Error initializing notifications store (tables may not exist yet):', error);
        set([]);
      }
    },
    
    /**
     * Cargar notificaciones desde la base de datos
     */
    async load() {
      if (!userId) return;
      
      try {
        const notifications = await notificationsService.getNotifications(userId);
        set(notifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
        set([]);
      }
    },
    
    /**
     * Suscribirse a cambios en tiempo real
     */
    subscribeToRealtime() {
      if (!userId || realtimeSubscription) return;
      
      try {
        realtimeSubscription = supabase
          .channel(`notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              // Añadir nueva notificación al inicio de la lista
              update((notifications) => [payload.new, ...notifications]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              // Actualizar notificación existente
              update((notifications) =>
                notifications.map((n) =>
                  n.id === payload.new.id ? payload.new : n
                )
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              // Eliminar notificación
              update((notifications) =>
                notifications.filter((n) => n.id !== payload.old.id)
              );
            }
          )
          .subscribe();
      } catch (error) {
        // No romper la aplicación si la suscripción falla
        console.warn('Error subscribing to notifications realtime (tables may not exist yet):', error);
      }
    },
    
    /**
     * Desuscribirse de Realtime
     */
    unsubscribe() {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
      }
    },
    
    /**
     * Marcar notificación como leída
     */
    async markAsRead(notificationId) {
      try {
        await notificationsService.markAsRead(notificationId);
        update((notifications) =>
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    
    /**
     * Marcar todas como leídas
     */
    async markAllAsRead() {
      if (!userId) return;
      
      try {
        await notificationsService.markAllAsRead(userId);
        update((notifications) =>
          notifications.map((n) => ({ ...n, read: true }))
        );
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    },
    
    /**
     * Eliminar notificación
     */
    async delete(notificationId) {
      try {
        await notificationsService.delete(notificationId);
        update((notifications) =>
          notifications.filter((n) => n.id !== notificationId)
        );
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    
    /**
     * Limpiar store
     */
    clear() {
      this.unsubscribe();
      set([]);
      userId = null;
    }
  };
}

export const notificationsStore = createNotificationsStore();

// Store derivado: Contador de no leídas
export const unreadCount = derived(
  notificationsStore,
  ($notifications) => $notifications.filter((n) => !n.read).length
);

// Store derivado: Notificaciones urgentes (≤7 días)
export const urgentCount = derived(
  notificationsStore,
  ($notifications) => {
    return $notifications.filter((n) => {
      if (n.type === 'contract_expiring' && n.metadata?.days_remaining !== undefined) {
        return n.metadata.days_remaining <= 7;
      }
      if (n.type === 'contract_expired') {
        return true;
      }
      return false;
    }).length;
  }
);

