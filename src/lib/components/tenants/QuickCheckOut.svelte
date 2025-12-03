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
  let tenantData = null;
  let loadingTenant = false;
  
  // Cargar datos del inquilino cuando se abre el modal
  $: if (open && room?.tenant_id) {
    // Solo cargar si no tenemos datos o si el tenant_id cambió
    if (!tenantData || (tenantData.id !== room.tenant_id && !loadingTenant)) {
      loadTenant();
    }
  }
  
  // Resetear cuando se cierra el modal
  $: if (!open) {
    tenantData = null;
    loadingTenant = false;
  }
  
  async function loadTenant() {
    const tenantId = room?.tenant_id;
    if (!tenantId || loadingTenant) return;
    
    // Evitar cargar el mismo inquilino dos veces
    if (tenantData?.id === tenantId) return;
    
    loadingTenant = true;
    
    try {
      const data = await tenantsService.getTenantById(tenantId);
      // Solo actualizar si el tenant_id sigue siendo el mismo
      if (room?.tenant_id === tenantId) {
        tenantData = data;
      }
    } catch (err) {
      console.error('Error loading tenant:', err);
      tenantData = null;
    } finally {
      loadingTenant = false;
    }
  }
  
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
    
    {#if room?.tenant_id}
      {#if loadingTenant}
        <div class="bg-white/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
            <span class="text-sm">Cargando datos del inquilino...</span>
          </div>
        </div>
      {:else if tenantData}
        <div class="bg-white/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <UserX size={16} />
            Inquilino Actual
          </h4>
          <div class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p><strong>Nombre:</strong> {tenantData.full_name || 'No disponible'}</p>
            {#if tenantData.email}
              <p><strong>Email:</strong> {tenantData.email}</p>
            {/if}
            {#if tenantData.phone}
              <p><strong>Teléfono:</strong> {tenantData.phone}</p>
            {/if}
            {#if tenantData.contract_end_date}
              {@const endDate = tenantData.contract_end_date ? (() => {
                try {
                  const date = new Date(tenantData.contract_end_date);
                  return isNaN(date.getTime()) ? null : date.toLocaleDateString('es-ES');
                } catch {
                  return null;
                }
              })() : null}
              {#if endDate}
                <p><strong>Contrato hasta:</strong> {endDate}</p>
              {/if}
            {/if}
          </div>
        </div>
      {:else}
        <div class="bg-white/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <UserX size={16} />
            Inquilino Actual
          </h4>
          <div class="text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Nombre:</strong> No disponible</p>
            <p class="text-xs text-gray-500 mt-1">No se pudieron cargar los datos del inquilino</p>
          </div>
        </div>
      {/if}
      
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={deactivateTenant}
          class="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          Marcar inquilino como inactivo (ya no vive en la propiedad)
        </span>
      </label>
    {:else}
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Esta habitación no tiene inquilino asignado actualmente.
        </p>
      </div>
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

