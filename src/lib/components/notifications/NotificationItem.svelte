<script>
  import { createEventDispatcher } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { 
    Calendar, AlertCircle, FileText, UserPlus, DollarSign, 
    TrendingUp, Home, X, Check, Clock, Bell, Trash2
  } from 'lucide-svelte';
  import { notificationsStore } from '$lib/stores/notifications';
  export let notification;
  
  const dispatch = createEventDispatcher();
  
  let containerElement;
  let isSwiping = false;
  let startX = 0;
  let currentX = 0;
  let translateX = 0;
  let deleteThreshold = 80; // Píxeles necesarios para activar eliminación
  let isDeleting = false;
  
  // Variables para gestos táctiles
  let touchStartX = 0;
  let touchStartY = 0;
  
  function handleTouchStart(e) {
    if (isDeleting) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    startX = touch.clientX;
    isSwiping = false;
  }
  
  function handleTouchMove(e) {
    if (isDeleting) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Solo permitir swipe horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true;
      e.preventDefault();
      currentX = touch.clientX;
      translateX = Math.min(0, currentX - startX);
      updateTransform();
    }
  }
  
  function handleTouchEnd(e) {
    if (isDeleting) return;
    
    if (isSwiping) {
      // Si se deslizó más del threshold, eliminar
      if (Math.abs(translateX) >= deleteThreshold) {
        handleDelete();
      } else {
        // Si no, volver a la posición original
        resetPosition();
      }
    }
    
    isSwiping = false;
  }
  
  // Soporte para mouse (desktop) - solo activar cuando se arrastra hacia la izquierda
  let mouseDownX = 0;
  let isMouseDragging = false;
  
  function handleMouseDown(e) {
    if (isDeleting) return;
    mouseDownX = e.clientX;
    startX = e.clientX;
    isMouseDragging = false;
    isSwiping = false;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - mouseDownX;
      
      // Solo activar swipe si se arrastra hacia la izquierda
      if (deltaX < -5) {
        isMouseDragging = true;
        isSwiping = true;
        currentX = e.clientX;
        translateX = Math.min(0, currentX - startX);
        updateTransform();
      }
    };
    
    const handleMouseUp = () => {
      if (isSwiping && isMouseDragging) {
        if (Math.abs(translateX) >= deleteThreshold) {
          handleDelete();
        } else {
          resetPosition();
        }
      }
      isSwiping = false;
      isMouseDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  function updateTransform() {
    if (containerElement) {
      containerElement.style.transform = `translateX(${translateX}px)`;
      containerElement.style.transition = isSwiping ? 'none' : 'transform 0.3s ease-out';
    }
  }
  
  function resetPosition() {
    translateX = 0;
    updateTransform();
  }
  
  async function handleDelete() {
    if (isDeleting) return;
    isDeleting = true;
    
    // Animación de eliminación
    if (containerElement) {
      containerElement.style.transform = 'translateX(-100%)';
      containerElement.style.opacity = '0';
      
      // Esperar a que termine la animación
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Eliminar de la base de datos
    await notificationsStore.delete(notification.id);
  }
  
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
  
  function handleClick(e) {
    // Solo procesar click si no estamos deslizando
    // Y si no se hizo un swipe reciente
    if (!isSwiping && !isDeleting && Math.abs(translateX) < 10) {
      if (!notification.read) {
        notificationsStore.markAsRead(notification.id);
      }
      dispatch('click');
    } else {
      // Si se estaba deslizando, prevenir el click
      e?.preventDefault();
      e?.stopPropagation();
    }
  }
  
  // Resetear posición cuando cambia la notificación
  $: if (notification) {
    resetPosition();
    isDeleting = false;
  }
</script>

<div class="relative overflow-hidden group">
  <!-- Acción de eliminar (fondo rojo que se revela al deslizar) -->
  <div class="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-6 z-0">
    <Trash2 size={24} class="text-white" />
  </div>
  
  <!-- Contenido de la notificación -->
  <div
    bind:this={containerElement}
    on:click={handleClick}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:mousedown={handleMouseDown}
    class="relative p-4 hover:bg-white/10 dark:hover:bg-gray-800/20 transition-colors cursor-pointer bg-white dark:bg-gray-900 z-10
      {notification.read ? 'opacity-60' : ''}"
    role="button"
    tabindex="0"
    on:keydown={(e) => { if (e.key === 'Enter') handleClick(); }}
    style="touch-action: pan-y; user-select: none;"
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
              on:click|stopPropagation={handleMarkAsRead}
              class="p-1 hover:bg-white/20 rounded transition-colors"
              title="Marcar como leída"
            >
              <Check size={14} class="text-green-500" />
            </button>
          {/if}
        </div>
      </div>
    </div>
    </div>
  </div>
  
  <!-- Indicador visual de swipe -->
  {#if Math.abs(translateX) > 10 && !isDeleting}
    <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 z-20 opacity-50" style="width: {Math.min(4, Math.abs(translateX) / 20)}px;"></div>
  {/if}
</div>

