import { vi } from 'vitest';

/**
 * Helper para crear query builders mockeados de Supabase
 * Soporta cadenas de métodos como .select().eq().order().order()
 */
export function createMockQueryBuilder(finalResult) {
  let callChain = [];
  
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn()
  };

  // Si se proporciona un resultado final, hacer que la última llamada lo resuelva
  if (finalResult) {
    // Detectar la última llamada de la cadena y resolver con el resultado
    const originalOrder = builder.order;
    let orderCallCount = 0;
    builder.order = vi.fn((...args) => {
      orderCallCount++;
      callChain.push(['order', args]);
      // Si es la segunda llamada a order(), resolver
      if (orderCallCount === 2 && finalResult.then) {
        return Promise.resolve(finalResult);
      }
      return builder;
    });
    
    const originalSingle = builder.single;
    builder.single = vi.fn(() => {
      if (finalResult.then) {
        return Promise.resolve(finalResult);
      }
      return finalResult;
    });
  }

  return builder;
}

/**
 * Crea un mock de respuesta de Supabase
 */
export function createSupabaseResponse(data, error = null) {
  return { data, error };
}

