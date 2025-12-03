<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import { Bell, Check, X, Settings, Eye, Zap } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { notificationsStore, unreadCount } from '$lib/stores/notifications';
  import NotificationItem from './NotificationItem.svelte';
  import { showToast } from '$lib/stores/toast';
  import { requestNotificationPermission, hasNotificationPermission, getNotificationPermission, showBrowserNotification } from '$lib/services/browserNotifications';
  import { notificationsService } from '$lib/services/notifications';
  import { userStore } from '$lib/stores/user';
  
  const dispatch = createEventDispatcher();
  
  export let open = false;
  
  let activeTab = 'all'; // 'all' | 'unread'
  let loading = false;
  let browserPermission = 'default';
  let requestingPermission = false;
  let testingNotification = false;
  
  // Bloquear scroll del body cuando el panel está abierto en móvil
  $: if (browser && open) {
    if (window.innerWidth < 640) {
      // Móvil: bloquear scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
  } else if (browser) {
    // Restaurar scroll
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }
  
  onMount(() => {
    if (browser) {
      browserPermission = getNotificationPermission();
      notificationsStore.load();
    }
  });
  
  onDestroy(() => {
    // Asegurar que se restaure el scroll al destruir el componente
    if (browser) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    }
  });
  
  async function requestBrowserPermission() {
    if (!browser) return;
    
    requestingPermission = true;
    try {
      const permission = await requestNotificationPermission();
      browserPermission = permission;
      
      if (permission === 'granted') {
        showToast('Permisos de notificación activados', 'success');
      } else if (permission === 'denied') {
        showToast('Permisos de notificación denegados. Puedes activarlos en la configuración del navegador.', 'warning');
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      showToast('Error al solicitar permisos', 'error');
    } finally {
      requestingPermission = false;
    }
  }
  
  async function createTestNotification() {
    if (!$userStore?.id) return;
    
    testingNotification = true;
    try {
      // Crear notificación en la base de datos
      await notificationsService.createTestNotification($userStore.id);
      
      // Recargar notificaciones
      await notificationsStore.load();
      
      // Si tiene permisos, mostrar también notificación del navegador
      if (hasNotificationPermission()) {
        showBrowserNotification('🔔 Notificación de Prueba', {
          body: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
          tag: 'test-notification',
          icon: '/favicon.png'
        });
      }
      
      showToast('Notificación de prueba creada', 'success');
      
      // Cambiar a la pestaña "Todas" para ver la nueva notificación
      activeTab = 'all';
    } catch (error) {
      console.error('Error creating test notification:', error);
      showToast('Error al crear notificación de prueba: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      testingNotification = false;
    }
  }
  
  async function markAllAsRead() {
    if ($unreadCount === 0) return;
    
    loading = true;
    try {
      await notificationsStore.markAllAsRead();
      showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      showToast('Error al marcar como leídas', 'error');
    } finally {
      loading = false;
    }
  }
  
  function goToSettings() {
    dispatch('close');
    goto('/notifications/settings');
  }
  
  function goToHistory() {
    dispatch('close');
    goto('/notifications');
  }
  
  $: filteredNotifications = activeTab === 'unread'
    ? $notificationsStore.filter(n => !n.read)
    : $notificationsStore;
  
  $: hasNotifications = filteredNotifications.length > 0;
</script>

{#if open}
  <!-- Overlay para móvil (fullscreen) -->
  <div 
    class="fixed inset-0 bg-black/60 dark:bg-black/80 z-[9999] sm:hidden"
    on:click={() => dispatch('close')}
    role="button"
    aria-label="Cerrar panel"
    transition:fade={{ duration: 200 }}
  ></div>
  
  <!-- Panel de Notificaciones -->
  <div 
    class="fixed sm:absolute inset-0 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 
           w-full sm:w-96 sm:max-w-[calc(100vw-2rem)] 
           h-full sm:h-auto sm:max-h-[600px] 
           bg-white dark:bg-gray-900 sm:glass-card 
           shadow-2xl border-0 sm:border sm:border-white/20 
           rounded-none sm:rounded-2xl 
           overflow-hidden z-[10000] 
           flex flex-col
           animate-fade-in sm:animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-label="Panel de notificaciones"
    transition:fade={{ duration: 200 }}
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-2">
        <Bell size={20} class="text-purple-500 dark:text-purple-400" />
        <h3 class="font-bold text-gray-900 dark:text-gray-100 text-lg">Notificaciones</h3>
        {#if $unreadCount > 0}
          <span class="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
            {$unreadCount}
          </span>
        {/if}
      </div>
      <button
        on:click={() => dispatch('close')}
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Cerrar"
      >
        <X size={20} class="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
    
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <button
        on:click={() => activeTab = 'all'}
        class="flex-1 px-4 py-3 text-sm font-semibold transition-colors min-h-[44px]
          {activeTab === 'all'
            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
      >
        Todas
      </button>
      <button
        on:click={() => activeTab = 'unread'}
        class="flex-1 px-4 py-3 text-sm font-semibold transition-colors relative min-h-[44px]
          {activeTab === 'unread'
            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
      >
        No leídas
        {#if $unreadCount > 0 && activeTab !== 'unread'}
          <span class="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
        {/if}
      </button>
    </div>
    
    <!-- Actions Bar -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
      {#if hasNotifications && $unreadCount > 0}
        <button
          on:click={markAllAsRead}
          disabled={loading || $unreadCount === 0}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Check size={16} />
          <span class="hidden sm:inline">Marcar todas como leídas</span>
          <span class="sm:hidden">Marcar todas</span>
        </button>
      {:else}
        <div></div>
      {/if}
      
      <div class="flex gap-2">
        <button
          on:click={goToSettings}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
          title="Configuración"
        >
          <Settings size={16} />
          <span class="hidden sm:inline">Configuración</span>
        </button>
        <button
          on:click={goToHistory}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
          title="Ver historial"
        >
          <Eye size={16} />
          <span class="hidden sm:inline">Historial</span>
        </button>
      </div>
    </div>
    
    <!-- Notifications List -->
    <div class="flex-1 overflow-y-auto min-h-0">
      {#if loading && filteredNotifications.length === 0}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-2"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      {:else if hasNotifications}
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredNotifications as notification (notification.id)}
            <NotificationItem 
              {notification}
              on:click={() => {
                if (notification.property_id) {
                  goto(`/properties/${notification.property_id}`);
                  dispatch('close');
                }
              }}
            />
          {/each}
        </div>
      {:else}
        <div class="p-8 text-center">
          <Bell size={48} class="text-gray-400 mx-auto mb-3 opacity-50" />
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === 'unread' ? 'No hay notificaciones no leídas' : 'No hay notificaciones'}
          </p>
          
          <!-- Botones de acción -->
          <div class="flex flex-col gap-2">
            <button
              on:click={createTestNotification}
              disabled={testingNotification}
              class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2 shadow-lg"
            >
              {#if testingNotification}
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creando...</span>
              {:else}
                <Zap size={16} />
                <span>Crear Notificación de Prueba</span>
              {/if}
            </button>
            
            <!-- Botón para solicitar permisos del navegador -->
            {#if browser && browserPermission !== 'granted'}
              <button
                on:click={requestBrowserPermission}
                disabled={requestingPermission}
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {#if requestingPermission}
                  <span class="flex items-center justify-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Solicitando permisos...
                  </span>
                {:else if browserPermission === 'denied'}
                  <span>Permisos denegados (activa en configuración del navegador)</span>
                {:else}
                  <span>Activar notificaciones del navegador</span>
                {/if}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Footer - Siempre visible -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 flex-shrink-0">
      <button
        on:click={goToSettings}
        class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
      >
        <Settings size={16} />
        <span>Configuración</span>
      </button>
      {#if hasNotifications}
        <button
          on:click={goToHistory}
          class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
        >
          <Eye size={16} />
          <span>Ver todo</span>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(.glass-card) {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
</style>
