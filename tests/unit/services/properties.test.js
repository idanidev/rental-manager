import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockProperties, mockProperty } from '../../mocks/data/properties';

// Mock de Supabase usando factory function
vi.mock('$lib/services/supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  };
  
  const mockHandleSupabaseError = vi.fn((error) => error?.message || 'Error');
  
  return {
    supabase: mockSupabase,
    handleSupabaseError: mockHandleSupabaseError
  };
});

import { propertiesService } from '$lib/services/properties';
import { supabase as mockSupabase } from '$lib/services/supabase';

describe('Properties Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProperties', () => {
    it('should fetch all properties for user', async () => {
      const userId = 'user-123';
      const mockAccessData = [
        { property_id: 'prop-1', role: 'owner' },
        { property_id: 'prop-2', role: 'editor' }
      ];

      // Mock property_access query
      const mockAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockAccessData, error: null })
      };

      // Mock properties query
      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProperties, error: null })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockAccessQuery)  // First call: property_access
        .mockReturnValueOnce(mockPropertiesQuery); // Second call: properties

      const result = await propertiesService.getUserProperties(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('property_access');
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(result).toEqual(mockProperties);
    });

    it('should return empty array if user has no properties', async () => {
      const userId = 'user-123';
      const mockAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabase.from.mockReturnValue(mockAccessQuery);

      const result = await propertiesService.getUserProperties(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getProperty', () => {
    it('should fetch a single property with rooms', async () => {
      const propertyId = 'prop-1';
      const mockAccessData = [{ user_id: 'user-1', role: 'owner' }];

      const mockPropertyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProperty, error: null })
      };

      const mockAccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockAccessData, error: null })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockPropertyQuery)
        .mockReturnValueOnce(mockAccessQuery);

      const result = await propertiesService.getProperty(propertyId);

      expect(result).toEqual({ ...mockProperty, property_access: mockAccessData });
    });
  });

  describe('createProperty', () => {
    it('should create property with valid data', async () => {
      const userId = 'user-123';
      const newPropertyData = {
        name: 'Nueva Propiedad',
        address: 'Calle Nueva 123',
        description: 'Descripción'
      };

      const createdProperty = { ...newPropertyData, id: 'prop-new', owner_id: userId };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdProperty, error: null })
      };

      const mockAccessInsert = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockInsertQuery)  // properties insert
        .mockReturnValueOnce(mockAccessInsert); // property_access insert

      const result = await propertiesService.createProperty(newPropertyData, userId);

      expect(result).toEqual(createdProperty);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        ...newPropertyData,
        owner_id: userId
      });
    });

    it('should validate required fields', async () => {
      const invalidData = { address: 'Solo dirección' };

      await expect(
        propertiesService.createProperty(invalidData, 'user-123')
      ).rejects.toThrow('Nombre y dirección son requeridos');
    });
  });

  describe('updateProperty', () => {
    it('should update property successfully', async () => {
      const propertyId = 'prop-1';
      const updates = { name: 'Nombre Actualizado' };
      const updatedProperty = { ...mockProperty, ...updates };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedProperty, error: null })
      };

      mockSupabase.from.mockReturnValue(mockUpdateQuery);

      const result = await propertiesService.updateProperty(propertyId, updates);

      expect(result).toEqual(updatedProperty);
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(updates);
    });
  });

  describe('deleteProperty', () => {
    it('should delete property successfully', async () => {
      const propertyId = 'prop-1';

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      await expect(
        propertiesService.deleteProperty(propertyId)
      ).resolves.not.toThrow();
    });
  });
});

