<script>
  import { ArrowRight, DoorOpen, AlertCircle } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { roomsService } from '$lib/services/rooms';
  import { createEventDispatcher } from 'svelte';
  
  export let open = false;
  export let tenant;
  export let currentRoom;
  export let allRooms = [];
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let selectedRoomId = '';
  
  // Filtrar solo habitaciones privadas disponibles (excluyendo la actual)
  $: availableRooms = allRooms.filter(r => 
    r.room_type !== 'common' && 
    !r.occupied && 
    r.id !== currentRoom?.id
  );
  
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

<Modal bind:open title="Mover Inquilino" size="md">
  <div class="space-y-4">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}
    
    <!-- Info del inquilino y habitación actual -->
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
      <div class="flex items-center justify-center gap-4">
        <div class="text-center">
          <p class="text-xs text-gray-600 mb-1">De:</p>
          <div class="bg-white px-4 py-2 rounded-lg">
            <p class="text-sm font-semibold text-gray-800">{currentRoom?.name || 'Sin habitación'}</p>
          </div>
        </div>
        
        <ArrowRight size={24} class="text-purple-600" />
        
        <div class="text-center">
          <p class="text-xs text-gray-600 mb-1">A:</p>
          <div class="bg-white px-4 py-2 rounded-lg">
            <p class="text-sm font-semibold text-purple-600">
              {selectedRoomId ? allRooms.find(r => r.id === selectedRoomId)?.name : '?'}
            </p>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-3 pt-3 border-t border-purple-200">
        <p class="text-sm text-purple-900">
          <strong>{tenant.full_name}</strong>
        </p>
        {#if tenant.email}
          <p class="text-xs text-purple-700">{tenant.email}</p>
        {/if}
      </div>
    </div>
    
    <!-- Seleccionar nueva habitación -->
    <div>
      <h3 class="font-semibold text-gray-900 mb-3">Seleccionar Nueva Habitación</h3>
      
      {#if availableRooms.length > 0}
        <div class="space-y-2 max-h-[300px] overflow-y-auto">
          {#each availableRooms as room (room.id)}
            <button
              on:click={() => selectedRoomId = room.id}
              class="w-full text-left p-4 rounded-lg border-2 transition-all
                {selectedRoomId === room.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'}"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-gray-100 rounded-lg">
                    <DoorOpen size={20} class="text-gray-600" />
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{room.name}</p>
                    <div class="flex items-center gap-3 mt-1">
                      <p class="text-sm text-gray-600">{room.monthly_rent}€/mes</p>
                      {#if room.size_sqm}
                        <p class="text-sm text-gray-600">• {room.size_sqm} m²</p>
                      {/if}
                    </div>
                  </div>
                </div>
                {#if selectedRoomId === room.id}
                  <div class="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 bg-gray-50 rounded-xl">
          <AlertCircle size={32} class="mx-auto text-gray-400 mb-2" />
          <p class="text-sm text-gray-600">No hay habitaciones disponibles</p>
          <p class="text-xs text-gray-500 mt-1">Todas las habitaciones están ocupadas o son salas comunes</p>
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

