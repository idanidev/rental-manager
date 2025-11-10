import { supabase } from './supabase';

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const permissionsService = {
  // Obtener usuarios con acceso a una propiedad
  async getPropertyAccess(propertyId) {
    const { data, error } = await supabase
      .from('property_access')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('property_id', propertyId);
    
    if (error) throw error;
    return data;
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
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de validez

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        property_id: propertyId,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: invitedBy
      })
      .select()
      .single();
    
    if (error) throw error;

    // Aquí podrías enviar un email con el link de invitación
    // await sendInvitationEmail(email, token);
    
    return data;
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
        ),
        inviter:created_by (
          email,
          raw_user_meta_data
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

    // Dar acceso al usuario
    const { error: accessError } = await supabase
      .from('property_access')
      .insert({
        property_id: invitation.property_id,
        user_id: userId,
        role: invitation.role
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

  // Revocar acceso de un usuario
  async revokeAccess(propertyId, userId) {
    const { error } = await supabase
      .from('property_access')
      .delete()
      .eq('property_id', propertyId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  // Cambiar rol de un usuario
  async changeUserRole(propertyId, userId, newRole) {
    const { data, error } = await supabase
      .from('property_access')
      .update({ role: newRole })
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .select()
      .single();
    
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
  }
};
