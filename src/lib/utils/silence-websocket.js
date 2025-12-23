// Utilidad para silenciar errores de WebSocket de Supabase Realtime
// Este archivo se debe importar ANTES de cualquier importación de Supabase

if (typeof window !== 'undefined') {
  // Interceptar ANTES de que Supabase se cargue
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const checkWebSocket = (args) => {
    const allText = args.map(a => {
      if (typeof a === 'string') return a;
      if (a?.message) return a.message;
      if (a?.toString) return a.toString();
      return String(a);
    }).join(' ').toLowerCase();
    
    return allText.includes('websocket') || 
           allText.includes('wss://') ||
           allText.includes('realtime') ||
           (allText.includes('connection') && allText.includes('failed'));
  };
  
  console.error = function(...args) {
    if (checkWebSocket(args)) return;
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    if (checkWebSocket(args)) return;
    originalWarn.apply(console, args);
  };
  
  // Interceptar errores globales
  window.addEventListener('error', (e) => {
    if (e.message && checkWebSocket([e.message])) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || e.reason?.toString() || '';
    if (checkWebSocket([msg])) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}








