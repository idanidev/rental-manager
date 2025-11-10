import { supabase } from './supabase';

export const financesService = {
  // ============ GASTOS ============
  
  // Obtener gastos de una propiedad
  async getExpenses(propertyId, startDate = null, endDate = null) {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('property_id', propertyId);
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Crear un gasto
  async createExpense(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un gasto
  async updateExpense(expenseId, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un gasto
  async deleteExpense(expenseId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    
    if (error) throw error;
  },

  // Obtener gastos por categoría
  async getExpensesByCategory(propertyId, startDate, endDate) {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;

    // Agrupar por categoría
    const grouped = data.reduce((acc, expense) => {
      const category = expense.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, amount]) => ({
      category,
      amount
    }));
  },

  // ============ INGRESOS ============

  // Obtener ingresos de una propiedad
  async getIncome(propertyId, startDate = null, endDate = null) {
    let query = supabase
      .from('income')
      .select(`
        *,
        room:room_id (
          id,
          name
        )
      `)
      .eq('property_id', propertyId);
    
    if (startDate) query = query.gte('month', startDate);
    if (endDate) query = query.lte('month', endDate);
    
    const { data, error } = await query.order('month', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Crear un ingreso
  async createIncome(incomeData) {
    const { data, error } = await supabase
      .from('income')
      .insert(incomeData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un ingreso
  async updateIncome(incomeId, updates) {
    const { data, error } = await supabase
      .from('income')
      .update(updates)
      .eq('id', incomeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Marcar ingreso como pagado
  async markAsPaid(incomeId, paymentDate = new Date().toISOString()) {
    const { data, error } = await supabase
      .from('income')
      .update({ 
        paid: true, 
        payment_date: paymentDate 
      })
      .eq('id', incomeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un ingreso
  async deleteIncome(incomeId) {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', incomeId);
    
    if (error) throw error;
  },

  // ============ ESTADÍSTICAS ============

  // Obtener resumen financiero
  async getFinancialSummary(propertyId, year, month) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const [income, expenses] = await Promise.all([
      this.getIncome(propertyId, startDate, endDate),
      this.getExpenses(propertyId, startDate, endDate)
    ]);

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paidIncome = income.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
    const pendingIncome = totalIncome - paidIncome;

    return {
      totalIncome,
      paidIncome,
      pendingIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
    };
  }
};
