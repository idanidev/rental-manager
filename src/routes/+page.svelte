<script>
  import { onMount } from 'svelte';
  import { Plus, Home as HomeIcon, ChevronRight, DoorOpen, Users, Euro, TrendingUp, MapPin, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { propertiesStore } from '$lib/stores/properties';
  import { userStore } from '$lib/stores/user';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import RoomCard from '$lib/components/rooms/RoomCard.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import MyInvitations from '$lib/components/invitations/MyInvitations.svelte';
  
  import { totalProperties, totalRooms, occupiedRooms, occupancyRate } from '$lib/stores/properties';
  
  let showCreateModal = false;
  let expandedPropertyId = null;
  
  function toggleProperty(propertyId) {
    expandedPropertyId = expandedPropertyId === propertyId ? null : propertyId;
  }
  
  function handleCreateSuccess() {
    showCreateModal = false;
    propertiesStore.load($userStore.id);
  }
  
  function calculateMonthlyRevenue(property) {
    if (!property.rooms) return 0;
    return property.rooms
      .filter(r => r.occupied)
      .reduce((sum, r) => sum + (parseFloat(r.monthly_rent) || 0), 0);
  }
</script>

<div class="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex items-center justify-between">
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
    
    <Button on:click={() => showCreateModal = true} className="text-sm">
      <Plus size={18} class="inline mr-1.5" />
      Nueva Propiedad
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
    <div class="space-y-4">
      {#each $propertiesStore as property (property.id)}
        <GlassCard hover={false}>
          <div class="p-4 sm:p-6">
            <!-- Header de la Propiedad -->
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 gradient-primary rounded-xl">
                    <HomeIcon size={24} class="text-white" />
                  </div>
                  <div class="flex-1">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {property.name}
                    </h2>
                    <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin size={14} class="mr-1" />
                      {property.address}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                on:click={() => goto(`/properties/${property.id}`)}
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium"
              >
                Ver detalles
                <ArrowRight size={16} />
              </button>
            </div>
            
            <!-- Stats de la Propiedad -->
            <div class="grid grid-cols-4 gap-1 sm:gap-1.5 md:gap-2 mb-4">
              <div class="text-center p-1 sm:p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md sm:rounded-lg">
                <p class="text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5 leading-none">Habs</p>
                <p class="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 leading-none">
                  {property.rooms?.length || 0}
                </p>
              </div>
              <div class="text-center p-1 sm:p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md sm:rounded-lg">
                <p class="text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5 leading-none">Ocup</p>
                <p class="text-base sm:text-lg md:text-xl font-bold text-green-600 dark:text-green-400 leading-none">
                  {property.rooms?.filter(r => r.occupied).length || 0}
                </p>
              </div>
              <div class="text-center p-1 sm:p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md sm:rounded-lg">
                <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-0.5 leading-none">%</p>
                <p class="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 leading-none">
                  {property.rooms?.length > 0 
                    ? Math.round((property.rooms.filter(r => r.occupied).length / property.rooms.length) * 100)
                    : 0}%
                </p>
              </div>
              <div class="text-center p-1 sm:p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md sm:rounded-lg">
                <p class="text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400 mb-0.5 leading-none">Ing</p>
                <p class="text-base sm:text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400 leading-tight">
                  {calculateMonthlyRevenue(property)}€
                </p>
              </div>
            </div>
            
            <!-- Habitaciones Preview (Expandible) -->
            {#if property.rooms && property.rooms.length > 0}
              <div>
                <button
                  on:click={() => toggleProperty(property.id)}
                  class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-3"
                >
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Habitaciones ({property.rooms.length})
                  </span>
                  <ChevronRight 
                    size={20} 
                    class="text-gray-500 transition-transform {expandedPropertyId === property.id ? 'rotate-90' : ''}" 
                  />
                </button>
                
                {#if expandedPropertyId === property.id}
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                    {#each property.rooms.slice(0, 6) as room (room.id)}
                      <RoomCard 
                        {room} 
                        propertyId={property.id}
                        allRooms={property.rooms}
                        showQuickActions={true}
                        on:changed={() => propertiesStore.load($userStore.id)}
                      />
                    {/each}
                  </div>
                  {#if property.rooms.length > 6}
                    <div class="mt-3 text-center">
                      <button
                        on:click={() => goto(`/properties/${property.id}`)}
                        class="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        Ver todas las habitaciones ({property.rooms.length})
                      </button>
                    </div>
                  {/if}
                {/if}
              </div>
            {:else}
              <div class="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <DoorOpen size={32} class="mx-auto text-gray-400 mb-2" />
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  No hay habitaciones aún
                </p>
                <Button 
                  on:click={() => goto(`/properties/${property.id}`)}
                  variant="secondary"
                  className="text-xs"
                >
                  Añadir habitación
                </Button>
              </div>
            {/if}
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
