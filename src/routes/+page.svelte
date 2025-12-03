<script>
  import { onMount } from 'svelte';
  import { Plus, Home as HomeIcon, DoorOpen, Users, Euro, TrendingUp, MapPin, Bell } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { propertiesStore } from '$lib/stores/properties';
  import { userStore } from '$lib/stores/user';
  import { notificationsService } from '$lib/services/notifications';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import MyInvitations from '$lib/components/invitations/MyInvitations.svelte';
  
  import { totalProperties, totalRooms, occupiedRooms, occupancyRate } from '$lib/stores/properties';
  
  let showCreateModal = false;
  let notificationCount = 0;
  let urgentNotifications = 0;
  
  onMount(async () => {
    if ($userStore) {
      try {
        const notifications = await notificationsService.getAllNotifications($userStore.id);
        notificationCount = notifications.total;
        urgentNotifications = notifications.urgent;
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    }
  });
  
  function handleCreateSuccess() {
    showCreateModal = false;
    propertiesStore.load($userStore.id);
  }
  
  function calculateMonthlyRevenue(property) {
    if (!property.rooms) return 0;
    return property.rooms
      .filter(r => r.room_type !== 'common' && r.occupied)
      .reduce((sum, r) => sum + (parseFloat(r.monthly_rent) || 0), 0);
  }
</script>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header con bienvenida -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold gradient-text">
        Mis Propiedades
      </h1>
      {#if $userStore?.user_metadata?.name || $userStore?.email}
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido, <span class="font-semibold">{$userStore?.user_metadata?.name || $userStore?.email?.split('@')[0]}</span>
        </p>
      {/if}
    </div>
    
    <Button on:click={() => showCreateModal = true} className="w-full sm:w-auto">
      <Plus size={20} class="inline mr-2" />
      Nueva Propiedad
    </Button>
  </div>

  <!-- Acciones Rápidas -->
  {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-2 gap-3">
      <button
        on:click={() => showCreateModal = true}
        class="glass-card p-6 hover:scale-[1.02] transition-all text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="p-4 gradient-primary rounded-2xl group-hover:scale-110 transition-transform">
            <Plus size={32} class="text-white" />
          </div>
          <div>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-200">Nueva Propiedad</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Agregar otra propiedad</p>
          </div>
        </div>
      </button>

      <button
        on:click={() => goto('/notifications')}
        class="glass-card p-6 hover:scale-[1.02] transition-all text-left group relative"
      >
        <div class="flex items-center gap-4">
          <div class="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl group-hover:scale-110 transition-transform relative">
            <Bell size={32} class="text-white" />
            {#if urgentNotifications > 0}
              <span class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {urgentNotifications}
              </span>
            {/if}
          </div>
          <div>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-200">Notificaciones</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {notificationCount > 0 ? `${notificationCount} pendientes` : 'Todo al día'}
            </p>
          </div>
        </div>
      </button>
    </div>
  {/if}

  <!-- Invitaciones Pendientes -->
  <MyInvitations />

  <!-- Stats Globales - Mejorados -->
  {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <GlassCard hover={false} className="p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 gradient-primary rounded-xl flex-shrink-0">
            <HomeIcon size={24} class="text-white" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">Propiedades</p>
            <p class="text-2xl sm:text-3xl font-bold gradient-text">{$totalProperties}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex-shrink-0">
            <DoorOpen size={24} class="text-white" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">Habitaciones</p>
            <p class="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{$occupiedRooms}/{$totalRooms}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex-shrink-0">
            <TrendingUp size={24} class="text-white" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">Ocupación</p>
            <p class="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{$occupancyRate}%</p>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-4">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex-shrink-0">
            <Euro size={24} class="text-white" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">Ingresos/mes</p>
            <p class="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {$propertiesStore.reduce((sum, p) => sum + calculateMonthlyRevenue(p), 0)}€
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  {/if}

  <!-- Lista de Propiedades -->
  {#if $propertiesStore.length > 0}
    <div>
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Tus Propiedades</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each $propertiesStore as property (property.id)}
          {@const privateRooms = property.rooms?.filter(r => r.room_type !== 'common') || []}
          <GlassCard hover={true} className="cursor-pointer">
            <div 
              class="p-4"
              on:click={() => goto(`/properties/${property.id}`)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && goto(`/properties/${property.id}`)}
            >
              <!-- Header -->
              <div class="flex items-start gap-3 mb-4">
                <div class="p-3 gradient-primary rounded-xl flex-shrink-0">
                  <HomeIcon size={24} class="text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                    {property.name}
                  </h3>
                  <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <MapPin size={14} class="mr-1 flex-shrink-0" />
                    <span class="truncate">{property.address}</span>
                  </div>
                </div>
              </div>
              
              <!-- Stats compactos -->
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2">
                  <p class="text-xs text-gray-600 dark:text-gray-400">Habs</p>
                  <p class="text-lg font-bold text-gray-800 dark:text-gray-200">{privateRooms.length}</p>
                </div>
                <div class="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2">
                  <p class="text-xs text-gray-600 dark:text-gray-400">Ocupadas</p>
                  <p class="text-lg font-bold text-green-600 dark:text-green-400">
                    {privateRooms.filter(r => r.occupied).length}
                  </p>
                </div>
                <div class="bg-white/60 dark:bg-gray-800/50 rounded-lg p-2">
                  <p class="text-xs text-gray-600 dark:text-gray-400">€/mes</p>
                  <p class="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {calculateMonthlyRevenue(property)}
                  </p>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mt-3">
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style="width: {privateRooms.length > 0 ? (privateRooms.filter(r => r.occupied).length / privateRooms.length * 100) : 0}%"
                  ></div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {privateRooms.length > 0 ? Math.round((privateRooms.filter(r => r.occupied).length / privateRooms.length) * 100) : 0}% ocupación
                </p>
              </div>
            </div>
          </GlassCard>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Estado vacío mejorado -->
    <GlassCard hover={false}>
      <div class="text-center py-16 px-4">
        <div class="inline-flex p-8 gradient-primary rounded-full mb-6">
          <HomeIcon size={64} class="text-white" />
        </div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
          ¡Comienza a gestionar tus propiedades!
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Crea tu primera propiedad y empieza a controlar tus alquileres de forma profesional
        </p>
        <Button on:click={() => showCreateModal = true} className="text-lg px-8 py-4">
          <Plus size={24} class="inline mr-2" />
          Crear Mi Primera Propiedad
        </Button>
        
        <!-- Mini tutorial -->
        <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">Crea tu propiedad</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Añade nombre y dirección</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">Añade habitaciones</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Define precio y detalles</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <p class="font-semibold text-gray-800 dark:text-gray-200">Gestiona inquilinos</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Contratos y pagos</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  {/if}
</div>

<!-- Modal Crear Propiedad -->
<Modal bind:open={showCreateModal} title="Nueva Propiedad">
  <PropertyForm 
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>
