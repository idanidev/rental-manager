import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock de Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  }
};

const mockOnAuthStateChange = vi.fn(() => ({
  unsubscribe: vi.fn()
}));

vi.mock('$lib/services/supabase', () => ({
  supabase: mockSupabase,
  onAuthStateChange: mockOnAuthStateChange
}));

// Importar el store después del mock
import { userStore } from '$lib/stores/user';

describe('User Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize store with user if authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await userStore.init();

      const currentUser = get(userStore);
      expect(currentUser).toEqual(mockUser);
    });

    it('should set store to null if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      await userStore.init();

      const currentUser = get(userStore);
      expect(currentUser).toBeNull();
    });
  });

  describe('set', () => {
    it('should set user in store', () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      userStore.set(mockUser);

      const currentUser = get(userStore);
      expect(currentUser).toEqual(mockUser);
    });
  });

  describe('clear', () => {
    it('should clear user from store', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      userStore.set(mockUser);

      userStore.clear();

      const currentUser = get(userStore);
      expect(currentUser).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should refresh user from auth', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await userStore.refresh();

      const currentUser = get(userStore);
      expect(currentUser).toEqual(mockUser);
    });
  });
});




