import { supabase } from './supabase';

export const analyticsService = {
  /**
   * Obtener ingresos mensuales totales
   */
  async getMonthlyRevenue(userId, months = 12) {
    try {
      // Obtener propiedades donde el usuario tiene acceso
      const { data: accessList, error: accessError } = await supabase
        .from('property_access')
        .select('property_id')
        .eq('user_id', userId);
      
      if (accessError) throw accessError;
      const propertyIds = accessList.map(a => a.property_id);
      
      if (propertyIds.length === 0) {
        // No hay propiedades, devolver array vacío
        return [];
      }

      // Obtener todas las propiedades con sus habitaciones
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          rooms (
            id,
            monthly_rent,
            occupied,
            room_type
          )
        `)
        .in('id', propertyIds);

      if (error) throw error;

      // Calcular ingresos actuales
      const currentRevenue = properties.reduce((total, property) => {
        const propertyRevenue = property.rooms
          .filter(r => r.room_type !== 'common' && r.occupied)
          .reduce((sum, room) => sum + parseFloat(room.monthly_rent || 0), 0);
        return total + propertyRevenue;
      }, 0);

      // Generar datos históricos simulados (últimos N meses)
      const monthlyData = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        
        // Simular variación (en el futuro esto vendría de datos reales)
        const variation = Math.random() * 0.2 - 0.1; // ±10%
        const revenue = currentRevenue * (1 + variation);
        
        monthlyData.push({
          month: monthName,
          revenue: Math.round(revenue * 100) / 100,
          date: date
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Error getting monthly revenue:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas por propiedad
   */
  async getPropertyStats(userId) {
    try {
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
            monthly_rent,
            occupied,
            room_type
          )
        `)
        .in('id', propertyIds);

      if (error) throw error;

      return properties.map(property => {
        const privateRooms = property.rooms.filter(r => r.room_type !== 'common');
        const occupiedRooms = privateRooms.filter(r => r.occupied);
        const totalRevenue = occupiedRooms.reduce((sum, r) => sum + parseFloat(r.monthly_rent || 0), 0);
        const potentialRevenue = privateRooms.reduce((sum, r) => sum + parseFloat(r.monthly_rent || 0), 0);
        const occupancyRate = privateRooms.length > 0 
          ? (occupiedRooms.length / privateRooms.length * 100).toFixed(1)
          : 0;

        return {
          id: property.id,
          name: property.name,
          totalRooms: privateRooms.length,
          occupiedRooms: occupiedRooms.length,
          occupancyRate: parseFloat(occupancyRate),
          revenue: totalRevenue,
          potentialRevenue: potentialRevenue,
          lostRevenue: potentialRevenue - totalRevenue
        };
      });
    } catch (error) {
      console.error('Error getting property stats:', error);
      throw error;
    }
  },

  /**
   * Obtener distribución de ingresos
   */
  async getRevenueDistribution(userId) {
    try {
      const propertyStats = await this.getPropertyStats(userId);
      
      return propertyStats.map(p => ({
        name: p.name,
        value: p.revenue
      }));
    } catch (error) {
      console.error('Error getting revenue distribution:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen financiero general
   */
  async getFinancialSummary(userId) {
    try {
      const [propertyStats, monthlyRevenue] = await Promise.all([
        this.getPropertyStats(userId),
        this.getMonthlyRevenue(userId, 2)
      ]);

      const totalRevenue = propertyStats.reduce((sum, p) => sum + p.revenue, 0);
      const potentialRevenue = propertyStats.reduce((sum, p) => sum + p.potentialRevenue, 0);
      const lostRevenue = potentialRevenue - totalRevenue;
      const totalRooms = propertyStats.reduce((sum, p) => sum + p.totalRooms, 0);
      const occupiedRooms = propertyStats.reduce((sum, p) => sum + p.occupiedRooms, 0);
      const avgOccupancyRate = totalRooms > 0 
        ? (occupiedRooms / totalRooms * 100).toFixed(1)
        : 0;

      // Calcular crecimiento respecto al mes anterior
      const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
      const previousMonth = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || currentMonth;
      const growth = previousMonth > 0 
        ? ((currentMonth - previousMonth) / previousMonth * 100).toFixed(1)
        : 0;

      return {
        totalRevenue,
        potentialRevenue,
        lostRevenue,
        avgOccupancyRate: parseFloat(avgOccupancyRate),
        growth: parseFloat(growth),
        totalProperties: propertyStats.length,
        totalRooms,
        occupiedRooms
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }
};

