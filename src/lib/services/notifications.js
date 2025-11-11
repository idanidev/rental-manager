import { supabase } from './supabase';

export const notificationsService = {
  /**
   * Obtener contratos que vencen pronto
   */
  async getExpiringContracts(userId, daysAhead = 30) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      // Obtener propiedades donde el usuario tiene acceso
      const { data: accessList, error: accessError } = await supabase
        .from('property_access')
        .select('property_id')
        .eq('user_id', userId);
      
      if (accessError) throw accessError;
      const propertyIds = accessList.map(a => a.property_id);
      
      if (propertyIds.length === 0) return [];

      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          rooms (
            id,
            name,
            tenant_id,
            tenants:tenant_id (
              id,
              full_name,
              email,
              phone,
              contract_end_date,
              active
            )
          )
        `)
        .in('id', propertyIds);

      if (error) throw error;

      const expiringContracts = [];

      properties.forEach(property => {
        property.rooms?.forEach(room => {
          const tenant = Array.isArray(room.tenants) ? room.tenants[0] : room.tenants;
          
          if (tenant?.contract_end_date && tenant.active) {
            const endDate = new Date(tenant.contract_end_date);
            const daysUntilExpiry = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry >= 0 && daysUntilExpiry <= daysAhead) {
              expiringContracts.push({
                id: `${tenant.id}-${room.id}`,
                tenantId: tenant.id,
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                tenantPhone: tenant.phone,
                roomName: room.name,
                propertyId: property.id,
                propertyName: property.name,
                contractEndDate: tenant.contract_end_date,
                daysUntilExpiry,
                urgency: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low'
              });
            }
          }
        });
      });

      // Ordenar por urgencia y días restantes
      return expiringContracts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } catch (error) {
      console.error('Error getting expiring contracts:', error);
      throw error;
    }
  },

  /**
   * Obtener contratos vencidos
   */
  async getExpiredContracts(userId) {
    try {
      const today = new Date();

      // Obtener propiedades donde el usuario tiene acceso
      const { data: accessList, error: accessError } = await supabase
        .from('property_access')
        .select('property_id')
        .eq('user_id', userId);
      
      if (accessError) throw accessError;
      const propertyIds = accessList.map(a => a.property_id);
      
      if (propertyIds.length === 0) return [];

      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          rooms (
            id,
            name,
            tenant_id,
            tenants:tenant_id (
              id,
              full_name,
              email,
              contract_end_date,
              active
            )
          )
        `)
        .in('id', propertyIds);

      if (error) throw error;

      const expiredContracts = [];

      properties.forEach(property => {
        property.rooms?.forEach(room => {
          const tenant = Array.isArray(room.tenants) ? room.tenants[0] : room.tenants;
          
          if (tenant?.contract_end_date && tenant.active) {
            const endDate = new Date(tenant.contract_end_date);
            const daysExpired = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
            
            if (daysExpired > 0) {
              expiredContracts.push({
                id: `${tenant.id}-${room.id}`,
                tenantId: tenant.id,
                tenantName: tenant.full_name,
                tenantEmail: tenant.email,
                roomName: room.name,
                propertyId: property.id,
                propertyName: property.name,
                contractEndDate: tenant.contract_end_date,
                daysExpired
              });
            }
          }
        });
      });

      return expiredContracts.sort((a, b) => b.daysExpired - a.daysExpired);
    } catch (error) {
      console.error('Error getting expired contracts:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las notificaciones (venciendo + vencidos)
   */
  async getAllNotifications(userId) {
    try {
      const [expiring, expired] = await Promise.all([
        this.getExpiringContracts(userId),
        this.getExpiredContracts(userId)
      ]);

      return {
        expiring,
        expired,
        total: expiring.length + expired.length,
        urgent: expiring.filter(c => c.urgency === 'high').length + expired.length
      };
    } catch (error) {
      console.error('Error getting all notifications:', error);
      throw error;
    }
  }
};

