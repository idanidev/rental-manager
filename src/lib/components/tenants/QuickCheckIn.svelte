<script>
  import { UserPlus, Users, ArrowRight } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import TenantForm from './TenantForm.svelte';
  import { roomsService } from '$lib/services/rooms';
  import { tenantsService } from '$lib/services/tenants';
  import { createEventDispatcher } from 'svelte';
  
  export let room;
  export let propertyId;
  export let open = false;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let availableTenants = [];
  let showCreateNew = false;
  
  // Recargar inquilinos cuando se abre el modal
  $: if (open) {
    loadAvailableTenants();
  }
  
  async function loadAvailableTenants() {
    try {
      // Usar getAvailableTenants que incluye inactivos sin habitación
      availableTenants = await tenantsService.getAvailableTenants(propertyId);
    } catch (err) {
      console.error('Error loading tenants:', err);
      availableTenants = [];
    }
  }
  
  async function handleTenantSelect(tenant) {
    // Asignar directamente sin pasos intermedios
    loading = true;
    error = '';
    
    try {
      // Si el inquilino está inactivo, reactivarlo automáticamente
      if (!tenant.active) {
        await tenantsService.activateTenant(tenant.id);
      }
      
      // Asignar inquilino a la habitación
      await roomsService.updateRoom(room.id, {
        tenant_id: tenant.id,
        occupied: true
      });
      
      // Cerrar modal y notificar éxito
      dispatch('success');
      open = false;
      resetState();
    } catch (err) {
      error = err.message || 'Error al asignar inquilino';
    } finally {
      loading = false;
    }
  }
  
  
  function resetState() {
    showCreateNew = false;
    error = '';
    loading = false;
  }
  
  async function handleCreateAndAssign(event) {
    const newTenant = event.detail.tenant;
    loading = true;
    error = '';
    
    try {
      await roomsService.updateRoom(room.id, {
        tenant_id: newTenant.id,
        occupied: true
      });
      
      // Cerrar modal y notificar éxito
      dispatch('success');
      open = false;
      resetState();
    } catch (err) {
      error = err.message || 'Error al asignar inquilino';
    } finally {
      loading = false;
    }
  }
  
  function cancel() {
    open = false;
    resetState();
  }
  
  function goBack() {
    if (showCreateNew) {
      showCreateNew = false;
    }
  }
</script>

<Modal bind:open title="Check-In: {room.name}" size="md">
  <div class="space-y-4">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}
    
    {#if !showCreateNew}
      <!-- Lista de inquilinos - Asignación directa -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Seleccionar Inquilino</h3>
          <button
            on:click={() => showCreateNew = true}
            class="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            disabled={loading}
          >
            <UserPlus size={14} />
            Crear Nuevo
          </button>
        </div>
        
        {#if availableTenants.length > 0}
          <div class="space-y-2 max-h-[400px] overflow-y-auto">
            {#each availableTenants as tenant (tenant.id)}
              <button
                on:click={() => handleTenantSelect(tenant)}
                disabled={loading}
                class="w-full p-4 rounded-lg border-2 {tenant.active ? 'border-gray-200 hover:border-orange-300' : 'border-yellow-300 bg-yellow-50/50 hover:border-orange-400'} hover:bg-orange-50/30 transition-all text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div class="p-2 {tenant.active ? 'gradient-primary' : 'bg-yellow-500'} rounded-lg flex-shrink-0">
                    <Users size={20} class="text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-gray-800 truncate">{tenant.full_name}</h4>
                      {#if !tenant.active}
                        <span class="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                          Inactivo
                        </span>
                      {/if}
                    </div>
                    {#if tenant.email}
                      <p class="text-sm text-gray-600 truncate">{tenant.email}</p>
                    {/if}
                    {#if !tenant.active}
                      <p class="text-xs text-yellow-700 mt-1">Se reactivará al asignar</p>
                    {/if}
                  </div>
                </div>
                {#if loading}
                  <div class="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent flex-shrink-0"></div>
                {:else}
                  <ArrowRight size={20} class="text-gray-400 flex-shrink-0 ml-2" />
                {/if}
              </button>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 bg-white/60 dark:bg-gray-800 rounded-xl">
            <Users size={32} class="mx-auto text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 mb-3">No hay inquilinos disponibles</p>
            <Button on:click={() => showCreateNew = true} variant="secondary" disabled={loading}>
              + Crear Nuevo Inquilino
            </Button>
          </div>
        {/if}
        
        <Button variant="secondary" on:click={cancel} className="w-full" disabled={loading}>
          Cancelar
        </Button>
      </div>
    {:else if showCreateNew}
      <!-- Crear inquilino nuevo -->
      <div>
        <button
          on:click={goBack}
          class="text-sm text-gray-600 hover:text-gray-700 mb-4"
          disabled={loading}
        >
          ← Volver a la lista
        </button>
        
        <TenantForm
          {propertyId}
          roomMonthlyRent={room.monthly_rent}
          on:success={handleCreateAndAssign}
          on:cancel={goBack}
        />
      </div>
    {/if}
  </div>
</Modal>

