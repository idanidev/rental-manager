<script>
  import { onMount, onDestroy } from "svelte";
  import {
    Plus,
    Home as HomeIcon,
    DoorOpen,
    Users,
    Euro,
    TrendingUp,
    MapPin,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import {
    propertiesStore,
    propertiesLoading,
    totalProperties,
    totalRooms,
    occupiedRooms,
    occupancyRate,
    selectedPropertyId,
    selectedProperty,
  } from "$lib/stores/properties";
  import { userStore } from "$lib/stores/user";
  import PropertyForm from "$lib/components/properties/PropertyForm.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import GlassCard from "$lib/components/ui/GlassCard.svelte";
  import MyInvitations from "$lib/components/invitations/MyInvitations.svelte";
  import PropertyCard from "$lib/components/properties/PropertyCard.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import { browser } from "$app/environment";

  let showCreateModal = false;
  let hasInitialized = false;

  // Listener para abrir modal desde BottomNav
  function handleOpenNewProperty() {
    showCreateModal = true;
  }

  onMount(() => {
    if (browser) {
      window.addEventListener("open-new-property", handleOpenNewProperty);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener("open-new-property", handleOpenNewProperty);
    }
  });

  /** @typedef {import('$lib/types').Property} Property */
  /** @typedef {import('$lib/types').Room} Room */

  // Marcar cuando la carga inicial haya terminado
  $: {
    if ($propertiesLoading === false && $userStore?.id && !hasInitialized) {
      hasInitialized = true;
    }
  }

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
      .filter((/** @type {Room} */ r) => r.room_type !== "common" && r.occupied)
      .reduce((/** @type {number} */ sum, /** @type {Room} */ r) => {
        const rent = Number(r.monthly_rent);
        return sum + (isNaN(rent) ? 0 : rent);
      }, 0);
  }

  // Calcular estadísticas solo para la propiedad seleccionada
  $: selectedPropertyRooms =
    $selectedProperty?.rooms?.filter((r) => r.room_type !== "common") || [];
  $: selectedPropertyOccupiedRooms =
    selectedPropertyRooms.filter((r) => r.occupied) || [];
  $: selectedPropertyOccupancy =
    selectedPropertyRooms.length > 0
      ? (
          (selectedPropertyOccupiedRooms.length /
            selectedPropertyRooms.length) *
          100
        ).toFixed(1)
      : 0;
  $: selectedPropertyRevenue = selectedPropertyOccupiedRooms.reduce(
    (sum, r) => {
      const rent = Number(r.monthly_rent);
      return sum + (isNaN(rent) ? 0 : rent);
    },
    0,
  );
</script>

<div
  class="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-4"
