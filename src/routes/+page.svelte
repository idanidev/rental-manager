<script>
  import { onMount } from 'svelte';
  import { Plus, TrendingUp, Home as HomeIcon, Euro, AlertCircle, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { propertiesStore } from '$lib/stores/properties';
  import { userStore } from '$lib/stores/user';
  import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import RoomCard from '$lib/components/rooms/RoomCard.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  
  import { totalProperties, totalRooms, occupiedRooms, occupancyRate } from '$lib/stores/properties';
  
  let showCreateModal = false;
  let showOnlyAvailable = false;
  let showOnlyOccupied = false;
  let expandedProperties = {}; // Para controlar qué propiedades están expandidas

  // Expandir todas por defecto
  $: if ($propertiesStore.length > 0) {
    $propertiesStore.forEach(p => {
      if (!(p.id in expandedProperties)) {
        expandedProperties[p.id] = true;
      }
    });
  }

  function toggleProperty(propertyId) {
    expandedProperties[propertyId] = !expandedProperties[propertyId];
  }

  function handleCreateSuccess() {
    showCreateModal = false;
  }
</script>

<div class="max-w-7xl mx-auto space-y-3 sm:space-y-4 animate-fade-in">
  <!-- Header - Compacto -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
        Dashboard
      </h1>
      <p class="text-xs sm:text-sm text-gray-600">
        {$userStore?.user_metadata?.name || $userStore?.email || 'Usuario'}
      </p>
    </div>
    
    <Button on:click={() => showCreateModal = true} className="text-sm">
      <Plus size={18} class="inline mr-1" />
      <span class="hidden sm:inline">Nueva</span>
    </Button>
  </div>

  <!-- Stats - Compacto -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <GlassCard hover={false}>
      <div class="p-3">
        <div class="flex items-center gap-2 mb-1">
          <div class="p-2 gradient-primary rounded-lg">
            <HomeIcon size={20} class="text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-600 font-medium">Propiedades</p>
            <p class="text-2xl font-bold gradient-text">{$totalProperties}</p>
          </div>
        </div>
      </div>
    </GlassCard>

    <GlassCard hover={false}>
      <div class="p-3">
        <div class="flex items-center gap-2 mb-1">
          <div class="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <Euro size={20} class="text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-600 font-medium">Habitaciones</p>
            <p class="text-2xl font-bold gradient-text">{$occupiedRooms}/{$totalRooms}</p>
          </div>
        </div>
      </div>
    </GlassCard>

    <GlassCard hover={false}>
      <div class="p-3">
        <div class="flex items-center gap-2 mb-1">
          <div class="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <TrendingUp size={20} class="text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-600 font-medium">Ocupación</p>
            <p class="text-2xl font-bold gradient-text">{$occupancyRate}%</p>
          </div>
        </div>
      </div>
    </GlassCard>
    
    <GlassCard hover={false}>
      <div class="p-3">
        <div class="flex items-center gap-2 mb-1">
          <div class="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <AlertCircle size={20} class="text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-600 font-medium">Alertas</p>
            <p class="text-2xl font-bold gradient-text">-</p>
          </div>
        </div>
      </div>
    </GlassCard>
  </div>

  <!-- Gestión Rápida por Propiedad -->
  {#if $propertiesStore.length > 0 && $propertiesStore.some(p => p.rooms?.length > 0)}
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-gray-800">
          Gestión Rápida
        </h2>
        <div class="flex gap-1.5">
          <button
            on:click={() => showOnlyAvailable = !showOnlyAvailable}
            class="text-xs px-2 py-1 rounded-lg transition-colors
              {showOnlyAvailable ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          >
            {showOnlyAvailable ? '✓ ' : ''}Disponibles
          </button>
          <button
            on:click={() => showOnlyOccupied = !showOnlyOccupied}
            class="text-xs px-2 py-1 rounded-lg transition-colors
              {showOnlyOccupied ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          >
            {showOnlyOccupied ? '✓ ' : ''}Ocupadas
          </button>
        </div>
      </div>
      
      <!-- Desplegables por Propiedad -->
      <div class="space-y-3">
        {#each $propertiesStore as property (property.id)}
          {#if property.rooms?.length > 0}
            {@const filteredRooms = property.rooms.filter(room => 
              (!showOnlyAvailable || !room.occupied) && (!showOnlyOccupied || room.occupied)
            )}
            
            {#if filteredRooms.length > 0}
              <GlassCard hover={false}>
                <div class="p-3">
                  <!-- Header de la Propiedad -->
                  <button
                    on:click={() => toggleProperty(property.id)}
                    class="w-full flex items-center justify-between text-left group"
                  >
                    <div class="flex items-center gap-2">
                      <div class="p-1.5 gradient-primary rounded-lg">
                        <HomeIcon size={16} class="text-white" />
                      </div>
                      <div>
                        <h3 class="text-sm sm:text-base font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                          {property.name}
                        </h3>
                        <p class="text-xs text-gray-600">
                          {filteredRooms.length} habitación{filteredRooms.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        on:click|stopPropagation={() => goto(`/properties/${property.id}`)}
                        class="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                      >
                        Ver detalles
                      </button>
                      {#if expandedProperties[property.id]}
                        <ChevronUp size={20} class="text-gray-600" />
                      {:else}
                        <ChevronDown size={20} class="text-gray-600" />
                      {/if}
                    </div>
                  </button>
                  
                  <!-- Habitaciones (Desplegable) -->
                  {#if expandedProperties[property.id]}
                    <div class="mt-3 pt-3 border-t border-gray-200/50">
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {#each filteredRooms as room (room.id)}
                          <RoomCard 
                            {room} 
                            propertyId={property.id}
                            allRooms={property.rooms}
                            showQuickActions={true}
                            on:changed={() => propertiesStore.load($userStore.id)}
                          />
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </GlassCard>
            {/if}
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Propiedades -->
  <div>
    <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-3">
      Mis Propiedades
    </h2>
    
    {#if $propertiesStore.length > 0}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {#each $propertiesStore as property (property.id)}
          <PropertyCard {property} />
        {/each}
      </div>
    {:else}
      <GlassCard hover={false}>
        <div class="text-center py-12">
          <AlertCircle size={48} class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-xl font-bold text-gray-700 mb-2">
            No tienes propiedades aún
          </h3>
          <p class="text-gray-600 mb-6">
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
</div>

<!-- Modal Crear Propiedad -->
<Modal bind:open={showCreateModal} title="Nueva Propiedad">
  <PropertyForm 
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>
