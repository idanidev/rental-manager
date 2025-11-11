import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, update } = writable([]);

  function remove(id) {
    update(toasts => toasts.filter(t => t.id !== id));
  }

  return {
    subscribe,
    update,
    success: (message, duration = 3000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type: 'success', duration }]);
      setTimeout(() => remove(id), duration);
    },
    error: (message, duration = 4000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type: 'error', duration }]);
      setTimeout(() => remove(id), duration);
    },
    info: (message, duration = 3000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type: 'info', duration }]);
      setTimeout(() => remove(id), duration);
    },
    warning: (message, duration = 3000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type: 'warning', duration }]);
      setTimeout(() => remove(id), duration);
    }
  };
}

export const toast = createToastStore();

// Helper function para usar en cualquier parte
export function showToast(message, type = 'info', duration) {
  switch(type) {
    case 'success':
      toast.success(message, duration);
      break;
    case 'error':
      toast.error(message, duration);
      break;
    case 'warning':
      toast.warning(message, duration);
      break;
    default:
      toast.info(message, duration);
  }
}

