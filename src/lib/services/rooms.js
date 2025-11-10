import { supabase } from './supabase';

export const roomsService = {
  // Obtener habitaciones de una propiedad
  async getPropertyRooms(propertyId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Crear una habitación
  async createRoom(roomData) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar una habitación
  async updateRoom(roomId, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar una habitación
  async deleteRoom(roomId) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (error) throw error;
  },

  // Marcar habitación como ocupada/disponible
  async toggleOccupancy(roomId, occupied, tenantName = null) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ 
        occupied, 
        tenant_name: occupied ? tenantName : null 
      })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener ingresos de una habitación
  async getRoomIncome(roomId, startDate, endDate) {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('room_id', roomId)
      .gte('month', startDate)
      .lte('month', endDate)
      .order('month', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
