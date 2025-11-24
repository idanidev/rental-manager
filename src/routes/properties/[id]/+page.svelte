<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Home, MapPin, Users, TrendingUp, Settings, UserPlus, ArrowLeft,
    DoorOpen, Euro, Receipt, Plus, Edit, Trash2
  } from 'lucide-svelte';
  import { propertiesService } from '$lib/services/properties';
  import { roomsService } from '$lib/services/rooms';
  import { tenantsService } from '$lib/services/tenants';
  import { financesService } from '$lib/services/finances';
  import { userStore } from '$lib/stores/user';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RoomCard from '$lib/components/rooms/RoomCard.svelte';
  import RoomForm from '$lib/components/rooms/RoomForm.svelte';
  import TenantCard from '$lib/components/tenants/TenantCard.svelte';
  import TenantForm from '$lib/components/tenants/TenantForm.svelte';
  import UserAccessManager from '$lib/components/properties/UserAccessManager.svelte';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { permissionsService } from '$lib/services/permissions';
  
  let property = null;
  let rooms = [];
  let tenants = [];
  let expenses = [];
  let income = [];
  let loading = true;
  let error = '';
  let showEditModal = false;
  let showRoomModal = false;
  let showTenantModal = false;
  let showUserAccess = false;
  let selectedRoom = null;
  let selectedTenant = null;
  let userRole = 'viewer';
  
  $: propertyId = $page.params.id;
  
  onMount(async () => {
    await loadAllData();
  });
  
  async function loadAllData() {
    loading = true;
    error = '';
    
    try {
      // Cargar propiedad primero
      property = await propertiesService.getProperty(propertyId);
      
      if (property) {
        // Obtener rol del usuario
        const access = await permissionsService.checkPermission(propertyId, $userStore?.id);
        userRole = access || 'viewer';
        
        // Cargar datos en paralelo
        const loadPromises = [
          roomsService.getPropertyRooms(propertyId),
          tenantsService.getPropertyTenants(propertyId).catch(() => [])
        ];
        
        // Solo cargar datos financieros si el usuario tiene permisos
        if (userRole !== 'viewer') {
          loadPromises.push(
            financesService.getExpenses(propertyId).catch(() => []),
            financesService.getIncome(propertyId).catch(() => [])
          );
        }
        
        const results = await Promise.all(loadPromises);
        rooms = results[0] || [];
        tenants = results[1] || [];
        
        if (userRole !== 'viewer') {
          expenses = results[2] || [];
          income = results[3] || [];
        }
      }
    } catch (err) {
      console.error('Error loading property data:', err);
      error = err.message || 'Error al cargar la propiedad';
    } finally {
      loading = false;
    }
  }
  
  function handleEditSuccess() {
    showEditModal = false;
    loadAllData();
  }
  
  function handleRoomSuccess() {
    showRoomModal = false;
    selectedRoom = null;
    loadAllData();
  }
  
  function handleTenantSuccess() {
    showTenantModal = false;
    selectedTenant = null;
    loadAllData();
  }
  
  const canEdit = () => userRole === 'owner' || userRole === 'editor';
  const canInvite = () => userRole === 'owner';
  
  function calculateMonthlyRevenue() {
    return rooms
      .filter(r => r.occupied)
      .reduce((sum, r) => sum + (parseFloat(r.monthly_rent) || 0), 0);
  }
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando propiedad...</p>
    </div>
  </div>
{:else if error}
  <GlassCard>
    <div class="text-center py-12">
      <div class="text-red-500 mb-4">❌</div>
      <h3 class="text-xl font-bold text-gray-700 mb-2">{error}</h3>
      <Button on:click={() => goto('/')}>Volver al Dashboard</Button>
    </div>
  </GlassCard>
{:else if property}
  <div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
    <!-- Header con botón volver -->
    <div class="flex items-center gap-4">
      <button
        on:click={() => goto('/')}
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        aria-label="Volver"
      >
        <ArrowLeft size={20} class="text-gray-600 dark:text-gray-400" />
      </button>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <div class="p-3 gradient-primary rounded-xl">
            <Home size={28} class="text-white" />
          </div>
          <div class="flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold gradient-text">{property.name}</h1>
            <div class="flex items-center text-gray-600 dark:text-gray-400 mt-1 text-sm">
              <MapPin size={16} class="mr-1" />
              {property.address}
            </div>
          </div>
        </div>
        {#if property.description}
          <p class="text-gray-600 dark:text-gray-400 ml-16 text-sm">{property.description}</p>
        {/if}
      </div>
      
      <div class="flex gap-2 flex-shrink-0">
        {#if canEdit()}
          <Button variant="secondary" on:click={() => showEditModal = true} className="text-sm">
            <Settings size={18} class="inline mr-1.5" />
            <span class="hidden sm:inline">Editar</span>
          </Button>
        {/if}
        {#if canInvite()}
          <Button variant="secondary" on:click={() => showUserAccess = !showUserAccess} className="text-sm">
            <UserPlus size={18} class="inline mr-1.5" />
            <span class="hidden sm:inline">Usuarios</span>
          </Button>
        {/if}
      </div>
    </div>
    
    <!-- Gestión de Usuarios -->
    {#if showUserAccess && canInvite()}
      <UserAccessManager {propertyId} currentUserRole={userRole} />
    {/if}
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-4 gap-1 sm:gap-1.5 md:gap-2">
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="flex flex-col items-center text-center p-1.5 sm:p-2">
          <div class="p-1 sm:p-1.5 gradient-primary rounded-md sm:rounded-lg mb-1">
            <DoorOpen size={10} class="text-white sm:w-3 sm:h-3" />
          </div>
          <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Habs</p>
          <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">
            {rooms.length}
          </p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="flex flex-col items-center text-center p-1.5 sm:p-2">
          <div class="p-1 sm:p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md sm:rounded-lg mb-1">
            <Users size={10} class="text-white sm:w-3 sm:h-3" />
          </div>
          <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Ocup</p>
          <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">
            {rooms.filter(r => r.occupied).length}
          </p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="flex flex-col items-center text-center p-1.5 sm:p-2">
          <div class="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md sm:rounded-lg mb-1">
            <TrendingUp size={10} class="text-white sm:w-3 sm:h-3" />
          </div>
          <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">%</p>
          <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-none">
            {rooms.length > 0 
              ? Math.round((rooms.filter(r => r.occupied).length / rooms.length) * 100)
              : 0}%
          </p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false} className="p-0 rounded-xl sm:rounded-2xl">
        <div class="flex flex-col items-center text-center p-1.5 sm:p-2">
          <div class="p-1 sm:p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-md sm:rounded-lg mb-1">
            <Euro size={10} class="text-white sm:w-3 sm:h-3" />
          </div>
          <p class="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium leading-none mb-0.5">Ing</p>
          <p class="text-base sm:text-lg md:text-xl font-bold gradient-text leading-tight">
            {calculateMonthlyRevenue()}€
          </p>
        </div>
      </GlassCard>
    </div>
    
    <!-- SECCIÓN: HABITACIONES -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <DoorOpen size={24} />
          Habitaciones
        </h2>
        {#if canEdit()}
          <Button on:click={() => { selectedRoom = null; showRoomModal = true; }} className="text-sm">
            <Plus size={18} class="inline mr-1.5" />
            Nueva Habitación
          </Button>
        {/if}
      </div>
      
      {#if rooms.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {#each rooms as room (room.id)}
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
            <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              No hay habitaciones aún
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Comienza agregando habitaciones a esta propiedad
            </p>
            {#if canEdit()}
              <Button on:click={() => { selectedRoom = null; showRoomModal = true; }} className="text-sm">
                Agregar Habitación
              </Button>
            {/if}
          </div>
        </GlassCard>
      {/if}
    </div>
    
    <!-- SECCIÓN: INQUILINOS -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Users size={24} />
          Inquilinos
        </h2>
        {#if canEdit()}
          <Button on:click={() => { selectedTenant = null; showTenantModal = true; }} className="text-sm">
            <Plus size={18} class="inline mr-1.5" />
            Nuevo Inquilino
          </Button>
        {/if}
      </div>
      
      {#if tenants.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {#each tenants as tenant (tenant.id)}
            <TenantCard {tenant} />
          {/each}
        </div>
      {:else}
        <GlassCard>
          <div class="text-center py-12">
            <Users size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              No hay inquilinos aún
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Agrega inquilinos para gestionar tus contratos
            </p>
            {#if canEdit()}
              <Button on:click={() => { selectedTenant = null; showTenantModal = true; }} className="text-sm">
                Agregar Inquilino
              </Button>
            {/if}
          </div>
        </GlassCard>
      {/if}
    </div>
    
    <!-- SECCIÓN: GASTOS E INGRESOS (Solo si tiene permisos) -->
    {#if canEdit()}
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Receipt size={24} />
            Gastos e Ingresos
          </h2>
        </div>
        
        <GlassCard>
          <div class="p-6 text-center">
            <Receipt size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              Gestión financiera
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Próximamente: Podrás gestionar gastos e ingresos desde aquí
            </p>
          </div>
        </GlassCard>
      </div>
    {/if}
  </div>
  
  <!-- Modales -->
  <Modal bind:open={showEditModal} title="Editar Propiedad">
    <PropertyForm 
      {property}
      on:success={handleEditSuccess}
      on:cancel={() => showEditModal = false}
    />
  </Modal>
  
  <Modal bind:open={showRoomModal} title={selectedRoom ? 'Editar Habitación' : 'Nueva Habitación'} size="xl">
    <RoomForm 
      {propertyId}
      room={selectedRoom}
      on:success={handleRoomSuccess}
      on:cancel={() => { showRoomModal = false; selectedRoom = null; }}
    />
  </Modal>
  
  <Modal bind:open={showTenantModal} title={selectedTenant ? 'Editar Inquilino' : 'Nuevo Inquilino'} size="xl">
    <TenantForm 
      {propertyId}
      tenant={selectedTenant}
      on:success={handleTenantSuccess}
      on:cancel={() => { showTenantModal = false; selectedTenant = null; }}
    />
  </Modal>
{/if}
