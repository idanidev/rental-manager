import { supabase } from './supabase';

/**
 * Servicio completo de notificaciones
 * Maneja notificaciones en base de datos y configuración de usuario
 */
export const notificationsService = {
  /**
   * Obtener todas las notificaciones del usuario
   * @param {string} userId
   * @param {object} options - { limit, offset, unreadOnly }
   */
  async getNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (unreadOnly) {
        query = query.eq('read', false);
      }
      
      const { data, error } = await query;
      
      // Si la tabla no existe (código 42P01), retornar array vacío
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Notifications table does not exist yet. Run the migration first.');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      // Si la tabla no existe, retornar array vacío en lugar de lanzar error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table does not exist yet. Run the migration first.');
        return [];
      }
      console.error('Error getting notifications:', error);
      throw error;
    }
  },
  
  /**
   * Obtener contador de notificaciones no leídas
   * @param {string} userId
   */
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notifications_count', { p_user_id: userId });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      // Fallback: contar manualmente
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      return count || 0;
    }
  },
  
  /**
   * Marcar notificación como leída
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  /**
   * Marcar todas las notificaciones como leídas
   * @param {string} userId
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },
  
  /**
   * Eliminar notificación
   * @param {string} notificationId
   */
  async delete(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
  
  /**
   * Obtener configuración de notificaciones del usuario
   * @param {string} userId
   */
  async getSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      // Si no existe, crear configuración por defecto
      if (!data) {
        return await this.createDefaultSettings(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  },
  
  /**
   * Crear configuración por defecto
   * @param {string} userId
   */
  async createDefaultSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: userId,
          contract_alert_days: [7, 15, 30],
          enable_contract_alerts: true,
          enable_weekly_report: true,
          enable_invitation_alerts: true,
          enable_expense_alerts: true,
          enable_income_alerts: false,
          enable_room_alerts: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default settings:', error);
      throw error;
    }
  },
  
  /**
   * Actualizar configuración de notificaciones
   * @param {string} userId
   * @param {object} settings
   */
  async updateSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },
  
  /**
   * Crear una notificación de prueba
   * @param {string} userId
   * @param {string} propertyId - Opcional
   */
  async createTestNotification(userId, propertyId = null) {
    try {
      // Usar la función RPC create_notification
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: userId,
          p_type: 'contract_expiring',
          p_title: '🔔 Notificación de Prueba',
          p_message: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
          p_property_id: propertyId,
          p_metadata: {
            test: true,
            created_at: new Date().toISOString()
          }
        });
      
      if (error) {
        // Si la función RPC no existe o falla, intentar insertar directamente
        console.warn('RPC function failed, trying direct insert:', error);
        
        const { data: directData, error: directError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            property_id: propertyId,
            type: 'contract_expiring',
            title: '🔔 Notificación de Prueba',
            message: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
            metadata: testMetadata
          })
          .select()
          .single();
        
        if (directError) throw directError;
        return directData;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }
  },
  
  // ========================================
  // MÉTODOS LEGACY (compatibilidad)
  // ========================================
  
  /**
   * Obtener contratos que vencen pronto (LEGACY - mantener compatibilidad)
   */
  async getExpiringContracts(userId, daysAhead = 30) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

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

      return expiringContracts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } catch (error) {
      console.error('Error getting expiring contracts:', error);
      throw error;
    }
  },
  
  /**
   * Obtener contratos vencidos (LEGACY)
   */
  async getExpiredContracts(userId) {
    try {
      const today = new Date();

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
   * Obtener todas las notificaciones (LEGACY - compatibilidad)
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
  },
  
  /**
   * Crear una notificación de prueba
   * @param {string} userId
   * @param {string} propertyId - Opcional
   */
  async createTestNotification(userId, propertyId = null) {
    try {
      // Intentar usar la función RPC primero
      const testMetadata = {
        test: true,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: userId,
          p_type: 'contract_expiring',
          p_title: '🔔 Notificación de Prueba',
          p_message: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
          p_property_id: propertyId,
          p_metadata: testMetadata
        });
      
      if (error) {
        // Si la función RPC no existe o falla, intentar insertar directamente
        console.warn('RPC function failed, trying direct insert:', error);
        
        const { data: directData, error: directError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            property_id: propertyId,
            type: 'contract_expiring',
            title: '🔔 Notificación de Prueba',
            message: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
            metadata: testMetadata
          })
          .select()
          .single();
        
        if (directError) throw directError;
        return directData;
      }
      
      // Si RPC devuelve solo un UUID, obtener la notificación completa
      if (typeof data === 'string') {
        const { data: notification, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', data)
          .single();
        
        if (fetchError) throw fetchError;
        return notification;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }
  }
};
