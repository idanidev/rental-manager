<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    Calendar, AlertCircle, FileText, UserPlus, DollarSign, 
    TrendingUp, Home, X, Check, Clock
  } from 'lucide-svelte';
  import { notificationsStore } from '$lib/stores/notifications';
  export let notification;
  
  const dispatch = createEventDispatcher();
  
  // Función para formatear tiempo relativo
  function formatTimeAgo(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'hace un momento';
      if (diffMins < 60) return `hace ${diffMins} min`;
      if (diffHours < 24) return `hace ${diffHours} h`;
      if (diffDays < 7) return `hace ${diffDays} d`;
      if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'hace un momento';
    }
  }
  
  // Iconos y colores según tipo
  const typeConfig = {
    contract_expiring: {
      icon: Calendar,
      color: notification.metadata?.days_remaining <= 7 
        ? 'text-red-500' 
        : notification.metadata?.days_remaining <= 15 
          ? 'text-orange-500' 
          : 'text-blue-500',
      bgColor: notification.metadata?.days_remaining <= 7 
        ? 'bg-red-500/10' 
        : notification.metadata?.days_remaining <= 15 
          ? 'bg-orange-500/10' 
          : 'bg-blue-500/10'
    },
    contract_expired: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    weekly_report: {
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    invitation: {
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    expense: {
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    income: {
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    room_change: {
      icon: Home,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    }
  };
  
  $: config = typeConfig[notification.type] || {
    icon: Bell,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  };
  
  $: Icon = config.icon;
  
  // Formatear timestamp relativo
  $: timeAgo = formatTimeAgo(notification.created_at);
  
  async function handleMarkAsRead(e) {
    e.stopPropagation();
    if (!notification.read) {
      await notificationsStore.markAsRead(notification.id);
    }
  }
  
  async function handleDelete(e) {
    e.stopPropagation();
    if (confirm('¿Eliminar esta notificación?')) {
      await notificationsStore.delete(notification.id);
    }
  }
  
  function handleClick() {
    if (!notification.read) {
      notificationsStore.markAsRead(notification.id);
    }
    dispatch('click');
  }
</script>

<div
  on:click={handleClick}
  class="p-4 hover:bg-white/10 dark:hover:bg-gray-800/20 transition-colors cursor-pointer
    {notification.read ? 'opacity-60' : ''}"
  role="button"
  tabindex="0"
  on:keydown={(e) => { if (e.key === 'Enter') handleClick(); }}
>
  <div class="flex items-start gap-3">
    <!-- Icono -->
    <div class="flex-shrink-0 p-2 rounded-lg {config.bgColor}">
      <Icon size={18} class="{config.color}" />
    </div>
    
    <!-- Contenido -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2 mb-1">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
          {notification.title}
        </h4>
        {#if !notification.read}
          <span class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1"></span>
        {/if}
      </div>
      
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
        {notification.message}
      </p>
      
      <!-- Metadata adicional -->
      {#if notification.metadata && Object.keys(notification.metadata).length > 0}
        <div class="flex flex-wrap gap-2 mb-2">
          {#if notification.metadata.days_remaining !== undefined}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              {notification.metadata.days_remaining <= 7 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : notification.metadata.days_remaining <= 15
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}">
              <Clock size={10} />
              {notification.metadata.days_remaining === 0 
                ? 'Vence hoy'
                : notification.metadata.days_remaining === 1
                  ? 'Vence mañana'
                  : `${notification.metadata.days_remaining} días restantes`}
            </span>
          {/if}
          
          {#if notification.metadata.property_name}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Home size={10} />
              {notification.metadata.property_name}
            </span>
          {/if}
        </div>
      {/if}
      
      <!-- Footer con timestamp y acciones -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {timeAgo}
        </span>
        
        <div class="flex items-center gap-1">
          {#if !notification.read}
            <button
              on:click={handleMarkAsRead}
              class="p-1 hover:bg-white/20 rounded transition-colors"
              title="Marcar como leída"
            >
              <Check size={14} class="text-green-500" />
            </button>
          {/if}
          <button
            on:click={handleDelete}
            class="p-1 hover:bg-white/20 rounded transition-colors"
            title="Eliminar"
          >
            <X size={14} class="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

