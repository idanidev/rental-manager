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
  import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
  
  import { totalProperties, totalRooms, occupiedRooms, occupancyRate, propertiesStore, propertiesLoading } from '$lib/stores/properties';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  
  let showCreateModal = false;
  
  /** @typedef {import('$lib/types').Property} Property */
  /** @typedef {import('$lib/types').Room} Room */
  
  function handleCreateSuccess() {
    showCreateModal = false;
    // @ts-expect-error - userStore puede tener id cuando está autenticado
    const userId = $userStore?.id;
    if (userId) {
      propertiesStore.load(String(userId));
    }
  }
  
  /**
   * @param {Property} property
   */
  function calculateMonthlyRevenue(property) {
    if (!property.rooms) return 0;
    return property.rooms
      .filter((/** @type {Room} */ r) => r.room_type !== 'common' && r.occupied)
      .reduce((/** @type {number} */ sum, /** @type {Room} */ r) => sum + (parseFloat(r.monthly_rent) || 0), 0);
  }

  // Limitar a 4 propiedades para mostrar
  $: displayedProperties = $propertiesStore.slice(0, 4);
</script>

<div class="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-4">
  <!-- Invitaciones Pendientes -->
  <MyInvitations />

  <!-- Spinner de carga -->
  {#if $propertiesLoading}
    <GlassCard hover={false}>
      <div class="flex flex-col items-center justify-center py-16">
        <LoadingSpinner size="lg" />
        <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando propiedades...</p>
      </div>
    </GlassCard>
  {:else}
    <!-- Stats Globales - 4 cuadrados de información (MEJORADOS - 3X MÁS GRANDES) -->
    {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex flex-col items-center text-center">
          <div class="p-2 sm:p-3 gradient-primary rounded-xl mb-2">
            <HomeIcon size={20} class="sm:w-6 sm:h-6 text-white" />
          </div>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Propiedades</p>
          <p class="text-4xl sm:text-5xl md:text-6xl font-bold gradient-text leading-none">{$totalProperties}</p>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex flex-col items-center text-center">
          <div class="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-2">
            <DoorOpen size={20} class="sm:w-6 sm:h-6 text-white" />
          </div>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Habitaciones</p>
          <p class="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 leading-none">{$occupiedRooms}/{$totalRooms}</p>
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex flex-col items-center text-center">
          <div class="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mb-2">
            <TrendingUp size={20} class="sm:w-6 sm:h-6 text-white" />
          </div>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Ocupación</p>
          <p class="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600 dark:text-green-400 leading-none">{$occupancyRate}%</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex flex-col items-center text-center">
          <div class="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl mb-2">
            <Euro size={20} class="sm:w-6 sm:h-6 text-white" />
          </div>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Ingresos/mes</p>
          <p class="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 leading-tight">
            {$propertiesStore.reduce((/** @type {number} */ sum, /** @type {Property} */ p) => sum + calculateMonthlyRevenue(p), 0)}€
          </p>
        </div>
      </GlassCard>
    </div>
  {/if}

  <!-- Lista de Propiedades - Máximo 4 -->
  {#if displayedProperties.length > 0}
    <div>
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">Tus Propiedades</h2>
        <Button 
          on:click={() => showCreateModal = true} 
          className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3"
        >
          <Plus size={18} class="inline mr-2" />
          Nueva Propiedad
        </Button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {#each displayedProperties as property (property.id)}
          <PropertyCard {property} />
        {/each}
      </div>
    </div>
  {:else if $propertiesStore.length === 0}
    <!-- Estado vacío mejorado -->
    <GlassCard hover={false}>
      <div class="text-center py-12 sm:py-16 px-4">
        <div class="inline-flex p-6 sm:p-8 gradient-primary rounded-full mb-6">
          <HomeIcon size={48} class="sm:w-16 sm:h-16 text-white" />
        </div>
        <h3 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
          ¡Comienza a gestionar tus propiedades!
        </h3>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
          Crea tu primera propiedad y empieza a controlar tus alquileres de forma profesional
        </p>
        <Button on:click={() => showCreateModal = true} className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
          <Plus size={20} class="sm:w-6 sm:h-6 inline mr-2" />
          Crear Mi Primera Propiedad
        </Button>
        
        <!-- Mini tutorial -->
        <div class="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left max-w-3xl mx-auto">
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <p class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">Crea tu propiedad</p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Añade nombre y dirección</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <p class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">Añade habitaciones</p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Define precio y detalles</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <p class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">Gestiona inquilinos</p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Contratos y pagos</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  {/if}
  {/if}
</div>

<!-- Modal Crear Propiedad -->
<Modal bind:open={showCreateModal} title="Nueva Propiedad">
  <PropertyForm 
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>
