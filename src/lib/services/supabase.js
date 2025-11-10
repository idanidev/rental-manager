import { createClient } from '@supabase/supabase-js';

// TEMPORAL: Credenciales hardcodeadas hasta que funcionen las variables de entorno
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://mejrsjdrutzvfxtiximo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lanJzamRydXR6dmZ4dGl4aW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk2MzAsImV4cCI6MjA3ODE5NTYzMH0.s-wdU95MiXwg__M4xNmXEMBXqMPKJ2STDCWPxRqNr1Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'rental-manager'
    }
  }
});

// Helper para obtener el usuario actual con manejo de errores
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Helper para verificar si el usuario está autenticado
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Helper para suscribirse a cambios de autenticación
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return subscription;
}

// Helper para manejar errores de Supabase
export function handleSupabaseError(error, context = '') {
  if (!error) return null;
  
  console.error(`Supabase error in ${context}:`, error);
  
  // Errores comunes
  const errorMessages = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/weak-password': 'La contraseña es muy débil',
    'auth/invalid-email': 'Email inválido',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'PGRST116': 'No se encontró el registro',
    '23505': 'Este registro ya existe',
    '23503': 'No se puede eliminar. Hay dependencias',
  };
  
  // Buscar mensaje personalizado
  const code = error.code || error.message;
  for (const [key, value] of Object.entries(errorMessages)) {
    if (code?.includes(key)) {
      return value;
    }
  }
  
  return error.message || 'Ha ocurrido un error inesperado';
}
