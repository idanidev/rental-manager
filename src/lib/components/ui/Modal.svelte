<script>
  import { X } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  
  export let open = false;
  export let title = '';
  export let size = 'md'; // sm, md, lg, xl
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  let modalElement;
  
  // Action para mover el elemento al body
  function portal(node) {
    const originalParent = node.parentElement;
    document.body.appendChild(node);
    
    return {
      destroy() {
        if (node.parentNode === document.body) {
          document.body.removeChild(node);
        }
      }
    };
  }
  
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
    use:portal
    class="modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal -->
    <div class="modal-content glass-card {sizes[size]}" on:click={(e) => e.stopPropagation()}>
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

<style>
  :global(.modal-backdrop) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    z-index: 99999 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    animation: fadeInBackdrop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
  }
  
  :global(.modal-content) {
    width: 100%;
    max-height: 95vh;
    margin: auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    z-index: 100000 !important;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @media (min-width: 640px) {
    :global(.modal-backdrop) {
      padding: 1rem;
    }
    :global(.modal-content) {
      max-height: 90vh;
    }
  }
  
  @keyframes fadeInBackdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
