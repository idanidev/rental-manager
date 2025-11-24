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
  let selectedTenant = null;
  let showCreateNew = false;
  let showEditForm = false;
  
  onMount(async () => {
    await loadAvailableTenants();
  });
  
  async function loadAvailableTenants() {
    try {
      availableTenants = await tenantsService.getActiveTenants(propertyId);
    } catch (err) {
      console.error('Error loading tenants:', err);
    }
  }
  
  function handleTenantSelect(tenant) {
    selectedTenant = tenant;
    showEditForm = true;
  }
  
  async function handleConfirmAssign() {
    if (!selectedTenant) {
      error = 'Por favor selecciona un inquilino';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      await roomsService.updateRoom(room.id, {
        tenant_id: selectedTenant.id,
        occupied: true
      });
      
      dispatch('success');
      open = false;
      resetState();
    } catch (err) {
      error = err.message || 'Error al asignar inquilino';
    } finally {
      loading = false;
    }
  }
  
  function handleTenantUpdate(event) {
    selectedTenant = event.detail.tenant;
  }
  
  function resetState() {
    selectedTenant = null;
    showCreateNew = false;
    showEditForm = false;
    error = '';
  }
  
  async function handleCreateAndAssign(event) {
    const newTenant = event.detail.tenant;
    
    try {
      await roomsService.updateRoom(room.id, {
        tenant_id: newTenant.id,
        occupied: true
      });
      
      dispatch('success');
      open = false;
    } catch (err) {
      error = err.message || 'Error al asignar inquilino';
    }
  }
  
  function cancel() {
    open = false;
    resetState();
  }
  
  function goBack() {
    if (showEditForm) {
      showEditForm = false;
      selectedTenant = null;
    } else if (showCreateNew) {
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
    
    {#if !showCreateNew && !showEditForm}
      <!-- Lista de inquilinos -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Seleccionar Inquilino</h3>
          <button
            on:click={() => showCreateNew = true}
            class="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
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
                class="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-left flex items-center justify-between"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div class="p-2 gradient-primary rounded-lg flex-shrink-0">
                    <Users size={20} class="text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-800 truncate">{tenant.full_name}</h4>
              {#if tenant.email}
                <p class="text-sm text-gray-600 truncate">{tenant.email}</p>
              {/if}
            </div>
                </div>
                <ArrowRight size={20} class="text-gray-400 flex-shrink-0 ml-2" />
              </button>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 bg-gray-50 rounded-xl">
            <Users size={32} class="mx-auto text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 mb-3">No hay inquilinos disponibles</p>
            <Button on:click={() => showCreateNew = true} variant="secondary">
              + Crear Nuevo Inquilino
            </Button>
          </div>
        {/if}
        
        <Button variant="secondary" on:click={cancel} className="w-full">
          Cancelar
        </Button>
      </div>
    {:else if showEditForm && selectedTenant}
      <!-- Editar y confirmar -->
      <div class="space-y-4">
        <button
          on:click={goBack}
          class="text-sm text-gray-600 hover:text-gray-700"
        >
          ← Volver a la lista
        </button>
        
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p class="text-sm text-orange-800">
            <strong>Asignar a:</strong> {room.name}
          </p>
        </div>
        
        <TenantForm
          {propertyId}
          tenant={selectedTenant}
          roomMonthlyRent={room.monthly_rent}
          on:success={handleTenantUpdate}
          on:cancel={goBack}
        />
        
        <div class="flex gap-3 pt-2 border-t">
          <Button 
            on:click={handleConfirmAssign} 
            disabled={loading}
            className="flex-1"
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
            {/if}
            <UserPlus size={18} class="inline mr-2" />
            Confirmar Asignación
          </Button>
          <Button variant="secondary" on:click={goBack}>
            Cancelar
          </Button>
        </div>
      </div>
    {:else if showCreateNew}
      <!-- Crear inquilino nuevo -->
      <div>
        <button
          on:click={goBack}
          class="text-sm text-gray-600 hover:text-gray-700 mb-4"
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

