// =====================================================
// DEBOUNCE Y THROTTLE UTILITIES
// =====================================================

/**
 * Debounce - Retrasa la ejecución de una función
 * hasta que pasen X milisegundos sin llamarla
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle - Limita la ejecución de una función
 * a una vez cada X milisegundos
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Async debounce - Para funciones asíncronas
 */
export function asyncDebounce(func, wait = 300) {
  let timeout;
  let pending = null;
  
  return async function executedFunction(...args) {
    return new Promise((resolve, reject) => {
      const later = async () => {
        clearTimeout(timeout);
        timeout = null;
        
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        
        pending = null;
      };
      
      if (pending) {
        pending.reject(new Error('Cancelled by new call'));
      }
      
      pending = { resolve, reject };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    });
  };
}

