import { vi } from 'vitest';

/**
 * Crea un mock completo de Supabase client
 * Puede ser usado en tests individuales o configurado globalmente
 */
export const createMockSupabase = () => {
  const mockFrom = vi.fn((table) => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    
    return queryBuilder;
  });

  return {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { 
          subscription: { 
            unsubscribe: vi.fn() 
          } 
        }
      })),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: mockFrom,
    storage: {
      from: vi.fn((bucket) => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn((path) => ({
          data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucket}/${path}` }
        })),
      }))
    },
    rpc: vi.fn(),
  };
};

/**
 * Mock global de Supabase
 */
export const mockSupabase = createMockSupabase();

