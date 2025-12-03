import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../../mocks/supabase';

// Crear mock de Supabase
const mockSupabase = createMockSupabase();

// Mock del módulo de Supabase
vi.mock('$lib/services/supabase', () => ({
  supabase: mockSupabase
}));

// Importar el servicio DESPUÉS del mock
import { authService } from '$lib/services/auth';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { 
          user: mockUser,
          session: { access_token: 'token', user: mockUser }
        },
        error: null
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.user).toEqual(mockUser);
    });

    it('should handle invalid credentials error', async () => {
      const mockError = { message: 'Invalid login credentials' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await expect(
        authService.signIn('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('should handle unconfirmed email error', async () => {
      const mockError = { message: 'Email not confirmed' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await expect(
        authService.signIn('unconfirmed@example.com', 'password')
      ).rejects.toThrow('Por favor confirma tu email antes de iniciar sesión');
    });

    it('should propagate other errors', async () => {
      const mockError = { message: 'Network error' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await expect(
        authService.signIn('test@example.com', 'password')
      ).rejects.toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle logout errors', async () => {
      const mockError = { message: 'Logout failed' };
      
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      await expect(authService.signOut()).rejects.toEqual(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if exists', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com' 
      };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const user = await authService.getCurrentUser();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });

    it('should handle errors when getting user', async () => {
      const mockError = { message: 'Not authenticated' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      await expect(authService.getCurrentUser()).rejects.toEqual(mockError);
    });
  });
});
