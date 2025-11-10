import { writable } from 'svelte/store';
import { supabase, onAuthStateChange } from '../services/supabase';

function createUserStore() {
  const { subscribe, set, update } = writable(null);
  let authSubscription = null;

  return {
    subscribe,
    set,
    update,
    async init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          set(user);
        }

        // Suscribirse a cambios en la autenticación (solo una vez)
        if (!authSubscription) {
          authSubscription = onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            set(session?.user || null);
            
            // Recargar datos cuando el usuario inicia sesión
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              // Disparar evento personalizado para que otros componentes se actualicen
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('user-auth-changed', { 
                  detail: { user: session?.user, event } 
                }));
              }
            }
          });
        }
      } catch (error) {
        console.error('Error initializing user store:', error);
        set(null);
      }
    },
    async refresh() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error) {
          set(user);
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    },
    clear() {
      set(null);
      
      // Limpiar suscripción
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
    }
  };
}

export const userStore = createUserStore();
