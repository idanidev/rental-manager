<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { Bell, X } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { notificationsStore, unreadCount, urgentCount } from '$lib/stores/notifications';
  import NotificationPanel from './NotificationPanel.svelte';
  
  let panelOpen = false;
  let panelElement;
  let notificationsInitialized = false;
  
  // Inicializar notificaciones cuando el usuario esté disponible (solo en cliente)
  $: if (browser && $userStore?.id && !notificationsInitialized) {
    notificationsInitialized = true;
    notificationsStore.init($userStore.id).catch(err => {
      console.warn('Error initializing notifications:', err);
    });
  }
  
  function togglePanel() {
    panelOpen = !panelOpen;
  }
  
  function closePanel() {
    panelOpen = false;
  }
  
  // Cerrar panel al hacer click fuera (solo en desktop)
  function handleClickOutside(event) {
    if (!browser) return;
    
    // En móvil, el overlay ya maneja el cierre
    if (window.innerWidth < 640) return;
    
    if (panelElement && !panelElement.contains(event.target)) {
      closePanel();
    }
  }
  
  let cleanupClickListener = null;
  
  $: if (browser && panelOpen && window.innerWidth >= 640) {
    // Solo agregar listener en desktop (en móvil el overlay maneja el cierre)
    // Limpiar listener anterior si existe
    if (cleanupClickListener) {
      cleanupClickListener();
      cleanupClickListener = null;
    }
    
    // Agregar nuevo listener
    window.addEventListener('click', handleClickOutside);
    cleanupClickListener = () => {
      window.removeEventListener('click', handleClickOutside);
    };
  } else if (cleanupClickListener) {
    cleanupClickListener();
    cleanupClickListener = null;
  }
  
  onDestroy(() => {
    if (browser) {
      notificationsStore.clear();
    }
    if (cleanupClickListener) {
      cleanupClickListener();
    }
  });
</script>

<div class="relative" bind:this={panelElement}>
  <button
    on:click={togglePanel}
    class="relative p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
    title="Notificaciones"
    aria-label="Ver notificaciones"
    aria-expanded={panelOpen}
  >
    <Bell 
      size={18} 
      class="transition-colors {$urgentCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}" 
    />
    
    {#if $unreadCount > 0}
      <span 
        class="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold text-white rounded-full flex items-center justify-center shadow-lg
          {$urgentCount > 0 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-orange-500 dark:bg-orange-600'}"
      >
        {$unreadCount > 9 ? '9+' : $unreadCount}
      </span>
    {/if}
  </button>
  
  <NotificationPanel bind:open={panelOpen} on:close={closePanel} />
</div>
