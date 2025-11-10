<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DoorOpen, Plus, Trash2, Edit, ArrowLeft, AlertCircle } from 'lucide-svelte';
  import { roomsService } from '$lib/services/rooms';
  import { propertiesService } from '$lib/services/properties';
  import { userStore } from '$lib/stores/user';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import RoomCard from '$lib/components/rooms/RoomCard.svelte';
  import RoomForm from '$lib/components/rooms/RoomForm.svelte';
  import RoomDetailsModal from '$lib/components/rooms/RoomDetailsModal.svelte';
  
  let property = null;
  let rooms = [];
  let loading = true;
  let error = '';
  let showCreateModal = false;
  let showEditModal = false;
  let showDetailsModal = false;
  let selectedRoom = null;
  let userRole = 'viewer';
  
  $: propertyId = $page.params.id;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = '';
    
    try {
      property = await propertiesService.getProperty(propertyId);
      rooms = await roomsService.getPropertyRooms(propertyId);
      
      if (property) {
        userRole = property.property_access?.find(a => a.user_id === $userStore?.id)?.role || 'viewer';
      }
    } catch (err) {
      error = err.message || 'Error al cargar habitaciones';
    } finally {
      loading = false;
    }
  }
  
  function handleCreateSuccess() {
    showCreateModal = false;
    loadData();
  }
  
  function handleEditSuccess() {
    showEditModal = false;
    selectedRoom = null;
    loadData();
  }
  
  function openEditModal(room) {
    selectedRoom = room;
    showEditModal = true;
  }
  
  function openDetailsModal(room) {
    selectedRoom = room;
    showDetailsModal = true;
  }
  
  async function handleDelete(room) {
    if (!confirm(`¿Estás seguro de eliminar la habitación "${room.name}"?`)) {
      return;
    }
    
    try {
      await roomsService.deleteRoom(room.id);
      await loadData();
    } catch (err) {
      alert('Error al eliminar la habitación: ' + err.message);
    }
  }
  
  async function toggleOccupancy(room) {
    try {
      await roomsService.toggleOccupancy(room.id, !room.occupied);
      await loadData();
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    }
  }
  
  const canEdit = () => userRole === 'owner' || userRole === 'editor';
</script>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <button 
        on:click={() => goto(`/properties/${propertyId}`)}
        class="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-2 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver a la propiedad</span>
      </button>
      <h1 class="text-3xl font-bold gradient-text">
        Gestión de Habitaciones
      </h1>
      <p class="text-gray-600 mt-1">
        {property?.name || 'Cargando...'}
      </p>
    </div>
    
    {#if canEdit()}
      <Button on:click={() => showCreateModal = true}>
        <Plus size={20} class="inline mr-2" />
        Nueva Habitación
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando habitaciones...</p>
      </div>
    </div>
  {:else if error}
    <GlassCard>
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">❌</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">{error}</h3>
        <Button on:click={loadData}>Reintentar</Button>
      </div>
    </GlassCard>
  {:else if rooms.length > 0}
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <GlassCard hover={false}>
        <div class="stat-card">
          <p class="stat-label">Total Habitaciones</p>
          <p class="stat-value">{rooms.length}</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <p class="stat-label">Ocupadas</p>
          <p class="stat-value">{rooms.filter(r => r.occupied).length}</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <p class="stat-label">Disponibles</p>
          <p class="stat-value">{rooms.filter(r => !r.occupied).length}</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <p class="stat-label">Ingresos Mensuales</p>
          <p class="stat-value">
            {rooms.filter(r => r.occupied).reduce((sum, r) => sum + (r.monthly_rent || 0), 0)}€
          </p>
        </div>
      </GlassCard>
    </div>

    <!-- Habitaciones -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each rooms as room (room.id)}
        <GlassCard>
          <div class="space-y-4">
            <button 
              on:click={() => openDetailsModal(room)}
              class="w-full text-left"
            >
              <RoomCard {room} />
            </button>
            
            <div class="flex gap-2 pt-3 border-t border-gray-200">
              <Button 
                variant="secondary" 
                className="flex-1 text-sm"
                on:click={() => openDetailsModal(room)}
              >
                Ver Detalles
              </Button>
              
              {#if canEdit()}
                <Button 
                  variant="secondary" 
                  className="flex-1 text-sm"
                  on:click={() => toggleOccupancy(room)}
                >
                  {room.occupied ? 'Marcar Disponible' : 'Marcar Ocupada'}
                </Button>
                <Button 
                  variant="ghost" 
                  className="p-2"
                  on:click={() => openEditModal(room)}
                >
                  <Edit size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  className="p-2 text-red-600 hover:bg-red-50"
                  on:click={() => handleDelete(room)}
                >
                  <Trash2 size={18} />
                </Button>
              {/if}
            </div>
          </div>
        </GlassCard>
      {/each}
    </div>
  {:else}
    <GlassCard>
      <div class="text-center py-12">
        <AlertCircle size={48} class="mx-auto text-gray-400 mb-4" />
        <h3 class="text-xl font-bold text-gray-700 mb-2">
          No hay habitaciones aún
        </h3>
        <p class="text-gray-600 mb-6">
          Comienza agregando la primera habitación a esta propiedad
        </p>
        {#if canEdit()}
          <Button on:click={() => showCreateModal = true}>
            <Plus size={20} class="inline mr-2" />
            Agregar Primera Habitación
          </Button>
        {/if}
      </div>
    </GlassCard>
  {/if}
</div>

<!-- Modales -->
<Modal bind:open={showCreateModal} title="Nueva Habitación" size="xl">
  <RoomForm 
    {propertyId}
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>

<Modal bind:open={showEditModal} title="Editar Habitación" size="xl">
  <RoomForm 
    {propertyId}
    room={selectedRoom}
    on:success={handleEditSuccess}
    on:cancel={() => { showEditModal = false; selectedRoom = null; }}
  />
</Modal>

<!-- Modal Detalles -->
<RoomDetailsModal 
  bind:open={showDetailsModal}
  room={selectedRoom}
/>

