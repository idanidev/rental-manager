import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTenants, mockTenant } from '../../mocks/data/tenants';

// Mock de Supabase usando factory function
vi.mock('$lib/services/supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn()
  };
  
  const mockHandleSupabaseError = vi.fn((error) => error?.message || 'Error');
  
  return {
    supabase: mockSupabase,
    handleSupabaseError: mockHandleSupabaseError
  };
});

import { tenantsService } from '$lib/services/tenants';
import { supabase as mockSupabase } from '$lib/services/supabase';

describe('Tenants Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPropertyTenants', () => {
    it('should fetch all tenants for a property', async () => {
      const propertyId = 'prop-1';

      // Crear query builder que soporte múltiples llamadas a order()
      let orderCallCount = 0;
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(() => {
          orderCallCount++;
          // La segunda llamada a order() debe resolver con los datos
          if (orderCallCount === 2) {
            return Promise.resolve({ data: mockTenants, error: null });
          }
          // Primera llamada retorna el builder para encadenar
          return mockQuery;
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await tenantsService.getPropertyTenants(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
      expect(result).toEqual(mockTenants);
    });
  });

  describe('getActiveTenants', () => {
    it('should fetch only active tenants', async () => {
      const propertyId = 'prop-1';
      const activeTenants = mockTenants.filter(t => t.active);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: activeTenants, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await tenantsService.getActiveTenants(propertyId);

      expect(result).toEqual(activeTenants);
    });
  });

  describe('createTenant', () => {
    it('should create tenant with valid data', async () => {
      const tenantData = {
        property_id: 'prop-1',
        full_name: 'Nuevo Inquilino',
        email: 'nuevo@example.com'
      };

      const createdTenant = { ...tenantData, id: 'tenant-new' };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdTenant, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await tenantsService.createTenant(tenantData);

      expect(result).toEqual(createdTenant);
    });

    it('should validate required fields', async () => {
      const invalidData = { email: 'test@example.com' };

      await expect(
        tenantsService.createTenant(invalidData)
      ).rejects.toThrow('Propiedad y nombre completo son obligatorios');
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const tenantId = 'tenant-1';
      const updates = { email: 'newemail@example.com' };
      const updatedTenant = { ...mockTenant, ...updates };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedTenant, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await tenantsService.updateTenant(tenantId, updates);

      expect(result).toEqual(updatedTenant);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      const tenantId = 'tenant-1';

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await tenantsService.deleteTenant(tenantId);

      expect(result).toBe(true);
    });
  });
});
