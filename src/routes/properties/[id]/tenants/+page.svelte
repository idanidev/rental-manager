<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Users, Plus, Edit, Trash2, UserX, UserCheck, AlertCircle } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import TenantForm from '$lib/components/tenants/TenantForm.svelte';
  import TenantCard from '$lib/components/tenants/TenantCard.svelte';
  import { tenantsService } from '$lib/services/tenants';
  import { propertiesService } from '$lib/services/properties';
  
  let propertyId = $page.params.id;
  let property = null;
  let tenants = [];
  let loading = true;
  let error = '';
  
  // Modal states
  let showCreateModal = false;
  let showEditModal = false;
  let selectedTenant = null;
  
  // Filtros
  let showActiveOnly = false;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = '';
    
    try {
      [property, tenants] = await Promise.all([
        propertiesService.getPropertyById(propertyId),
        tenantsService.getPropertyTenants(propertyId)
      ]);
    } catch (err) {
      error = err.message || 'Error al cargar los datos';
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
    selectedTenant = null;
    loadData();
  }
  
  function openEditModal(tenant) {
    selectedTenant = tenant;
    showEditModal = true;
  }
  
  async function handleDelete(tenant) {
    if (!confirm(`¿Estás seguro de eliminar a ${tenant.full_name}?`)) return;
    
    try {
      await tenantsService.deleteTenant(tenant.id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar el inquilino');
    }
  }
  
  async function toggleTenantStatus(tenant) {
    try {
      if (tenant.active) {
        await tenantsService.deactivateTenant(tenant.id);
      } else {
        await tenantsService.activateTenant(tenant.id);
      }
      await loadData();
    } catch (err) {
      alert(err.message || 'Error al cambiar el estado');
    }
  }
  
  $: filteredTenants = showActiveOnly 
    ? tenants.filter(t => t.active)
    : tenants;
  
  $: activeTenants = tenants.filter(t => t.active);
  $: inactiveTenants = tenants.filter(t => !t.active);
</script>

<svelte:head>
  <title>Inquilinos - {property?.name || 'Cargando...'}</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold gradient-text mb-2">
        Inquilinos
      </h1>
      <p class="text-gray-600">
        {property?.name || 'Cargando...'}
      </p>
    </div>
    
    <Button on:click={() => showCreateModal = true}>
      <Plus size={20} class="inline mr-2" />
      Nuevo Inquilino
    </Button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando inquilinos...</p>
    </div>
  {:else}
    <!-- Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <GlassCard hover={false}>
        <div class="flex items-center gap-4">
          <div class="p-4 gradient-primary rounded-xl">
            <Users size={28} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Total</p>
            <p class="text-3xl font-bold gradient-text">{tenants.length}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div class="flex items-center gap-4">
          <div class="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
            <UserCheck size={28} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Activos</p>
            <p class="text-3xl font-bold gradient-text">{activeTenants.length}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div class="flex items-center gap-4">
          <div class="p-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
            <UserX size={28} class="text-white" />
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">Inactivos</p>
            <p class="text-3xl font-bold gradient-text">{inactiveTenants.length}</p>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Filtros -->
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={showActiveOnly}
          class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
        />
        <span class="text-sm font-medium text-gray-700">
          Mostrar solo activos
        </span>
      </label>
    </div>

    <!-- Lista de Inquilinos -->
    {#if filteredTenants.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each filteredTenants as tenant (tenant.id)}
          <div class="relative">
            <TenantCard {tenant} onClick={() => openEditModal(tenant)} />
            
            <!-- Actions -->
            <div class="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <button
                on:click|stopPropagation={() => openEditModal(tenant)}
                class="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
                title="Editar"
              >
                <Edit size={16} class="text-purple-600" />
              </button>
              
              <button
                on:click|stopPropagation={() => toggleTenantStatus(tenant)}
                class="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
                title={tenant.active ? 'Desactivar' : 'Activar'}
              >
                {#if tenant.active}
                  <UserX size={16} class="text-gray-600" />
                {:else}
                  <UserCheck size={16} class="text-green-600" />
                {/if}
              </button>
              
              <button
                on:click|stopPropagation={() => handleDelete(tenant)}
                class="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all"
                title="Eliminar"
              >
                <Trash2 size={16} class="text-red-600" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <GlassCard>
        <div class="text-center py-8">
          <Users size={48} class="mx-auto text-gray-400 mb-3" />
          <h3 class="text-lg font-semibold text-gray-700 mb-2">
            {showActiveOnly ? 'No hay inquilinos activos' : 'No hay inquilinos'}
          </h3>
          <p class="text-gray-600 mb-4">
            {showActiveOnly 
              ? 'Todos los inquilinos están inactivos' 
              : 'Añade tu primer inquilino a esta propiedad'}
          </p>
          {#if !showActiveOnly}
            <Button on:click={() => showCreateModal = true}>
              <Plus size={18} class="inline mr-2" />
              Añadir Inquilino
            </Button>
          {/if}
        </div>
      </GlassCard>
    {/if}

    <!-- Alertas de Contratos -->
    {#await tenantsService.getExpiringContracts(30)}
      <!-- loading -->
    {:then expiringContracts}
      {#if expiringContracts.length > 0}
        <GlassCard>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <AlertCircle size={20} class="text-yellow-600" />
              <h3 class="text-lg font-bold text-gray-800">
                Contratos por Vencer
              </h3>
            </div>
            
            <div class="space-y-2">
              {#each expiringContracts as contract}
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-gray-800">{contract.tenant_name || contract.full_name}</p>
                      <p class="text-sm text-gray-600">
                        Vence: {new Date(contract.contract_end_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span class="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                      {contract.days_until_expiry} días
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </GlassCard>
      {/if}
    {:catch error}
      <!-- error -->
    {/await}
  {/if}
</div>

<!-- Modal Crear Inquilino -->
<Modal bind:open={showCreateModal} title="Nuevo Inquilino" size="lg">
  <TenantForm
    {propertyId}
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>

<!-- Modal Editar Inquilino -->
<Modal bind:open={showEditModal} title="Editar Inquilino" size="lg">
  <TenantForm
    {propertyId}
    tenant={selectedTenant}
    on:success={handleEditSuccess}
    on:cancel={() => {
      showEditModal = false;
      selectedTenant = null;
    }}
  />
</Modal>

