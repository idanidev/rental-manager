<script>
  import { onMount } from 'svelte';
  import { Bell } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { notificationsService } from '$lib/services/notifications';
  import { goto } from '$app/navigation';
  
  let notificationCount = 0;
  let urgentCount = 0;
  let loading = false;
  
  onMount(() => {
    loadNotifications();
    // Actualizar cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  });
  
  async function loadNotifications() {
    if (!$userStore || loading) return;
    
    loading = true;
    try {
      const notifications = await notificationsService.getAllNotifications($userStore.id);
      notificationCount = notifications.total;
      urgentCount = notifications.urgent;
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleClick() {
    goto('/notifications');
  }
</script>

<button
  on:click={handleClick}
  class="relative p-2.5 rounded-2xl hover:bg-white/60 transition-all duration-300 flex-shrink-0"
  title="Notificaciones"
  aria-label="Ver notificaciones"
>
  <Bell size={18} class="{urgentCount > 0 ? 'text-red-600' : 'text-gray-700'}" />
  
  {#if notificationCount > 0}
    <span 
      class="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold text-white rounded-full flex items-center justify-center
        {urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}"
    >
      {notificationCount > 9 ? '9+' : notificationCount}
    </span>
  {/if}
</button>

