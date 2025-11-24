import { supabase, handleSupabaseError } from './supabase';

export const remindersService = {
  // Obtener recordatorios de una propiedad
  async getPropertyReminders(propertyId, includeCompleted = false) {
    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('property_id', propertyId)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });
      
      if (!includeCompleted) {
        query = query.eq('completed', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(handleSupabaseError(error, 'getPropertyReminders'));
      return data || [];
    } catch (error) {
      console.error('Error in getPropertyReminders:', error);
      throw error;
    }
  },

  // Obtener recordatorios próximos (próximos 7 días)
  async getUpcomingReminders(propertyId) {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('property_id', propertyId)
        .eq('completed', false)
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', nextWeek.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });
      
      if (error) throw new Error(handleSupabaseError(error, 'getUpcomingReminders'));
      return data || [];
    } catch (error) {
      console.error('Error in getUpcomingReminders:', error);
      throw error;
    }
  },

  // Crear un recordatorio
  async createReminder(propertyId, reminderData, userId) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          property_id: propertyId,
          ...reminderData,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'createReminder'));
      return data;
    } catch (error) {
      console.error('Error in createReminder:', error);
      throw error;
    }
  },

  // Actualizar un recordatorio
  async updateReminder(reminderId, updates) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', reminderId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'updateReminder'));
      return data;
    } catch (error) {
      console.error('Error in updateReminder:', error);
      throw error;
    }
  },

  // Marcar recordatorio como completado
  async markAsCompleted(reminderId, completed = true) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', reminderId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'markAsCompleted'));
      return data;
    } catch (error) {
      console.error('Error in markAsCompleted:', error);
      throw error;
    }
  },

  // Eliminar un recordatorio
  async deleteReminder(reminderId) {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);
      
      if (error) throw new Error(handleSupabaseError(error, 'deleteReminder'));
    } catch (error) {
      console.error('Error in deleteReminder:', error);
      throw error;
    }
  }
};

