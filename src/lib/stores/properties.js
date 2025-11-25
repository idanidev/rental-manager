import { writable, derived } from 'svelte/store';
import { propertiesService } from '../services/properties';
import { supabase } from '../services/supabase';

function createPropertiesStore() {
  const { subscribe, set, update } = writable([]);
  let realtimeSubscription = null;

  return {
    subscribe,
    set,
    update,
    async load(userId) {
      if (!userId) {
        set([]);
        return;
      }
      
      try {
        const properties = await propertiesService.getUserProperties(userId);
        set(properties);
        
        // DESHABILITADO: Suscripciones Realtime causan llamadas automáticas
        // this.subscribeToRealtimeUpdates(userId);
      } catch (error) {
        console.error('Error loading properties:', error);
        set([]);
      }
    },
    
    subscribeToRealtimeUpdates(userId) {
      if (realtimeSubscription) return;
      
      try {
        // Suscribirse a cambios en la tabla properties
        realtimeSubscription = supabase
          .channel('properties-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'properties'
            },
            (payload) => {
              console.log('Property change detected:', payload);
              // Recargar propiedades cuando hay cambios
              this.load(userId);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rooms'
            },
            (payload) => {
              console.log('Room change detected:', payload);
              // Recargar propiedades cuando hay cambios en habitaciones
              this.load(userId);
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error subscribing to realtime updates:', error);
      }
    },
    
    unsubscribeFromRealtimeUpdates() {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        realtimeSubscription = null;
      }
    },
    
    async add(property) {
      update(properties => [...properties, property]);
    },
    
    async updateProperty(propertyId, updates) {
      update(properties => 
        properties.map(p => p.id === propertyId ? { ...p, ...updates } : p)
      );
    },
    
    async remove(propertyId) {
      update(properties => properties.filter(p => p.id !== propertyId));
    },
    
    clear() {
      this.unsubscribeFromRealtimeUpdates();
      set([]);
    }
  };
}

export const propertiesStore = createPropertiesStore();

// Store para la propiedad seleccionada actualmente
export const selectedProperty = writable(null);

// Stores derivados para estadísticas generales
export const totalProperties = derived(
  propertiesStore,
  $properties => $properties.length
);

// Total de habitaciones (solo privadas, excluyendo salas comunes)
export const totalRooms = derived(
  propertiesStore,
  $properties => $properties.reduce((sum, p) => 
    sum + (p.rooms?.filter(r => r.room_type !== 'common').length || 0), 0)
);

// Habitaciones ocupadas (solo privadas)
export const occupiedRooms = derived(
  propertiesStore,
  $properties => $properties.reduce((sum, p) => 
    sum + (p.rooms?.filter(r => r.room_type !== 'common' && r.occupied).length || 0), 0
  )
);

// Tasa de ocupación (solo habitaciones privadas)
export const occupancyRate = derived(
  [totalRooms, occupiedRooms],
  ([$totalRooms, $occupiedRooms]) => 
    $totalRooms > 0 ? ($occupiedRooms / $totalRooms * 100).toFixed(1) : 0
);
