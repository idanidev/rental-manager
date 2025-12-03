import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockRooms, mockRoom } from '../../mocks/data/rooms';

// Mock de Supabase usando factory function
vi.mock('$lib/services/supabase', () => {
  const mockSupabase = {
    from: vi.fn()
  };
  
  return {
    supabase: mockSupabase
  };
});

import { roomsService } from '$lib/services/rooms';
import { supabase as mockSupabase } from '$lib/services/supabase';

describe('Rooms Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPropertyRooms', () => {
    it('should fetch all rooms for a property', async () => {
      const propertyId = 'prop-1';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRooms, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await roomsService.getPropertyRooms(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('rooms');
      expect(mockQuery.eq).toHaveBeenCalledWith('property_id', propertyId);
      expect(result).toEqual(mockRooms);
    });
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const roomData = {
        property_id: 'prop-1',
        name: 'Habitación Nueva',
        room_type: 'private',
        monthly_rent: 500
      };

      const createdRoom = { ...roomData, id: 'room-new' };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRoom, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await roomsService.createRoom(roomData);

      expect(result).toEqual(createdRoom);
      expect(mockQuery.insert).toHaveBeenCalledWith(roomData);
    });
  });

  describe('updateRoom', () => {
    it('should update a room successfully', async () => {
      const roomId = 'room-1';
      const updates = { monthly_rent: 550 };
      const updatedRoom = { ...mockRoom, ...updates };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRoom, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await roomsService.updateRoom(roomId, updates);

      expect(result).toEqual(updatedRoom);
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', roomId);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room successfully', async () => {
      const roomId = 'room-1';

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(roomsService.deleteRoom(roomId)).resolves.not.toThrow();
    });
  });

  describe('toggleOccupancy', () => {
    it('should mark room as occupied', async () => {
      const roomId = 'room-1';
      const updatedRoom = { ...mockRoom, occupied: true, tenant_name: 'Juan Pérez' };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRoom, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await roomsService.toggleOccupancy(roomId, true, 'Juan Pérez');

      expect(result.occupied).toBe(true);
      expect(result.tenant_name).toBe('Juan Pérez');
    });

    it('should mark room as available', async () => {
      const roomId = 'room-2';
      const updatedRoom = { ...mockRoom, occupied: false, tenant_name: null };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRoom, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await roomsService.toggleOccupancy(roomId, false);

      expect(result.occupied).toBe(false);
      expect(result.tenant_name).toBeNull();
    });
  });
});

