import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Supabase usando factory function
vi.mock('$lib/services/supabase', () => {
  const mockSupabase = {
    from: vi.fn()
  };
  
  return {
    supabase: mockSupabase
  };
});

import { financesService } from '$lib/services/finances';
import { supabase as mockSupabase } from '$lib/services/supabase';

describe('Finances Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExpenses', () => {
    it('should fetch expenses for a property', async () => {
      const propertyId = 'prop-1';
      const mockExpenses = [
        { id: 'exp-1', property_id: propertyId, amount: 100, category: 'Mantenimiento' },
        { id: 'exp-2', property_id: propertyId, amount: 50, category: 'Limpieza' }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockExpenses, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await financesService.getExpenses(propertyId);

      expect(result).toEqual(mockExpenses);
    });

    it('should filter expenses by date range', async () => {
      const propertyId = 'prop-1';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await financesService.getExpenses(propertyId, startDate, endDate);

      expect(mockQuery.gte).toHaveBeenCalledWith('date', startDate);
      expect(mockQuery.lte).toHaveBeenCalledWith('date', endDate);
    });
  });

  describe('createExpense', () => {
    it('should create expense successfully', async () => {
      const expenseData = {
        property_id: 'prop-1',
        amount: 100,
        category: 'Mantenimiento',
        date: '2024-01-15'
      };

      const createdExpense = { ...expenseData, id: 'exp-new' };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdExpense, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await financesService.createExpense(expenseData);

      expect(result).toEqual(createdExpense);
    });
  });

  describe('getIncome', () => {
    it('should fetch income for a property', async () => {
      const propertyId = 'prop-1';
      const mockIncome = [
        { id: 'inc-1', property_id: propertyId, amount: 500, paid: true },
        { id: 'inc-2', property_id: propertyId, amount: 550, paid: false }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockIncome, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await financesService.getIncome(propertyId);

      expect(result).toEqual(mockIncome);
    });
  });

  describe('markAsPaid', () => {
    it('should mark income as paid', async () => {
      const incomeId = 'inc-1';
      const paymentDate = '2024-01-15';
      const updatedIncome = {
        id: incomeId,
        paid: true,
        payment_date: paymentDate
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedIncome, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await financesService.markAsPaid(incomeId, paymentDate);

      expect(result.paid).toBe(true);
      expect(result.payment_date).toBe(paymentDate);
    });
  });
});

