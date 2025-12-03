<script>
  import { onMount } from 'svelte';
  import { Bell, Settings, Filter, Check, X } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { notificationsStore, unreadCount } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import NotificationItem from '$lib/components/notifications/NotificationItem.svelte';
  import { showToast } from '$lib/stores/toast';
  
  let loading = true;
  let activeFilter = 'all'; // 'all' | 'unread' | 'contract_expiring' | 'weekly_report' | 'invitation'
  
  onMount(async () => {
    if ($userStore?.id) {
      await notificationsStore.load();
    }
    loading = false;
  });
  
  async function markAllAsRead() {
    if ($unreadCount === 0) return;
    
    try {
      await notificationsStore.markAllAsRead();
      showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      showToast('Error al marcar como leídas', 'error');
    }
  }
  
  function handleNotificationClick(notification) {
    if (notification.property_id) {
      goto(`/properties/${notification.property_id}`);
    }
  }
  
  $: filteredNotifications = (() => {
    let filtered = $notificationsStore;
    
    if (activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === activeFilter);
    }
    
    return filtered;
  })();
  
  $: hasNotifications = filteredNotifications.length > 0;
</script>

<svelte:head>
  <title>Notificaciones - Rental Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in px-4">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
        <Bell size={32} />
        Notificaciones
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {#if $unreadCount > 0}
          Tienes {$unreadCount} notificación{$unreadCount === 1 ? '' : 'es'} no {$unreadCount === 1 ? 'leída' : 'leídas'}
        {:else}
          Todas las notificaciones están leídas
        {/if}
      </p>
    </div>
    
    <div class="flex gap-2">
      {#if $unreadCount > 0}
        <Button
          variant="secondary"
          on:click={markAllAsRead}
          className="text-sm"
        >
          <Check size={18} class="inline mr-1.5" />
          Marcar todas como leídas
        </Button>
      {/if}
      <Button
        variant="secondary"
        on:click={() => goto('/notifications/settings')}
        className="text-sm"
      >
        <Settings size={18} class="inline mr-1.5" />
        Configuración
      </Button>
    </div>
  </div>
  
  <!-- Filtros -->
  <div class="flex flex-wrap gap-2">
    <button
      on:click={() => activeFilter = 'all'}
      class="px-4 py-2 rounded-xl font-semibold text-sm transition-all min-h-[44px]
        {activeFilter === 'all'
          ? 'gradient-primary text-white shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70'}"
    >
      Todas ({$notificationsStore.length})
    </button>
    <button
      on:click={() => activeFilter = 'unread'}
      class="px-4 py-2 rounded-xl font-semibold text-sm transition-all min-h-[44px]
        {activeFilter === 'unread'
          ? 'gradient-primary text-white shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70'}"
    >
      No leídas ({$unreadCount})
    </button>
    <button
      on:click={() => activeFilter = 'contract_expiring'}
      class="px-4 py-2 rounded-xl font-semibold text-sm transition-all min-h-[44px]
        {activeFilter === 'contract_expiring'
          ? 'gradient-primary text-white shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70'}"
    >
      Contratos ({$notificationsStore.filter(n => n.type === 'contract_expiring' || n.type === 'contract_expired').length})
    </button>
    <button
      on:click={() => activeFilter = 'weekly_report'}
      class="px-4 py-2 rounded-xl font-semibold text-sm transition-all min-h-[44px]
        {activeFilter === 'weekly_report'
          ? 'gradient-primary text-white shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70'}"
    >
      Resúmenes ({$notificationsStore.filter(n => n.type === 'weekly_report').length})
    </button>
    <button
      on:click={() => activeFilter = 'invitation'}
      class="px-4 py-2 rounded-xl font-semibold text-sm transition-all min-h-[44px]
        {activeFilter === 'invitation'
          ? 'gradient-primary text-white shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70'}"
    >
      Invitaciones ({$notificationsStore.filter(n => n.type === 'invitation').length})
    </button>
  </div>
  
  <!-- Lista de Notificaciones -->
  {#if loading}
    <GlassCard>
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    </GlassCard>
  {:else if hasNotifications}
    <div class="space-y-3">
      {#each filteredNotifications as notification (notification.id)}
        <GlassCard>
          <NotificationItem 
            {notification}
            on:click={() => handleNotificationClick(notification)}
          />
        </GlassCard>
      {/each}
    </div>
  {:else}
    <GlassCard>
      <div class="text-center py-16">
        <Bell size={64} class="text-gray-400 mx-auto mb-4 opacity-50" />
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No hay notificaciones
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {activeFilter === 'unread' 
            ? 'No tienes notificaciones no leídas'
            : `No hay notificaciones de tipo "${activeFilter}"`}
        </p>
        <Button
          variant="secondary"
          on:click={() => goto('/notifications/settings')}
        >
          <Settings size={18} class="inline mr-2" />
          Configurar Notificaciones
        </Button>
      </div>
    </GlassCard>
  {/if}
</div>
