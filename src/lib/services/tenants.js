import { supabase, handleSupabaseError } from './supabase';

export const tenantsService = {
  // Obtener todos los inquilinos de una propiedad
  async getPropertyTenants(propertyId) {

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms!rooms_tenant_id_fkey(
            id,
            name,
            monthly_rent,
            size_sqm,
            room_type
          )
        `)
        .eq('property_id', propertyId)
        .order('active', { ascending: false })
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw new Error(handleSupabaseError(error, 'getPropertyTenants'));
    }
  },

  // Obtener inquilinos activos de una propiedad
  async getActiveTenants(propertyId) {

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('property_id', propertyId)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active tenants:', error);
      throw new Error(handleSupabaseError(error, 'getActiveTenants'));
    }
  },

  // Obtener inquilinos disponibles para asignar (sin habitación asignada)
  async getAvailableTenants(propertyId) {
    try {
      // Obtener todos los inquilinos de la propiedad con su habitación asignada
      const { data: allTenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms!rooms_tenant_id_fkey(id)
        `)
        .eq('property_id', propertyId)
        .order('active', { ascending: false })
        .order('full_name');

      if (tenantsError) throw tenantsError;

      // Filtrar: solo mostrar inquilinos que NO tienen habitación asignada
      // Esto incluye tanto activos como inactivos sin habitación
      const available = (allTenants || []).filter(tenant => {
        // Si no tiene habitación asignada (room es null o array vacío), está disponible
        return !tenant.room || (Array.isArray(tenant.room) && tenant.room.length === 0);
      });

      return available;
    } catch (error) {
      console.error('Error fetching available tenants:', error);
      throw new Error(handleSupabaseError(error, 'getAvailableTenants'));
    }
  },

  // Obtener un inquilino por ID
  async getTenantById(tenantId) {

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms!rooms_tenant_id_fkey(
            id,
            name,
            monthly_rent,
            size_sqm,
            room_type
          )
        `)
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      throw new Error(handleSupabaseError(error, 'getTenantById'));
    }
  },

  // Crear un inquilino
  async createTenant(tenantData) {
    try {
      // Validar datos requeridos
      if (!tenantData.property_id || !tenantData.full_name) {
        throw new Error('Propiedad y nombre completo son obligatorios');
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw new Error(handleSupabaseError(error, 'createTenant'));
    }
  },

  // Actualizar un inquilino
  async updateTenant(tenantId, updates) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw new Error(handleSupabaseError(error, 'updateTenant'));
    }
  },

  // Eliminar un inquilino
  async deleteTenant(tenantId) {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(handleSupabaseError(error, 'deleteTenant'));
    }
  },

  // Desactivar un inquilino (en lugar de eliminarlo)
  async deactivateTenant(tenantId) {
    return this.updateTenant(tenantId, { active: false });
  },

  // Activar un inquilino
  async activateTenant(tenantId) {
    return this.updateTenant(tenantId, { active: true });
  },

  // Asignar inquilino a habitación
  async assignToRoom(tenantId, roomId) {

    try {
      const { error } = await supabase.rpc('assign_tenant_to_room', {
        p_tenant_id: tenantId,
        p_room_id: roomId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning tenant to room:', error);
      throw new Error(handleSupabaseError(error, 'assignToRoom'));
    }
  },

  // Desasignar inquilino de habitación
  async unassignFromRoom(roomId) {

    try {
      const { error } = await supabase.rpc('unassign_tenant_from_room', {
        p_room_id: roomId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unassigning tenant from room:', error);
      throw new Error(handleSupabaseError(error, 'unassignFromRoom'));
    }
  },

  // Obtener contratos que vencen pronto
  async getExpiringContracts(daysAhead = 30) {
    try {
      const { data, error } = await supabase.rpc('get_expiring_contracts', {
        days_ahead: daysAhead
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      throw new Error(handleSupabaseError(error, 'getExpiringContracts'));
    }
  },

  // Obtener estadísticas de inquilinos de una propiedad
  async getTenantStats(propertyId) {
    const tenants = await this.getPropertyTenants(propertyId);
    
    return {
      total: tenants.length,
      active: tenants.filter(t => t.active).length,
      inactive: tenants.filter(t => !t.active).length,
      withContract: tenants.filter(t => t.contract_start_date).length,
      totalMonthlyRent: tenants
        .filter(t => t.active && t.room?.monthly_rent)
        .reduce((sum, t) => sum + parseFloat(t.room?.monthly_rent || 0), 0)
    };
  }
};

