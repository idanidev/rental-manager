// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validar email
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email es requerido' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email no válido' };
  }
  
  return { valid: true };
}

/**
 * Validar contraseña
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Contraseña es requerida' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  return { valid: true };
}

/**
 * Validar texto requerido
 */
export function validateRequired(value, fieldName = 'Este campo') {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} es requerido` };
  }
  
  return { valid: true };
}

/**
 * Validar número
 */
export function validateNumber(value, fieldName = 'Este campo', options = {}) {
  const { min, max, required = true } = options;
  
  if (required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: `${fieldName} es requerido` };
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} debe ser un número` };
  }
  
  if (min !== undefined && numValue < min) {
    return { valid: false, error: `${fieldName} debe ser mayor o igual a ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { valid: false, error: `${fieldName} debe ser menor o igual a ${max}` };
  }
  
  return { valid: true };
}

/**
 * Validar fecha
 */
export function validateDate(value, fieldName = 'Fecha', options = {}) {
  const { required = true, minDate, maxDate } = options;
  
  if (required && !value) {
    return { valid: false, error: `${fieldName} es requerida` };
  }
  
  if (!value) {
    return { valid: true };
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} no es válida` };
  }
  
  if (minDate && date < new Date(minDate)) {
    return { valid: false, error: `${fieldName} debe ser posterior a ${new Date(minDate).toLocaleDateString()}` };
  }
  
  if (maxDate && date > new Date(maxDate)) {
    return { valid: false, error: `${fieldName} debe ser anterior a ${new Date(maxDate).toLocaleDateString()}` };
  }
  
  return { valid: true };
}

/**
 * Validar longitud de texto
 */
export function validateLength(value, fieldName = 'Este campo', options = {}) {
  const { min, max, required = true } = options;
  
  if (required && (!value || value.trim() === '')) {
    return { valid: false, error: `${fieldName} es requerido` };
  }
  
  if (!value) {
    return { valid: true };
  }
  
  const length = value.length;
  
  if (min !== undefined && length < min) {
    return { valid: false, error: `${fieldName} debe tener al menos ${min} caracteres` };
  }
  
  if (max !== undefined && length > max) {
    return { valid: false, error: `${fieldName} debe tener máximo ${max} caracteres` };
  }
  
  return { valid: true };
}

/**
 * Validar formulario completo
 * @param {Object} data - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateForm(data, rules) {
  const errors = {};
  let valid = true;
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.valid) {
        errors[field] = result.error;
        valid = false;
        break;
      }
    }
  }
  
  return { valid, errors };
}

/**
 * Sanitizar entrada de texto
 */
export function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Eliminar espacios al inicio y final
  let sanitized = value.trim();
  
  // Eliminar caracteres peligrosos
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized;
}

/**
 * Formatear número como moneda
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) {
    return '0.00€';
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return '0.00€';
  }
  
  return `${num.toFixed(2)}€`;
}

/**
 * Formatear fecha
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '-';
  
  const { locale = 'es-ES', ...formatOptions } = options;
  const defaultOptions = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    ...formatOptions
  };
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return '-';
  }
  
  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * Validar renta mensual
 */
export function validateMonthlyRent(value) {
  return validateNumber(value, 'Renta mensual', { min: 0, max: 10000 });
}

/**
 * Validar tamaño de habitación
 */
export function validateRoomSize(value) {
  return validateNumber(value, 'Tamaño', { min: 0, max: 1000, required: false });
}

/**
 * Validar monto de gasto/ingreso
 */
export function validateAmount(value) {
  return validateNumber(value, 'Monto', { min: 0, max: 999999 });
}

