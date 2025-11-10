<script>
  import { UserX, AlertCircle } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { roomsService } from '$lib/services/rooms';
  import { tenantsService } from '$lib/services/tenants';
  import { createEventDispatcher } from 'svelte';
  
  export let room;
  export let open = false;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let deactivateTenant = true;
  
  async function handleCheckOut() {
    loading = true;
    error = '';
    
    try {
      // Desasignar inquilino de la habitación
      await roomsService.updateRoom(room.id, {
        tenant_id: null,
        occupied: false
      });
      
      // Desactivar inquilino si se marcó la opción
      if (deactivateTenant && room.tenant_id) {
        await tenantsService.deactivateTenant(room.tenant_id);
      }
      
      dispatch('success');
      open = false;
    } catch (err) {
      error = err.message || 'Error al liberar la habitación';
    } finally {
      loading = false;
    }
  }
  
  function cancel() {
    open = false;
    error = '';
  }
</script>

<Modal bind:open title="Check-Out: {room.name}" size="sm">
  <div class="space-y-4">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}
    
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div class="flex gap-3">
        <AlertCircle size={20} class="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div class="text-sm text-yellow-800">
          <p class="font-semibold mb-1">¿Confirmar salida del inquilino?</p>
          <p>La habitación quedará disponible para un nuevo inquilino.</p>
        </div>
      </div>
    </div>
    
    {#if room.tenant_id}
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <UserX size={16} />
          Inquilino Actual
        </h4>
        <div class="text-sm text-gray-700 space-y-1">
          <p><strong>Nombre:</strong> {room.tenant?.full_name || 'No disponible'}</p>
          {#if room.tenant?.email}
            <p><strong>Email:</strong> {room.tenant.email}</p>
          {/if}
          {#if room.tenant?.contract_end_date}
            <p><strong>Contrato hasta:</strong> {new Date(room.tenant.contract_end_date).toLocaleDateString('es-ES')}</p>
          {/if}
        </div>
      </div>
      
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={deactivateTenant}
          class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
        />
        <span class="text-sm text-gray-700">
          Marcar inquilino como inactivo (ya no vive en la propiedad)
        </span>
      </label>
    {/if}
    
    <div class="flex gap-3 pt-2">
      <Button 
        on:click={handleCheckOut} 
        disabled={loading}
        className="flex-1 bg-red-600 hover:bg-red-700"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
        {/if}
        Confirmar Salida
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

