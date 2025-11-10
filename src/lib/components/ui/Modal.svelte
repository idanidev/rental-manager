<script>
  import { X } from 'lucide-svelte';
  import Button from './Button.svelte';
  
  export let open = false;
  export let title = '';
  export let size = 'md'; // sm, md, lg, xl
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  // Cerrar modal al presionar Escape
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function close() {
    open = false;
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      close();
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal -->
    <div class="glass-card {sizes[size]} w-full max-h-[95vh] sm:max-h-[90vh] my-auto flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 flex-shrink-0">
        <h2 class="text-xl sm:text-2xl font-bold gradient-text pr-2">{title}</h2>
        <button 
          on:click={close}
          class="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <slot />
      </div>
    </div>
  </div>
{/if}
