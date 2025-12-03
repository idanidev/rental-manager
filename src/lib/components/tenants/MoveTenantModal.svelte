<script>
  import { ArrowRight, DoorOpen, AlertCircle } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { roomsService } from '$lib/services/rooms';
  import { propertiesStore } from '$lib/stores/properties';
  import { createEventDispatcher } from 'svelte';
  
  /** @typedef {import('$lib/types').Tenant} Tenant */
  /** @typedef {import('$lib/types').Room} Room */
  
  export let open = false;
  /** @type {Tenant | null} */
  export let tenant;
  /** @type {Room | null} */
  export let currentRoom;
  /** @type {Room[]} */
  export let allRooms = [];
  /** @type {string | null} */
  export let propertyId = null;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let selectedRoomId = '';
  let availableRooms = [];
  let showAllProperties = false;
  
  // Obtener todas las habitaciones de todas las propiedades si showAllProperties está activo
  $: allAvailableRooms = showAllProperties 
    ? $propertiesStore.flatMap(p => (p.rooms || []).map(r => ({ 
        ...r, 
        propertyName: p.name,
        property_id: p.id 
      })))
    : allRooms.map(r => ({ 
        ...r, 
        propertyName: null,
        property_id: propertyId 
      }));
  
  // Filtrar habitaciones privadas disponibles (excluyendo la actual)
  $: availableRooms = allAvailableRooms.filter(r => 
    r.room_type !== 'common' && 
    !r.occupied && 
    r.id !== currentRoom?.id
  );
  
  // Reset cuando se abre el modal
  $: if (open) {
    selectedRoomId = '';
    error = '';
    showAllProperties = false;
  }
  
  async function handleMove() {
    if (!selectedRoomId) {
      error = 'Por favor selecciona una habitación';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Liberar habitación actual
      if (currentRoom) {
        await roomsService.updateRoom(currentRoom.id, {
          tenant_id: null,
          occupied: false
        });
      }
      
      // Asignar a nueva habitación
      await roomsService.updateRoom(selectedRoomId, {
        tenant_id: tenant.id,
        occupied: true
      });
      
      dispatch('success');
      open = false;
      selectedRoomId = '';
    } catch (err) {
      error = err.message || 'Error al mover el inquilino';
    } finally {
      loading = false;
    }
  }
  
  function cancel() {
    open = false;
    error = '';
    selectedRoomId = '';
  }
</script>

{#if tenant}
<Modal bind:open title="Mover Inquilino" size="md">
  <div class="space-y-4">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}
    
    <!-- Info del inquilino y habitación actual -->
    <div class="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border border-orange-200/50 rounded-2xl p-5">
      <div class="flex items-center justify-center gap-4">
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-2 font-medium">Origen</p>
          <div class="bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-xl shadow-sm">
            <p class="text-sm font-bold text-gray-800">{currentRoom?.name || 'Sin habitación'}</p>
          </div>
        </div>
        
        <ArrowRight size={24} class="text-orange-500 flex-shrink-0" />
        
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-2 font-medium">Destino</p>
          <div class="bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-xl shadow-sm">
            {#if selectedRoomId}
              {@const selectedRoom = availableRooms.find(r => r.id === selectedRoomId)}
              <p class="text-sm font-bold gradient-text">{selectedRoom?.name || '¿?'}</p>
              {#if selectedRoom?.propertyName}
                <p class="text-xs text-orange-600 mt-1">📍 {selectedRoom.propertyName}</p>
              {/if}
            {:else}
              <p class="text-sm font-bold gradient-text">¿?</p>
            {/if}
          </div>
        </div>
      </div>
      
      <div class="text-center mt-4 pt-4 border-t border-orange-200/50">
        <p class="text-sm text-gray-700 font-semibold">
          {tenant.full_name}
        </p>
        {#if tenant.email}
          <p class="text-xs text-gray-500 mt-1">{tenant.email}</p>
        {/if}
      </div>
    </div>
    
    <!-- Seleccionar nueva habitación -->
    <div>
      <div class="space-y-2 mb-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">
            Seleccionar Nueva Habitación
            {#if availableRooms.length > 0}
              <span class="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                {availableRooms.length}
              </span>
            {/if}
          </h3>
          <label class="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              bind:checked={showAllProperties}
              class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
            />
            <span class="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
              Todas las propiedades
            </span>
          </label>
        </div>
      </div>
      
      {#if availableRooms.length > 0}
        <div class="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {#each availableRooms as room (room.id)}
            <button
              on:click={() => selectedRoomId = room.id}
              class="w-full text-left p-4 rounded-2xl border-2 transition-all duration-300
                {selectedRoomId === room.id 
                  ? 'border-orange-500 bg-gradient-to-r from-orange-50/50 to-pink-50/50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-white/60 dark:hover:bg-gray-800'}"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2.5 rounded-xl transition-all
                    {selectedRoomId === room.id 
                      ? 'bg-orange-500' 
                      : 'bg-white/60 dark:bg-gray-700'}">
                    <DoorOpen size={20} class="{selectedRoomId === room.id ? 'text-white' : 'text-gray-600'}" />
                  </div>
                  <div>
                    <p class="font-bold text-gray-900">{room.name}</p>
                    {#if room.propertyName}
                      <p class="text-xs text-orange-600 font-semibold mt-0.5">📍 {room.propertyName}</p>
                    {/if}
                    <div class="flex items-center gap-3 mt-1">
                      <p class="text-sm text-gray-600 font-medium">{room.monthly_rent}€/mes</p>
                      {#if room.size_sqm}
                        <p class="text-sm text-gray-500">• {room.size_sqm} m²</p>
                      {/if}
                    </div>
                  </div>
                </div>
                {#if selectedRoomId === room.id}
                  <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-center py-10 bg-white/60 dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div class="inline-flex p-3 bg-white/80 dark:bg-gray-700 rounded-full mb-3">
            <AlertCircle size={28} class="text-gray-400" />
          </div>
          <p class="text-sm font-semibold text-gray-700 mb-1">No hay habitaciones disponibles</p>
          <p class="text-xs text-gray-500">
            {#if showAllProperties}
              Todas las habitaciones de todas tus propiedades están ocupadas o son salas comunes
            {:else}
              Todas las habitaciones de esta propiedad están ocupadas o son salas comunes
              <br/>
              <button 
                on:click={() => showAllProperties = true}
                class="text-orange-600 hover:text-orange-700 font-medium mt-2 inline-block"
              >
                Ver habitaciones de otras propiedades
              </button>
            {/if}
          </p>
        </div>
      {/if}
    </div>
    
    <!-- Botones de acción -->
    <div class="flex gap-3 pt-2">
      <Button 
        on:click={handleMove} 
        disabled={!selectedRoomId || loading}
        className="flex-1"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
        {/if}
        Mover Inquilino
      </Button>
      
      <Button 
        variant="secondary" 
        on:click={cancel}
        disabled={loading}
      >
        Cancelar
      </Button>
    </div>
  </div>
</Modal>
{/if}

