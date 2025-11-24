import { supabase, handleSupabaseError } from './supabase';

export const sharedExpensesService = {
  // Obtener gastos compartidos de una propiedad
  async getPropertyExpenses(propertyId) {
    try {
      const { data, error } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          expense_splits (
            *,
            tenant:tenants (
              id,
              full_name,
              email
            ),
            user:users (
              id,
              email
            )
          )
        `)
        .eq('property_id', propertyId)
        .order('date', { ascending: false });
      
      if (error) throw new Error(handleSupabaseError(error, 'getPropertyExpenses'));
      return data || [];
    } catch (error) {
      console.error('Error in getPropertyExpenses:', error);
      throw error;
    }
  },

  // Crear un gasto compartido
  async createExpense(propertyId, expenseData, splits, userId) {
    try {
      // Crear el gasto
      const { data: expense, error: expenseError } = await supabase
        .from('shared_expenses')
        .insert({
          property_id: propertyId,
          ...expenseData,
          created_by: userId
        })
        .select()
        .single();
      
      if (expenseError) throw new Error(handleSupabaseError(expenseError, 'createExpense'));

      // Crear los splits
      if (splits && splits.length > 0) {
        const splitsData = splits.map(split => ({
          expense_id: expense.id,
          tenant_id: split.tenant_id || null,
          user_id: split.user_id || null,
          amount: split.amount,
          paid: split.paid || false
        }));

        const { error: splitsError } = await supabase
          .from('expense_splits')
          .insert(splitsData);
        
        if (splitsError) throw new Error(handleSupabaseError(splitsError, 'createExpense - splits'));
      }

      return expense;
    } catch (error) {
      console.error('Error in createExpense:', error);
      throw error;
    }
  },

  // Actualizar un gasto compartido
  async updateExpense(expenseId, updates) {
    try {
      const { data, error } = await supabase
        .from('shared_expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'updateExpense'));
      return data;
    } catch (error) {
      console.error('Error in updateExpense:', error);
      throw error;
    }
  },

  // Marcar un split como pagado
  async markSplitAsPaid(splitId, paid = true) {
    try {
      const { data, error } = await supabase
        .from('expense_splits')
        .update({
          paid,
          paid_at: paid ? new Date().toISOString() : null
        })
        .eq('id', splitId)
        .select()
        .single();
      
      if (error) throw new Error(handleSupabaseError(error, 'markSplitAsPaid'));
      return data;
    } catch (error) {
      console.error('Error in markSplitAsPaid:', error);
      throw error;
    }
  },

  // Eliminar un gasto compartido
  async deleteExpense(expenseId) {
    try {
      const { error } = await supabase
        .from('shared_expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw new Error(handleSupabaseError(error, 'deleteExpense'));
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      throw error;
    }
  },

  // Calcular división automática (igual)
  calculateEqualSplit(amount, count) {
    const perPerson = amount / count;
    return Array(count).fill(parseFloat(perPerson.toFixed(2)));
  },

  // Calcular división por habitación
  calculateByRoomSplit(amount, rooms) {
    const totalRent = rooms.reduce((sum, room) => sum + parseFloat(room.monthly_rent || 0), 0);
    if (totalRent === 0) return this.calculateEqualSplit(amount, rooms.length);
    
    return rooms.map(room => {
      const rent = parseFloat(room.monthly_rent || 0);
      const percentage = rent / totalRent;
      return parseFloat((amount * percentage).toFixed(2));
    });
  }
};

