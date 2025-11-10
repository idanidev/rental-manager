import { supabase, handleSupabaseError } from './supabase';

export const propertiesService = {
  // Obtener todas las propiedades del usuario
  async getUserProperties(userId) {
    try {
      // Primero obtener los IDs de propiedades a las que tiene acceso
      const { data: accessData, error: accessError } = await supabase
        .from('property_access')
        .select('property_id, role')
        .eq('user_id', userId);
      
      if (accessError) throw new Error(handleSupabaseError(accessError, 'getUserProperties - access'));
      
      if (!accessData || accessData.length === 0) {
        return [];
      }
      
      const propertyIds = accessData.map(a => a.property_id);
      
      // Luego obtener las propiedades y sus habitaciones
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          rooms(*)
        `)
        .in('id', propertyIds)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(handleSupabaseError(error, 'getUserProperties'));
      return data || [];
    } catch (error) {
      console.error('Error in getUserProperties:', error);
      throw error;
    }
  },

  // Obtener una propiedad específica
  async getProperty(propertyId) {
    try {
      // Obtener la propiedad con sus habitaciones
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          rooms(*)
        `)
        .eq('id', propertyId)
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'getProperty'));
      
      // Obtener los accesos por separado para evitar recursión
      const { data: accessData, error: accessError } = await supabase
        .from('property_access')
        .select('user_id, role')
        .eq('property_id', propertyId);
      
      if (!accessError && accessData) {
        data.property_access = accessData;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProperty:', error);
      throw error;
    }
  },

  // Crear una nueva propiedad
  async createProperty(propertyData, userId) {
    try {
      
      // Validar datos
      if (!propertyData.name || !propertyData.address) {
        throw new Error('Nombre y dirección son requeridos');
      }
      
      // Crear la propiedad
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          owner_id: userId
        })
        .select()
        .single();
      
      if (propertyError) throw new Error(handleSupabaseError(propertyError, 'createProperty'));

      // Dar acceso de owner al creador
      const { error: accessError } = await supabase
        .from('property_access')
        .insert({
          property_id: property.id,
          user_id: userId,
          role: 'owner'
        });
      
      if (accessError) throw new Error(handleSupabaseError(accessError, 'createProperty - access'));

      return property;
    } catch (error) {
      console.error('Error in createProperty:', error);
      throw error;
    }
  },

  // Actualizar una propiedad
  async updateProperty(propertyId, updates) {
    try {
      
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'updateProperty'));
      return data;
    } catch (error) {
      console.error('Error in updateProperty:', error);
      throw error;
    }
  },

  // Eliminar una propiedad
  async deleteProperty(propertyId) {
    try {
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (error) throw new Error(handleSupabaseError(error, 'deleteProperty'));
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      throw error;
    }
  },

  // Obtener estadísticas de una propiedad
  async getPropertyStats(propertyId, month = null) {
    try {
      
      const startDate = month ? new Date(month) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      // Obtener ingresos
      const { data: income, error: incomeError } = await supabase
        .from('income')
        .select('amount')
        .eq('property_id', propertyId)
        .gte('month', startDate.toISOString())
        .lte('month', endDate.toISOString());

      if (incomeError) throw new Error(handleSupabaseError(incomeError, 'getPropertyStats - income'));

      // Obtener gastos
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('property_id', propertyId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (expensesError) throw new Error(handleSupabaseError(expensesError, 'getPropertyStats - expenses'));

      const totalIncome = income?.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
      const profit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

      return {
        totalIncome,
        totalExpenses,
        profit,
        profitMargin
      };
    } catch (error) {
      console.error('Error in getPropertyStats:', error);
      throw error;
    }
  }
};