>
  <!-- Invitaciones Pendientes -->
  <MyInvitations />

  <!-- Spinner de carga - Mostrar mientras carga O hasta que se haya inicializado -->
  {#if $propertiesLoading || !hasInitialized}
    <GlassCard hover={false}>
      <div class="flex flex-col items-center justify-center py-16">
        <LoadingSpinner size="lg" />
        <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
          Cargando propiedades...
        </p>
      </div>
    </GlassCard>
  {:else if $selectedProperty}
    <!-- Vista de Propiedad Seleccionada -->
    <div>
      <!-- Encabezado de la propiedad -->
      <GlassCard hover={false} className="p-4 sm:p-6 mb-4 dark:!bg-gray-800/95">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="text-4xl sm:text-5xl">🏠</div>
            <div>
              <h1
                class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1"
              >
                {$selectedProperty.name}
              </h1>
              {#if $selectedProperty.address}
                <div
                  class="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <MapPin size={16} />
                  <p class="text-sm sm:text-base">
                    {$selectedProperty.address}
                  </p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </GlassCard>

      <!-- Stats de la Propiedad Seleccionada -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex-shrink-0"
              >
                <DoorOpen size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-none"
              >
                {selectedPropertyRooms.length}
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Total Habitaciones
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex-shrink-0"
              >
                <Users size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 leading-none"
              >
                {selectedPropertyOccupiedRooms.length}
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Ocupadas
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex-shrink-0"
              >
                <TrendingUp size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 leading-none"
              >
                {selectedPropertyOccupancy}%
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Ocupación
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex-shrink-0"
              >
                <Euro size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 leading-tight"
              >
                {selectedPropertyRevenue}€
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Ingresos/mes
            </p>
          </div>
        </GlassCard>
      </div>

      <!-- Acciones rápidas -->
      <GlassCard hover={false} className="p-4 sm:p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
          Acciones rápidas
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            on:click={() => goto(`/properties/${$selectedPropertyId}`)}
            className="w-full justify-center"
          >
            <DoorOpen size={18} class="mr-2" />
            Ver Habitaciones
          </Button>
          <Button
            on:click={() =>
              goto(`/properties/${$selectedPropertyId}?tab=tenants`)}
            variant="secondary"
            className="w-full justify-center"
          >
            <Users size={18} class="mr-2" />
            Ver Inquilinos
          </Button>
          <Button
            on:click={() =>
              goto(`/properties/${$selectedPropertyId}?tab=finances`)}
            variant="secondary"
            className="w-full justify-center"
          >
            <TrendingUp size={18} class="mr-2" />
            Ver Finanzas
          </Button>
        </div>
      </GlassCard>
    </div>
  {:else if $propertiesStore.length > 0}
    <!-- Vista Dashboard General (sin propiedad seleccionada) -->
    <div>
      <!-- Stats Globales -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div class="p-2 sm:p-3 gradient-primary rounded-xl flex-shrink-0">
                <HomeIcon size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text leading-none"
              >
                {$totalProperties}
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Propiedades
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex-shrink-0"
              >
                <DoorOpen size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 leading-none"
              >
                {$occupiedRooms}/{$totalRooms}
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Habitaciones
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex-shrink-0"
              >
                <TrendingUp size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 leading-none"
              >
                {$occupancyRate}%
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Ocupación
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 sm:p-6">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 sm:gap-4 mb-2">
              <div
                class="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex-shrink-0"
              >
                <Euro size={20} class="sm:w-6 sm:h-6 text-white" />
              </div>
              <p
                class="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 leading-tight"
              >
                {$propertiesStore.reduce(
                  (/** @type {number} */ sum, /** @type {Property} */ p) =>
                    sum + calculateMonthlyRevenue(p),
                  0,
                )}€
              </p>
            </div>
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              Ingresos/mes
            </p>
          </div>
        </GlassCard>
      </div>

      <!-- Mensaje para seleccionar propiedad -->
      <GlassCard hover={false}>
        <div class="text-center py-12 sm:py-16 px-4">
          <div
            class="inline-flex p-6 sm:p-8 gradient-primary rounded-full mb-6"
          >
            <HomeIcon size={48} class="sm:w-16 sm:h-16 text-white" />
          </div>
          <h3
            class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3"
          >
            Selecciona una propiedad para ver detalles
          </h3>
          <p
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto"
          >
            Mantén pulsado el botón 🏠 en la barra inferior o toca "Propied."
            para seleccionar una propiedad.
          </p>
        </div>
      </GlassCard>
    </div>
  {:else if $propertiesStore.length === 0}
    <!-- Estado vacío mejorado -->
    <GlassCard hover={false}>
      <div class="text-center py-12 sm:py-16 px-4">
        <div class="inline-flex p-6 sm:p-8 gradient-primary rounded-full mb-6">
          <HomeIcon size={48} class="sm:w-16 sm:h-16 text-white" />
        </div>
        <h3
          class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3"
        >
          ¡Comienza a gestionar tus propiedades!
        </h3>
        <p
          class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto"
        >
          Crea tu primera propiedad y empieza a controlar tus alquileres de
          forma profesional
        </p>
        <Button
          on:click={() => (showCreateModal = true)}
          className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
        >
          <Plus size={20} class="sm:w-6 sm:h-6 inline mr-2" />
          Crear Mi Primera Propiedad
        </Button>

        <!-- Mini tutorial -->
        <div
          class="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left max-w-3xl mx-auto"
        >
          <div class="flex gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold"
            >
              1
            </div>
            <div>
              <p
                class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200"
              >
                Crea tu propiedad
              </p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Añade nombre y dirección
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold"
            >
              2
            </div>
            <div>
              <p
                class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200"
              >
                Añade habitaciones
              </p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Define precio y detalles
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold"
            >
              3
            </div>
            <div>
              <p
                class="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200"
              >
                Gestiona inquilinos
              </p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Contratos y pagos
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  {:else}
    <!-- Vista Resumen de Todas las Propiedades -->
    <div class="space-y-6">
      <header class="flex items-center justify-between">
        <div>
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200"
          >
            Mis Propiedades
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Resumen general de tu cartera
          </p>
        </div>
        <Button on:click={() => (showCreateModal = true)} className="px-4 py-2">
          <Plus size={20} class="mr-2" />
          Nueva
        </Button>
      </header>

      <!-- Resumen Global -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Total Ingresos -->
        <GlassCard
          hover={false}
          className="p-4 sm:p-5 dark:!bg-gray-800/95 relative overflow-hidden group"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          ></div>
          <div class="flex items-start justify-between relative z-10">
            <div>
              <p
                class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
              >
                Ingresos Totales/mes
              </p>
              <h3
                class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100"
              >
                {$propertiesStore.reduce(
                  (sum, p) => sum + calculateMonthlyRevenue(p),
                  0,
                )}€
              </h3>
            </div>
            <div
              class="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20"
            >
              <Euro size={24} class="text-white" />
            </div>
          </div>
        </GlassCard>

        <!-- Total Propiedades -->
        <GlassCard
          hover={false}
          className="p-4 sm:p-5 dark:!bg-gray-800/95 relative overflow-hidden group"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          ></div>
          <div class="flex items-start justify-between relative z-10">
            <div>
              <p
                class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
              >
                Propiedades
              </p>
              <h3
                class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100"
              >
                {$totalProperties}
              </h3>
            </div>
            <div
              class="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20"
            >
              <HomeIcon size={24} class="text-white" />
            </div>
          </div>
        </GlassCard>

        <!-- Total Habitaciones Ocupadas -->
        <GlassCard
          hover={false}
          className="p-4 sm:p-5 dark:!bg-gray-800/95 relative overflow-hidden group"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          ></div>
          <div class="flex items-start justify-between relative z-10">
            <div>
              <p
                class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
              >
                Ocupación Global
              </p>
              <h3
                class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100"
              >
                {$occupancyRate}%
              </h3>
              <p class="text-xs text-gray-500 mt-1">
                {$occupiedRooms} de {$totalRooms} habitaciones
              </p>
            </div>
            <div
              class="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20"
            >
              <TrendingUp size={24} class="text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      <!-- Lista de Propiedades -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each $propertiesStore as property (property.id)}
          <PropertyCard {property} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Modal Crear Propiedad -->
<Modal bind:open={showCreateModal} title="Nueva Propiedad">
  <PropertyForm
    on:success={handleCreateSuccess}
    on:cancel={() => (showCreateModal = false)}
  />
</Modal>
