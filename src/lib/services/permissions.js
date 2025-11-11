import { supabase } from './supabase';

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const permissionsService = {
  // Obtener usuarios con acceso a una propiedad (optimizado con RPC)
  async getPropertyAccess(propertyId) {
    try {
      const { data, error } = await supabase
        .rpc('get_property_users', {
          p_property_id: propertyId
        });
      
      if (error) {
        // Si la función RPC no existe, usar consulta directa
        console.warn('RPC get_property_users no disponible, usando consulta directa:', error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('property_access')
          .select('id, property_id, user_id, role, created_at')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        return (fallbackData || []).map(access => ({
          access_id: access.id,
          user_id: access.user_id,
          user_email: null,
          role: access.role,
          created_at: access.created_at
        }));
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting property access:', error);
      throw error;
    }
  },

  // Verificar si un usuario tiene permiso en una propiedad
  async checkPermission(propertyId, userId) {
    const { data, error } = await supabase
      .from('property_access')
      .select('role')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data?.role;
  },

  // Invitar un usuario a una propiedad
  async inviteUser(propertyId, email, role, invitedBy) {
    console.log('🔍 Invitando usuario:', { propertyId, email, role, invitedBy });
    
    // Buscar usuario por email usando función RPC
    let userId = null;
    
    try {
      console.log('🔎 Buscando usuario por email...');
      const { data: userData, error: userError } = await supabase.rpc('get_user_by_email', {
        user_email: email.toLowerCase()
      });
      
      console.log('📋 Resultado búsqueda:', { userData, userError });
      
      if (userError) {
        console.warn('⚠️ Error al buscar usuario (probablemente no existe la función RPC):', userError);
      }
      
      if (userData && userData.length > 0) {
        userId = userData[0].id;
        console.log('✅ Usuario encontrado:', userId);
      } else {
        console.log('❌ Usuario no encontrado en el sistema');
      }
    } catch (err) {
      // Si la función RPC no existe, continuamos con invitación pendiente
      console.warn('⚠️ RPC no disponible o error:', err);
    }

    // Si el usuario existe, dar acceso directo usando RPC (bypass RLS)
    if (userId) {
      try {
        const { data: accessData, error: accessError } = await supabase
          .rpc('grant_property_access', {
            p_property_id: propertyId,
            p_user_id: userId,
            p_role: role
          });
        
        if (accessError) throw accessError;
        
        return {
          type: 'direct',
          message: 'Usuario añadido directamente',
          access: accessData
        };
      } catch (err) {
        // Si la función RPC falla, lanzar el error con mensaje descriptivo
        throw new Error(err.message || 'Error al dar acceso al usuario');
      }
    }

    // Si el usuario no existe, crear invitación pendiente
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de validez

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        property_id: propertyId,
        email: email.toLowerCase(),
        role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: invitedBy
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      type: 'pending',
      message: 'Invitación guardada. El usuario recibirá acceso cuando se registre',
      invitation: data
    };
  },

  // Obtener invitación por token
  async getInvitation(token) {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        property:property_id (
          id,
          name,
          address
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error) throw error;
    return data;
  },

  // Aceptar invitación
  async acceptInvitation(token, userId) {
    const invitation = await this.getInvitation(token);
    
    if (!invitation) {
      throw new Error('Invitación inválida o expirada');
    }

    // Dar acceso al usuario usando RPC
    const { error: accessError } = await supabase
      .rpc('grant_property_access', {
        p_property_id: invitation.property_id,
        p_user_id: userId,
        p_role: invitation.role
      });
    
    if (accessError) throw accessError;

    // Eliminar la invitación
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('token', token);
    
    if (deleteError) throw deleteError;

    return invitation.property;
  },

  // Revocar acceso de un usuario (usando RPC)
  async revokeAccess(propertyId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('revoke_property_access', {
          p_property_id: propertyId,
          p_user_id: userId
        });
      
      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(err.message || 'Error al revocar acceso');
    }
  },

  // Cambiar rol de un usuario
  async changeUserRole(propertyId, userId, newRole) {
    // Primero revocar acceso
    await this.revokeAccess(propertyId, userId);
    
    // Luego dar acceso con nuevo rol usando RPC
    const { data, error } = await supabase
      .rpc('grant_property_access', {
        p_property_id: propertyId,
        p_user_id: userId,
        p_role: newRole
      });
    
    if (error) throw error;
    return data;
  },

  // Obtener invitaciones pendientes de una propiedad
  async getPendingInvitations(propertyId) {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('property_id', propertyId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Cancelar invitación
  async cancelInvitation(invitationId) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);
    
    if (error) throw error;
  },

  // Procesar invitaciones pendientes al registrarse/iniciar sesión
  async processPendingInvitations(userId, email) {
    try {
      // Buscar invitaciones pendientes para este email
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select(`
          id,
          property_id,
          role,
          property:property_id (
            id,
            name
          )
        `)
        .eq('email', email.toLowerCase())
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      if (!invitations || invitations.length === 0) return [];

      const processed = [];

      // Procesar cada invitación
      for (const invitation of invitations) {
        try {
          // Verificar que no tenga acceso ya
          const existing = await this.checkPermission(invitation.property_id, userId);
          if (existing) {
            // Ya tiene acceso, eliminar invitación
            await this.cancelInvitation(invitation.id);
            continue;
          }

          // Dar acceso usando RPC
          const { error: grantError } = await supabase
            .rpc('grant_property_access', {
              p_property_id: invitation.property_id,
              p_user_id: userId,
              p_role: invitation.role
            });
          
          if (grantError) throw grantError;

          // Eliminar invitación procesada
          await this.cancelInvitation(invitation.id);

          processed.push(invitation.property);
        } catch (err) {
          console.error('Error procesando invitación:', err);
        }
      }

      return processed;
    } catch (error) {
      console.error('Error procesando invitaciones pendientes:', error);
      return [];
    }
  },

  // Obtener invitaciones recibidas por un usuario
  async getMyInvitations(email) {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        property:property_id (
          id,
          name,
          address
        )
      `)
      .eq('email', email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading invitations:', error);
      throw error;
    }
    
    // No podemos hacer join directo con auth.users, así que omitimos inviter
    return (data || []).map(inv => ({
      ...inv,
      inviter: null // Por seguridad, auth.users no es accesible
    }));
  }
};
