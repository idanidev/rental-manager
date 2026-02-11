<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    Home,
    MapPin,
    Users,
    TrendingUp,
    Settings,
    UserPlus,
    ArrowLeft,
    DoorOpen,
    Euro,
    Receipt,
    Plus,
    Edit,
    Trash2,
    PlusCircle,
    ChevronRight,
  } from "lucide-svelte";
  import { propertiesService } from "$lib/services/properties";
  import { roomsService } from "$lib/services/rooms";
  import { tenantsService } from "$lib/services/tenants";
  import { financesService } from "$lib/services/finances";
  import { userStore } from "$lib/stores/user";
  import { selectedPropertyId } from "$lib/stores/properties";

  import GlassCard from "$lib/components/ui/GlassCard.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import RoomCard from "$lib/components/rooms/RoomCard.svelte";
  import RoomForm from "$lib/components/rooms/RoomForm.svelte";
  import TenantCard from "$lib/components/tenants/TenantCard.svelte";
  import TenantForm from "$lib/components/tenants/TenantForm.svelte";
  import GenerateContractModal from "$lib/components/tenants/GenerateContractModal.svelte";
  import EditTenantModal from "$lib/components/tenants/EditTenantModal.svelte";
  import UserAccessManager from "$lib/components/properties/UserAccessManager.svelte";
  import PropertyForm from "$lib/components/properties/PropertyForm.svelte";
  import ExpenseCard from "$lib/components/finances/ExpenseCard.svelte";
  import ExpenseForm from "$lib/components/finances/ExpenseForm.svelte";
  import IncomeCard from "$lib/components/finances/IncomeCard.svelte";
  import IncomeForm from "$lib/components/finances/IncomeForm.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import ConfirmModal from "$lib/components/ui/ConfirmModal.svelte";
  import RenewContractModal from "$lib/components/tenants/RenewContractModal.svelte";
  import { permissionsService } from "$lib/services/permissions";
  import { showToast } from "$lib/stores/toast";

  export let params = {}; // Supress 'unknown prop' warning

  let property = null;
  let rooms = [];
  let tenants = [];
  let expenses = [];
  let income = [];
  let loading = true;
  let error = "";

  // Auto-renew confirm modal state
  let showRenewConfirm = false;
  let renewTenant = null;
  let renewLoading = false;
  let showEditModal = false;
  let showRoomModal = false;
  let showTenantModal = false;
  let showUserAccess = false;
  let showExpenseModal = false;
  let showIncomeModal = false;
  let selectedRoom = null;
  let selectedTenant = null;
  let selectedExpense = null;
  let selectedIncome = null;
  let userRole = "viewer";
  let showContractModal = false;
  let contractTenant = null;
  let contractRoom = null;
  let showEditTenantModal = false;
  let selectedTenantForEdit = null;
  let activeTab = "rooms"; // 'rooms', 'tenants', 'finances'
  let isRenewalContract = false;

  $: propertyId = $page.params.id;

  // Sincronizar con query param 'tab' del BottomNav
  $: urlTab = $page.url.searchParams.get("tab");
  $: {
    if (urlTab && ["rooms", "tenants", "finances"].includes(urlTab)) {
      activeTab = urlTab;
    } else {
      activeTab = "rooms";
    }
  }

  // Recargar datos cuando cambie el propertyId (incluido al cambiar de propiedad)
  $: if (propertyId) {
    loadAllData();
    selectedPropertyId.select(propertyId);
  }

  async function loadAllData() {
    loading = true;
    error = "";

    try {
      // Cargar propiedad primero
      property = await propertiesService.getProperty(propertyId);

      if (property) {
        // Obtener rol del usuario
        // Primero verificar si es owner directo
        if (property.owner_id === $userStore?.id) {
          userRole = "owner";
        } else {
          const access = await permissionsService.checkPermission(
            propertyId,
            $userStore?.id,
          );
          userRole = access || "viewer";
        }

        // Cargar datos en paralelo
        const loadPromises = [
          roomsService.getPropertyRooms(propertyId),
          tenantsService.getPropertyTenants(propertyId).catch(() => []),
        ];

        // Solo cargar datos financieros si el usuario tiene permisos
        if (userRole !== "viewer") {
          loadPromises.push(
            financesService.getExpenses(propertyId).catch(() => []),
            financesService.getIncome(propertyId).catch(() => []),
          );
        }

        const results = await Promise.all(loadPromises);
        rooms = results[0] || [];
        tenants = results[1] || [];

        if (userRole !== "viewer") {
          expenses = results[2] || [];
          income = results[3] || [];
        }
      }
    } catch (err) {
      console.error("Error loading property data:", err);
      error = err.message || "Error al cargar la propiedad";
    } finally {
      loading = false;
    }
  }

  function handleEditSuccess() {
    showEditModal = false;
    loadAllData();
  }

  async function handleRoomSuccess() {
    showRoomModal = false;
    selectedRoom = null;
    // Solo recargar habitaciones, no todos los datos
    try {
      rooms = await roomsService.getPropertyRooms(propertyId);
    } catch (err) {
      console.error("Error reloading rooms:", err);
      // Si falla, recargar todo como fallback
      await loadAllData();
    }
  }

  async function handleTenantSuccess() {
    showTenantModal = false;
    selectedTenant = null;
    // Solo recargar inquilinos, no todos los datos
    try {
      tenants = await tenantsService.getPropertyTenants(propertyId);
    } catch (err) {
      console.error("Error reloading tenants:", err);
      // Si falla, recargar todo como fallback
      await loadAllData();
    }
  }

  async function handleExpenseSuccess() {
    showExpenseModal = false;
    selectedExpense = null;
    // Solo recargar gastos, no todos los datos
    try {
      expenses = await financesService.getExpenses(propertyId);
    } catch (err) {
      console.error("Error reloading expenses:", err);
      // Si falla, recargar todo como fallback
      await loadAllData();
    }
  }

  async function handleIncomeSuccess() {
    showIncomeModal = false;
    selectedIncome = null;
    // Solo recargar ingresos, no todos los datos
    try {
      income = await financesService.getIncome(propertyId);
    } catch (err) {
      console.error("Error reloading income:", err);
      // Si falla, recargar todo como fallback
      await loadAllData();
    }
  }

  async function handleDeleteExpense(expense) {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar este gasto de ${expense.amount}€?`,
      )
    ) {
      return;
    }

    try {
      await financesService.deleteExpense(expense.id);
      showToast("Gasto eliminado correctamente", "success");
      loadAllData();
    } catch (err) {
      showToast("Error al eliminar el gasto", "error");
      console.error(err);
    }
  }

  async function handleDeleteIncome(income) {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar este ingreso de ${income.amount}€?`,
      )
    ) {
      return;
    }

    try {
      await financesService.deleteIncome(income.id);
      showToast("Ingreso eliminado correctamente", "success");
      loadAllData();
    } catch (err) {
      showToast("Error al eliminar el ingreso", "error");
      console.error(err);
    }
  }

  async function handleTogglePaid(income) {
    try {
      if (income.paid) {
        await financesService.updateIncome(income.id, {
          paid: false,
          payment_date: null,
        });
      } else {
        await financesService.markAsPaid(income.id);
      }
      showToast(
        `Ingreso marcado como ${income.paid ? "pendiente" : "pagado"}`,
        "success",
      );
      loadAllData();
    } catch (err) {
      showToast("Error al actualizar el ingreso", "error");
      console.error(err);
    }
  }

  async function handleAutoRenew(e) {
    const { tenant } = e.detail;
    renewTenant = tenant;
    showRenewConfirm = true;
  }

  const canEdit = () => userRole === "owner" || userRole === "editor";
  const canInvite = () => userRole === "owner";

  // Variables reactivas para stats
  $: privateRooms = rooms.filter((r) => r.room_type !== "common");
  $: occupiedPrivateRooms = privateRooms.filter((r) => r.occupied);
  $: occupancyPercentage =
    privateRooms.length > 0
      ? Math.round((occupiedPrivateRooms.length / privateRooms.length) * 100)
      : 0;
  // Cálculo inline para que Svelte detecte 'rooms' como dependencia directa
  $: totalRevenue = occupiedPrivateRooms.reduce((sum, r) => {
    const rent = Number(r.monthly_rent);
    return sum + (isNaN(rent) ? 0 : rent);
  }, 0);
  $: potentialRevenue = privateRooms.reduce((sum, r) => {
    const rent = Number(r.monthly_rent);
    return sum + (isNaN(rent) ? 0 : rent);
  }, 0);
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"
      ></div>
      <p class="text-gray-600">Cargando propiedad...</p>
    </div>
  </div>
{:else if error}
  <GlassCard>
    <div class="text-center py-12">
      <div class="text-red-500 mb-4">❌</div>
      <h3 class="text-xl font-bold text-gray-700 mb-2">{error}</h3>
      <Button on:click={() => goto("/")}>Volver al Dashboard</Button>
    </div>
  </GlassCard>
{:else if property}
  <div
    class="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-4 md:px-6"
  >
    <!-- Header MEJORADO - Iconos más grandes, mejor layout -->
    <div
      class="bg-white/95 dark:!bg-gray-900/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200/50 dark:!border-gray-700/50"
    >
      <div class="flex items-center gap-3 sm:gap-4">
        <button
          on:click={() => goto("/")}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft size={24} class="text-gray-900 dark:!text-gray-300" />
        </button>
        <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div class="p-3 gradient-primary rounded-xl flex-shrink-0">
            <Home size={24} class="text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <h1
              class="text-lg sm:text-xl md:text-2xl font-bold gradient-text truncate mb-1"
            >
              {property.name}
            </h1>
            <div class="flex items-center text-gray-700 dark:!text-gray-300">
              <MapPin size={16} class="mr-1.5 flex-shrink-0" />
              <span class="text-sm sm:text-base truncate"
                >{property.address || "Sin dirección"}</span
              >
            </div>
          </div>
        </div>

        <div class="flex gap-2 flex-shrink-0">
          {#if canEdit()}
            <button
              on:click={() => (showEditModal = true)}
              class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Configuración"
            >
              <Settings size={24} class="text-gray-700 dark:!text-gray-300" />
            </button>
          {/if}
          {#if canInvite()}
            <button
              on:click={() => (showUserAccess = !showUserAccess)}
              class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Usuarios"
            >
              <UserPlus size={24} class="text-gray-700 dark:!text-gray-300" />
            </button>
          {/if}
        </div>
      </div>
      {#if property.description}
        <p
          class="text-gray-600 dark:text-gray-400 text-sm mt-3 ml-16 sm:ml-20 line-clamp-2"
        >
          {property.description}
        </p>
      {/if}
    </div>

    <!-- Gestión de Usuarios -->
    {#if showUserAccess && canInvite()}
      <UserAccessManager {propertyId} currentUserRole={userRole} />
    {/if}

    <!-- Stats Grid MEJORADO - Números grandes (40px), labels completos, contexto -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
      <!-- Stat 1: Habitaciones -->
      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex items-center gap-3">
          <div class="text-3xl sm:text-4xl flex-shrink-0">🛏️</div>
          <div class="flex-1 min-w-0">
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1"
            >
              Habitaciones
            </p>
            <p
              class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-none mb-1"
            >
              {occupiedPrivateRooms.length}
            </p>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              de {privateRooms.length} totales
            </p>
          </div>
        </div>
      </GlassCard>

      <!-- Stat 2: Ocupación -->
      <GlassCard hover={false} className="p-4 sm:p-6">
        <div class="flex items-center gap-3">
          <div class="text-3xl sm:text-4xl flex-shrink-0">📊</div>
          <div class="flex-1 min-w-0">
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1"
            >
              Ocupación
            </p>
            <p
              class="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600 dark:text-green-400 leading-none mb-2"
            >
              {occupancyPercentage}%
            </p>
            <div
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style="width: {occupancyPercentage}%"
              ></div>
            </div>
          </div>
        </div>
      </GlassCard>

      <!-- Stat 3: Ingresos (ocupa toda la fila) -->
      <GlassCard
        hover={false}
        className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800 col-span-2"
      >
        <div class="flex items-center gap-3">
          <div class="text-3xl sm:text-4xl flex-shrink-0">💰</div>
          <div class="flex-1 min-w-0">
            <p
              class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1"
            >
              Ingresos Mensuales
            </p>
            <p
              class="text-4xl sm:text-5xl md:text-6xl font-bold gradient-text leading-none mb-1"
            >
              {totalRevenue}€
            </p>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              de {potentialRevenue}€ potenciales
            </p>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Tabs Navigation - Solo visible en desktop (lg+), en mobile usa el BottomNav -->
    <div class="glass-card p-2 hidden lg:block">
      <div class="grid {canEdit() ? 'grid-cols-3' : 'grid-cols-2'} gap-2">
        <button
          on:click={() => goto(`/properties/${propertyId}`)}
          class="px-3 py-3 rounded-xl font-semibold transition-all min-h-[64px] flex flex-col items-center justify-center gap-1.5
            {activeTab === 'rooms'
            ? 'gradient-primary text-white shadow-lg shadow-orange-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60'}"
        >
          <DoorOpen size={20} />
          <span class="text-xs sm:text-sm">Habitaciones</span>
        </button>
        <button
          on:click={() => goto(`/properties/${propertyId}?tab=tenants`)}
          class="px-3 py-3 rounded-xl font-semibold transition-all min-h-[64px] flex flex-col items-center justify-center gap-1.5
            {activeTab === 'tenants'
            ? 'gradient-primary text-white shadow-lg shadow-orange-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60'}"
        >
          <Users size={20} />
          <span class="text-xs sm:text-sm">Inquilinos</span>
        </button>
        {#if canEdit()}
          <button
            on:click={() => goto(`/properties/${propertyId}?tab=finances`)}
            class="px-3 py-3 rounded-xl font-semibold transition-all min-h-[64px] flex flex-col items-center justify-center gap-1.5
              {activeTab === 'finances'
              ? 'gradient-primary text-white shadow-lg shadow-orange-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60'}"
          >
            <Receipt size={20} />
            <span class="text-xs sm:text-sm">Finanzas</span>
          </button>
        {/if}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-transition">
      <!-- Tab: Habitaciones -->
      {#if activeTab === "rooms"}
        <div class="space-y-4 animate-fade-in">
          <!-- SECCIÓN: HABITACIONES -->
          <div>
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4"
            >
              <h2
                class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2"
              >
                <DoorOpen size={20} class="sm:w-6 sm:h-6" />
                Habitaciones
              </h2>
            </div>

            <!-- Botón Nueva Habitación MEJORADO - Gradiente naranja, icono+texto+flecha -->
            {#if canEdit()}
              <button
                on:click={() => {
                  selectedRoom = null;
                  showRoomModal = true;
                }}
                class="w-full mb-4 sm:mb-6 flex items-center gap-3 min-h-[64px] px-4 sm:px-6 py-4 gradient-primary text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div
                  class="flex items-center justify-center bg-white/20 rounded-xl p-2.5"
                >
                  <PlusCircle size={24} />
                </div>
                <span class="flex-1 text-left">Nueva Habitación</span>
                <ChevronRight size={20} class="opacity-70" />
              </button>
            {/if}

            {#if rooms.length > 0}
              {@const privateRooms = rooms.filter(
                (r) => r.room_type !== "common",
              )}
              {@const commonRooms = rooms.filter(
                (r) => r.room_type === "common",
              )}
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              >
                <!-- Primero las habitaciones privadas (más movimiento) -->
                {#each privateRooms as room (room.id)}
                  <RoomCard
                    {room}
                    {propertyId}
                    allRooms={rooms}
                    showQuickActions={canEdit()}
                    on:changed={loadAllData}
                  />
                {/each}
                <!-- Luego las zonas comunes (al final) -->
                {#each commonRooms as room (room.id)}
                  <RoomCard
                    {room}
                    {propertyId}
                    allRooms={rooms}
                    showQuickActions={canEdit()}
                    on:changed={loadAllData}
                  />
                {/each}
              </div>
            {:else}
              <GlassCard>
                <div class="text-center py-12">
                  <DoorOpen size={48} class="mx-auto text-gray-400 mb-4" />
                  <h3
                    class="text-lg font-bold text-gray-900 dark:text-gray-300 mb-2"
                  >
                    No hay habitaciones aún
                  </h3>
                  <p class="text-gray-800 dark:text-gray-400 mb-6 text-sm">
                    Comienza agregando habitaciones a esta propiedad
                  </p>
                  {#if canEdit()}
                    <Button
                      on:click={() => {
                        selectedRoom = null;
                        showRoomModal = true;
                      }}
                      className="text-sm"
                    >
                      Agregar Habitación
                    </Button>
                  {/if}
                </div>
              </GlassCard>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Tab: Inquilinos -->
      {#if activeTab === "tenants"}
        <div class="space-y-4 animate-fade-in">
          <!-- SECCIÓN: INQUILINOS -->
          <div>
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4"
            >
              <h2
                class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2"
              >
                <Users size={20} class="sm:w-6 sm:h-6" />
                Inquilinos
              </h2>
              {#if canEdit()}
                <Button
                  on:click={() => {
                    selectedTenant = null;
                    showTenantModal = true;
                  }}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Plus
                    size={16}
                    class="sm:w-[18px] sm:h-[18px] inline mr-1 sm:mr-1.5"
                  />
                  Nuevo Inquilino
                </Button>
              {/if}
            </div>

            {#if tenants.length > 0}
              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {#each tenants as tenant (tenant.id)}
                  {@const tenantRoom = rooms.find(
                    (r) => r.tenant_id === tenant.id,
                  )}
                  <TenantCard
                    {tenant}
                    {property}
                    room={tenantRoom}
                    {propertyId}
                    on:generate-contract={(e) => {
                      contractTenant = e.detail.tenant;
                      contractRoom = e.detail.room || tenantRoom;
                      isRenewalContract = e.detail.isRenewal || false;
                      showContractModal = true;
                    }}
                    on:auto-renew={handleAutoRenew}
                    on:edit={(e) => {
                      selectedTenantForEdit = e.detail.tenant;
                      showEditTenantModal = true;
                    }}
                  />
                {/each}
              </div>
            {:else}
              <GlassCard>
                <div class="text-center py-12">
                  <Users size={48} class="mx-auto text-gray-400 mb-4" />
                  <h3
                    class="text-lg font-bold text-gray-900 dark:text-gray-300 mb-2"
                  >
                    No hay inquilinos aún
                  </h3>
                  <p class="text-gray-800 dark:text-gray-400 mb-6 text-sm">
                    Agrega inquilinos para gestionar tus contratos
                  </p>
                  {#if canEdit()}
                    <Button
                      on:click={() => {
                        selectedTenant = null;
                        showTenantModal = true;
                      }}
                      className="text-sm"
                    >
                      Agregar Inquilino
                    </Button>
                  {/if}
                </div>
              </GlassCard>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Tab: Finanzas -->
      {#if activeTab === "finances" && canEdit()}
        <div class="space-y-4 animate-fade-in">
          <!-- SECCIÓN: GASTOS E INGRESOS -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2
                class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"
              >
                <Receipt size={24} />
                Gastos e Ingresos
              </h2>
              <div class="flex gap-2">
                <Button
                  variant="secondary"
                  on:click={() => {
                    selectedExpense = null;
                    showExpenseModal = true;
                  }}
                  className="text-sm"
                >
                  <Plus size={18} class="inline mr-1.5" />
                  Gasto
                </Button>
                <Button
                  on:click={() => {
                    selectedIncome = null;
                    showIncomeModal = true;
                  }}
                  className="text-sm"
                >
                  <Plus size={18} class="inline mr-1.5" />
                  Ingreso
                </Button>
              </div>
            </div>

            <!-- Resumen financiero -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <GlassCard hover={false}>
                <div class="text-center">
                  <p class="text-sm text-gray-900 dark:text-gray-400 mb-1">
                    Total Ingresos
                  </p>
                  <p
                    class="text-2xl font-bold text-green-600 dark:text-green-400"
                  >
                    {income
                      .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
                      .toFixed(2)}€
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {income.filter((i) => i.paid).length}/{income.length} pagados
                  </p>
                </div>
              </GlassCard>
              <GlassCard hover={false}>
                <div class="text-center">
                  <p class="text-sm text-gray-900 dark:text-gray-400 mb-1">
                    Total Gastos
                  </p>
                  <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                    {expenses
                      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                      .toFixed(2)}€
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {expenses.length} registros
                  </p>
                </div>
              </GlassCard>
              <GlassCard hover={false}>
                <div class="text-center">
                  <p class="text-sm text-gray-900 dark:text-gray-400 mb-1">
                    Balance
                  </p>
                  <p
                    class="text-2xl font-bold {income.reduce(
                      (sum, i) => sum + parseFloat(i.amount || 0),
                      0,
                    ) -
                      expenses.reduce(
                        (sum, e) => sum + parseFloat(e.amount || 0),
                        0,
                      ) >=
                    0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'}"
                  >
                    {(
                      income.reduce(
                        (sum, i) => sum + parseFloat(i.amount || 0),
                        0,
                      ) -
                      expenses.reduce(
                        (sum, e) => sum + parseFloat(e.amount || 0),
                        0,
                      )
                    ).toFixed(2)}€
                  </p>
                  <p class="text-xs text-gray-500 mt-1">Ingresos - Gastos</p>
                </div>
              </GlassCard>
            </div>

            <!-- Ingresos -->
            <div class="mb-6">
              <h3
                class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"
              >
                <TrendingUp size={20} />
                Ingresos ({income.length})
              </h3>
              {#if income.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {#each income as item (item.id)}
                    <IncomeCard
                      income={item}
                      onEdit={(item) => {
                        selectedIncome = item;
                        showIncomeModal = true;
                      }}
                      onDelete={handleDeleteIncome}
                      onTogglePaid={handleTogglePaid}
                    />
                  {/each}
                </div>
              {:else}
                <GlassCard>
                  <div class="text-center py-8">
                    <TrendingUp size={48} class="mx-auto text-gray-400 mb-4" />
                    <p class="text-gray-800 dark:text-gray-400 text-sm">
                      No hay ingresos registrados aún
                    </p>
                  </div>
                </GlassCard>
              {/if}
            </div>

            <!-- Gastos -->
            <div>
              <h3
                class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"
              >
                <Receipt size={20} />
                Gastos ({expenses.length})
              </h3>
              {#if expenses.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {#each expenses as expense (expense.id)}
                    <ExpenseCard
                      {expense}
                      onEdit={(expense) => {
                        selectedExpense = expense;
                        showExpenseModal = true;
                      }}
                      onDelete={handleDeleteExpense}
                    />
                  {/each}
                </div>
              {:else}
                <GlassCard>
                  <div class="text-center py-8">
                    <Receipt size={48} class="mx-auto text-gray-400 mb-4" />
                    <p class="text-gray-800 dark:text-gray-400 text-sm">
                      No hay gastos registrados aún
                    </p>
                  </div>
                </GlassCard>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Modales -->
  <Modal bind:open={showEditModal} title="Editar Propiedad">
    <PropertyForm
      {property}
      on:success={handleEditSuccess}
      on:cancel={() => (showEditModal = false)}
    />
  </Modal>

  <Modal
    bind:open={showRoomModal}
    title={selectedRoom ? "Editar Habitación" : "Nueva Habitación"}
    size="xl"
  >
    <RoomForm
      {propertyId}
      room={selectedRoom}
      on:success={handleRoomSuccess}
      on:cancel={() => {
        showRoomModal = false;
        selectedRoom = null;
      }}
    />
  </Modal>

  <Modal
    bind:open={showTenantModal}
    title={selectedTenant ? "Editar Inquilino" : "Nuevo Inquilino"}
    size="xl"
  >
    <TenantForm
      {propertyId}
      tenant={selectedTenant}
      on:success={handleTenantSuccess}
      on:cancel={() => {
        showTenantModal = false;
        selectedTenant = null;
      }}
    />
  </Modal>

  <Modal
    bind:open={showExpenseModal}
    title={selectedExpense ? "Editar Gasto" : "Nuevo Gasto"}
    size="lg"
  >
    <ExpenseForm
      {propertyId}
      expense={selectedExpense}
      on:success={handleExpenseSuccess}
      on:cancel={() => {
        showExpenseModal = false;
        selectedExpense = null;
      }}
    />
  </Modal>

  <Modal
    bind:open={showIncomeModal}
    title={selectedIncome ? "Editar Ingreso" : "Nuevo Ingreso"}
    size="lg"
  >
    <IncomeForm
      {propertyId}
      income={selectedIncome}
      on:success={handleIncomeSuccess}
      on:cancel={() => {
        showIncomeModal = false;
        selectedIncome = null;
      }}
    />
  </Modal>

  <!-- Modal Generar Contrato -->
  <GenerateContractModal
    bind:open={showContractModal}
    tenant={contractTenant}
    {property}
    room={contractRoom}
    isRenewal={isRenewalContract}
  />

  <!-- Modal Editar Inquilino -->
  <EditTenantModal
    bind:open={showEditTenantModal}
    tenant={selectedTenantForEdit}
    {propertyId}
    on:success={() => {
      showEditTenantModal = false;
      selectedTenantForEdit = null;
      loadAllData();
    }}
  />
{/if}

<!-- Modal Renovar Contrato -->
<RenewContractModal
  bind:open={showRenewConfirm}
  tenant={renewTenant}
  on:success={() => {
    showRenewConfirm = false;
    renewTenant = null;
    loadAllData();
  }}
/>
