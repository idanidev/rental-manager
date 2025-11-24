import { supabase, handleSupabaseError } from './supabase';

export const houseRulesService = {
  // Obtener reglas de una propiedad
  async getPropertyRules(propertyId) {
    try {
      const { data, error } = await supabase
        .from('house_rules')
        .select('*')
        .eq('property_id', propertyId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(handleSupabaseError(error, 'getPropertyRules'));
      return data || [];
    } catch (error) {
      console.error('Error in getPropertyRules:', error);
      throw error;
    }
  },

  // Crear una regla
  async createRule(propertyId, ruleData, userId) {
    try {
      const { data, error } = await supabase
        .from('house_rules')
        .insert({
          property_id: propertyId,
          ...ruleData,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'createRule'));
      return data;
    } catch (error) {
      console.error('Error in createRule:', error);
      throw error;
    }
  },

  // Actualizar una regla
  async updateRule(ruleId, updates) {
    try {
      const { data, error } = await supabase
        .from('house_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'updateRule'));
      return data;
    } catch (error) {
      console.error('Error in updateRule:', error);
      throw error;
    }
  },

  // Eliminar una regla
  async deleteRule(ruleId) {
    try {
      const { error } = await supabase
        .from('house_rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw new Error(handleSupabaseError(error, 'deleteRule'));
    } catch (error) {
      console.error('Error in deleteRule:', error);
      throw error;
    }
  }
};

