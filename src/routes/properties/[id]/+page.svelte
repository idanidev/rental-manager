<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Home, MapPin, Users, TrendingUp, Settings, UserPlus, 
    DoorOpen, Euro, BarChart3, Receipt, User
  } from 'lucide-svelte';
  import { propertiesService } from '$lib/services/properties';
  import { userStore } from '$lib/stores/user';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RoomCard from '$lib/components/rooms/RoomCard.svelte';
  import UserAccessManager from '$lib/components/properties/UserAccessManager.svelte';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { permissionsService } from '$lib/services/permissions';
  
  let property = null;
  let loading = true;
  let error = '';
  let showEditModal = false;
  let userRole = 'viewer';
  let showUserAccess = false;
  
  $: propertyId = $page.params.id;
  
  onMount(async () => {
    await loadProperty();
  });
  
  async function loadProperty() {
    loading = true;
    error = '';
    
    try {
      property = await propertiesService.getProperty(propertyId);
      
      if (property) {
        // Obtener el rol del usuario actual
        const access = await permissionsService.checkPermission(propertyId, $userStore?.id);
        userRole = access || 'viewer';
      }
    } catch (err) {
      error = err.message || 'Error al cargar la propiedad';
    } finally {
      loading = false;
    }
  }
  
  function handleEditSuccess() {
    showEditModal = false;
    loadProperty();
  }
  
  const canEdit = () => userRole === 'owner' || userRole === 'editor';
  const canInvite = () => userRole === 'owner';
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
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
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-3 gradient-primary rounded-xl">
            <Home size={28} class="text-white" />
          </div>
          <div>
            <h1 class="text-3xl font-bold gradient-text">{property.name}</h1>
            <div class="flex items-center text-gray-600 mt-1">
              <MapPin size={16} class="mr-1" />
              {property.address}
            </div>
          </div>
        </div>
        {#if property.description}
          <p class="text-gray-600 ml-16">{property.description}</p>
        {/if}
      </div>
      
      <div class="flex gap-2">
        {#if canEdit()}
          <Button variant="secondary" on:click={() => showEditModal = true}>
            <Settings size={20} class="inline mr-2" />
            Editar
          </Button>
        {/if}
        {#if canInvite()}
          <Button variant="secondary" on:click={() => showUserAccess = !showUserAccess}>
            <UserPlus size={20} class="inline mr-2" />
            {showUserAccess ? 'Ocultar' : 'Gestionar'} Usuarios
          </Button>
        {/if}
      </div>
    </div>
    
    <!-- Rol Badge -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">Tu rol:</span>
      <span class="px-3 py-1 rounded-full text-xs font-semibold
        {userRole === 'owner' ? 'bg-purple-100 text-purple-700' : 
         userRole === 'editor' ? 'bg-blue-100 text-blue-700' : 
         'bg-gray-100 text-gray-700'}">
        {userRole === 'owner' ? 'Propietario' : userRole === 'editor' ? 'Editor' : 'Visor'}
      </span>
    </div>
    
    <!-- Gestión de Usuarios -->
    {#if showUserAccess && canInvite()}
      <UserAccessManager {propertyId} currentUserRole={userRole} />
    {/if}
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <GlassCard hover={false}>
        <div class="flex items-center gap-3">
          <div class="p-3 gradient-primary rounded-xl">
            <DoorOpen size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Habitaciones</p>
            <p class="text-2xl font-bold gradient-text">
              {property.rooms?.length || 0}
            </p>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
            <Users size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Ocupadas</p>
            <p class="text-2xl font-bold gradient-text">
              {property.rooms?.filter(r => r.occupied).length || 0}
            </p>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
            <TrendingUp size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Ocupación</p>
            <p class="text-2xl font-bold gradient-text">
              {property.rooms?.length > 0 
                ? ((property.rooms.filter(r => r.occupied).length / property.rooms.length) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
            <Euro size={24} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Ingresos Mes</p>
            <p class="text-2xl font-bold gradient-text">
              {property.rooms?.filter(r => r.occupied).reduce((sum, r) => sum + (r.monthly_rent || 0), 0) || 0}€
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
    
    <!-- Action Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a href="/properties/{propertyId}/rooms" class="block">
        <GlassCard className="h-full">
          <div class="text-center py-6">
            <div class="p-4 gradient-primary rounded-xl inline-block mb-3">
              <DoorOpen size={32} class="text-white" />
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Gestionar Habitaciones</h3>
            <p class="text-sm text-gray-600">Administra habitaciones, inquilinos y rentas</p>
          </div>
        </GlassCard>
      </a>
      
      <a href="/properties/{propertyId}/expenses" class="block">
        <GlassCard className="h-full">
          <div class="text-center py-6">
            <div class="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl inline-block mb-3">
              <Receipt size={32} class="text-white" />
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Gastos e Ingresos</h3>
            <p class="text-sm text-gray-600">Registra y consulta transacciones</p>
          </div>
        </GlassCard>
      </a>
      
      <a href="/properties/{propertyId}/analytics" class="block">
        <GlassCard className="h-full">
          <div class="text-center py-6">
            <div class="p-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl inline-block mb-3">
              <BarChart3 size={32} class="text-white" />
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Análisis y Reportes</h3>
            <p class="text-sm text-gray-600">Visualiza rentabilidad y tendencias</p>
          </div>
        </GlassCard>
      </a>
    </div>
    
    <!-- Habitaciones Preview -->
    {#if property.rooms?.length > 0}
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Habitaciones</h2>
          <a href="/properties/{propertyId}/rooms">
            <Button variant="secondary">Ver todas</Button>
          </a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each property.rooms.slice(0, 6) as room (room.id)}
            <RoomCard {room} onClick={() => goto(`/properties/${propertyId}/rooms`)} />
          {/each}
        </div>
      </div>
    {:else}
      <GlassCard>
        <div class="text-center py-12">
          <DoorOpen size={48} class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-xl font-bold text-gray-700 mb-2">
            No hay habitaciones aún
          </h3>
          <p class="text-gray-600 mb-6">
            Comienza agregando habitaciones a esta propiedad
          </p>
          {#if canEdit()}
            <Button on:click={() => goto(`/properties/${propertyId}/rooms`)}>
              Agregar Habitación
            </Button>
          {/if}
        </div>
      </GlassCard>
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
{/if}

