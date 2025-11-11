import { supabase } from './supabase';

export const searchService = {
  /**
   * Búsqueda global en propiedades, habitaciones e inquilinos
   */
  async globalSearch(userId, query) {
    if (!query || query.trim().length < 2) {
      return { properties: [], rooms: [], tenants: [] };
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    try {
      // Obtener propiedades donde el usuario tiene acceso
      const { data: accessList, error: accessError } = await supabase
        .from('property_access')
        .select('property_id')
        .eq('user_id', userId);
      
      if (accessError) throw accessError;
      const propertyIds = accessList.map(a => a.property_id);

      // Buscar propiedades
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name, address, city')
        .in('id', propertyIds)
        .or(`name.ilike.${searchTerm},address.ilike.${searchTerm},city.ilike.${searchTerm}`)
        .limit(5);

      if (propertiesError) throw propertiesError;

      // Buscar habitaciones
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          monthly_rent,
          occupied,
          room_type,
          property:properties!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('property.user_id', userId)
        .ilike('name', searchTerm)
        .limit(5);

      if (roomsError) throw roomsError;

      // Buscar inquilinos
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          phone,
          active,
          property:properties!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('property.user_id', userId)
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);

      if (tenantsError) throw tenantsError;

      return {
        properties: properties || [],
        rooms: (rooms || []).map(r => ({
          ...r,
          propertyName: r.property?.name,
          propertyId: r.property?.id
        })),
        tenants: (tenants || []).map(t => ({
          ...t,
          propertyName: t.property?.name,
          propertyId: t.property?.id
        }))
      };
    } catch (error) {
      console.error('Error in global search:', error);
      throw error;
    }
  }
};

