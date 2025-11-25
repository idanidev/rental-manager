<script>
  import { onMount } from 'svelte';
  import { Plus, Home as HomeIcon, DoorOpen, Users, Euro, TrendingUp, MapPin } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { propertiesStore } from '$lib/stores/properties';
  import { userStore } from '$lib/stores/user';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import MyInvitations from '$lib/components/invitations/MyInvitations.svelte';
  
  import { totalProperties, totalRooms, occupiedRooms, occupancyRate } from '$lib/stores/properties';
  
  let showCreateModal = false;
  
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

<div class="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex items-center justify-between mb-1 sm:mb-3">
    <div>
      <h1 class="text-lg sm:text-xl md:text-2xl font-bold gradient-text">
        Mis Propiedades
      </h1>
      {#if $userStore?.user_metadata?.name || $userStore?.email}
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Bienvenido, <span class="font-semibold">{$userStore?.user_metadata?.name || $userStore?.email?.split('@')[0]}</span>
        </p>
      {/if}
    </div>
    
    <Button on:click={() => showCreateModal = true} className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
      <Plus size={14} class="inline mr-1" />
      <span class="hidden sm:inline">Nueva Propiedad</span>
      <span class="sm:hidden">Nueva</span>
    </Button>
  </div>

  <!-- Invitaciones Pendientes -->
  <MyInvitations />

  <!-- Stats Globales -->
  {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-4 gap-1 sm:gap-1.5 md:gap-2">
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="p-1.5 sm:p-2">
          <div class="flex flex-col items-center text-center">
            <div class="p-1 sm:p-1.5 gradient-primary rounded-md sm:rounded-lg mb-1">
              <HomeIcon size={10} class="text-white sm:w-3 sm:h-3" />
            </div>
            <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Props</p>
            <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">{$totalProperties}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="p-1.5 sm:p-2">
          <div class="flex flex-col items-center text-center">
            <div class="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md sm:rounded-lg mb-1">
              <DoorOpen size={10} class="text-white sm:w-3 sm:h-3" />
            </div>
            <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Habs</p>
            <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">{$occupiedRooms}/{$totalRooms}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="p-1.5 sm:p-2">
          <div class="flex flex-col items-center text-center">
            <div class="p-1 sm:p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md sm:rounded-lg mb-1">
              <TrendingUp size={10} class="text-white sm:w-3 sm:h-3" />
            </div>
            <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Ocup</p>
            <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">{$occupancyRate}%</p>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="p-1.5 sm:p-2">
          <div class="flex flex-col items-center text-center">
            <div class="p-1 sm:p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-md sm:rounded-lg mb-1">
              <Euro size={10} class="text-white sm:w-3 sm:h-3" />
            </div>
            <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Ing</p>
            <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-tight">
              {$propertiesStore.reduce((sum, p) => sum + calculateMonthlyRevenue(p), 0)}€
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  {/if}

  <!-- Lista de Propiedades -->
  {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-1 gap-1.5 sm:gap-2 md:grid-cols-2 md:gap-3">
      {#each $propertiesStore as property (property.id)}
        {@const privateRooms = property.rooms?.filter(r => r.room_type !== 'common') || []}
        {@const commonRooms = property.rooms?.filter(r => r.room_type === 'common') || []}
        <GlassCard hover={true} className="cursor-pointer">
          <div 
            class="p-0 sm:p-2 md:p-2.5"
            on:click={() => goto(`/properties/${property.id}`)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && goto(`/properties/${property.id}`)}
          >
            <!-- Header de la Propiedad -->
            <div class="mb-0.5 sm:mb-1.5">
              <div class="flex items-center gap-1.5 mb-0.5">
                <div class="p-0.5 sm:p-1.5 gradient-primary rounded-md flex-shrink-0">
                  <HomeIcon size={14} class="text-white sm:w-4 sm:h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 truncate">
                    {property.name}
                  </h2>
                  <div class="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={12} class="mr-1 flex-shrink-0" />
                    <span class="truncate">{property.address}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Stats de la Propiedad -->
            <div class="grid grid-cols-4 gap-0.5 sm:gap-1.5">
              <div class="text-center p-0.5 sm:p-1.5 bg-white/60 dark:bg-gray-800/50 rounded-md">
                <p class="text-xs sm:text-sm text-gray-900 dark:text-gray-300 mb-0 font-semibold leading-tight">Habs</p>
                <p class="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {privateRooms.length}
                </p>
              </div>
              <div class="text-center p-0.5 sm:p-1.5 bg-white/60 dark:bg-gray-800/50 rounded-md">
                <p class="text-xs sm:text-sm text-gray-900 dark:text-gray-300 mb-0 font-semibold leading-tight">Ocup</p>
                <p class="text-sm sm:text-base md:text-lg font-bold text-green-700 dark:text-green-400 leading-none">
                  {privateRooms.filter(r => r.occupied).length}
                </p>
              </div>
              <div class="text-center p-0.5 sm:p-1.5 bg-white/60 dark:bg-gray-800/50 rounded-md">
                <p class="text-xs sm:text-sm text-gray-900 dark:text-gray-300 mb-0 font-semibold leading-tight">%</p>
                <p class="text-sm sm:text-base md:text-lg font-bold text-blue-700 dark:text-blue-400 leading-none">
                  {privateRooms.length > 0 ? Math.round((privateRooms.filter(r => r.occupied).length / privateRooms.length) * 100) : 0}%
                </p>
              </div>
              <div class="text-center p-0.5 sm:p-1.5 bg-white/60 dark:bg-gray-800/50 rounded-md">
                <p class="text-xs sm:text-sm text-gray-900 dark:text-gray-300 mb-0 font-semibold leading-tight">Ing</p>
                <p class="text-xs sm:text-sm md:text-base font-bold text-orange-700 dark:text-orange-400 leading-tight">
                  {calculateMonthlyRevenue(property)}€
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      {/each}
    </div>
  {:else}
    <GlassCard hover={false}>
      <div class="text-center py-16">
        <div class="inline-flex p-6 gradient-primary rounded-full mb-4">
          <HomeIcon size={48} class="text-white" />
        </div>
        <h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
          No tienes propiedades aún
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Crea tu primera propiedad para empezar a gestionar tus alquileres
        </p>
        <Button on:click={() => showCreateModal = true}>
          <Plus size={20} class="inline mr-2" />
          Crear Primera Propiedad
        </Button>
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
