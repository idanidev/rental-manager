import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { readable } from 'svelte/store';

// Mock de $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
  disableScrollHandling: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
}));

// Mock de $app/stores
vi.mock('$app/stores', () => {
  const getStores = () => ({
    page: {
      subscribe: vi.fn((fn) => {
        fn({
          url: new URL('http://localhost:5173/'),
          params: {},
          route: { id: '/' },
          status: 200,
          error: null,
          data: {},
          form: null
        });
        return () => {};
      })
    },
    navigating: readable(null),
    updated: {
      subscribe: vi.fn((fn) => {
        fn(false);
        return () => {};
      }),
      check: vi.fn()
    }
  });
  
  return {
    getStores,
    page: {
      subscribe: vi.fn((fn) => {
        fn({
          url: new URL('http://localhost:5173/'),
          params: {},
          route: { id: '/' },
          status: 200,
          error: null,
          data: {},
          form: null
        });
        return () => {};
      })
    },
    navigating: readable(null),
    updated: {
      subscribe: vi.fn((fn) => {
        fn(false);
        return () => {};
      }),
      check: vi.fn()
    }
  };
});

// Mock de $app/environment
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: '1.0.0'
}));

// Mock de $env/static/public
vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key'
}));

// Mock de Supabase Client (se puede sobreescribir en tests específicos)
global.mockSupabase = null;



