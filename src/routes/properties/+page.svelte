<script>
  import { Plus, Home as HomeIcon, Building2, MapPin } from 'lucide-svelte';
  import { propertiesStore } from '$lib/stores/properties';
  import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
  import PropertyForm from '$lib/components/properties/PropertyForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  
  let showCreateModal = false;

  function handleCreateSuccess() {
    showCreateModal = false;
  }
</script>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold gradient-text">
        Mis Propiedades
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Gestiona todas tus propiedades en un solo lugar
      </p>
    </div>
    
    <Button on:click={() => showCreateModal = true}>
      <Plus size={20} class="inline mr-2" />
      Nueva Propiedad
    </Button>
  </div>

  <!-- Stats Rápidas -->
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <GlassCard hover={false}>
      <div class="flex items-center gap-3">
        <div class="p-3 gradient-primary rounded-2xl">
          <Building2 size={24} class="text-white" />
        </div>
        <div>
          <p class="text-2xl font-bold gradient-text">{$propertiesStore.length}</p>
          <p class="text-xs text-gray-500 font-medium">Propiedades</p>
        </div>
      </div>
    </GlassCard>

    <GlassCard hover={false}>
      <div class="flex items-center gap-3">
        <div class="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
          <HomeIcon size={24} class="text-white" />
        </div>
        <div>
          <p class="text-2xl font-bold gradient-text">
            {$propertiesStore.reduce((sum, p) => sum + (p.rooms?.length || 0), 0)}
          </p>
          <p class="text-xs text-gray-500 font-medium">Habitaciones</p>
        </div>
      </div>
    </GlassCard>

    <GlassCard hover={false} className="col-span-2 md:col-span-1">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
          <MapPin size={24} class="text-white" />
        </div>
        <div>
          <p class="text-2xl font-bold gradient-text">
            {new Set($propertiesStore.map(p => p.address.split(',').pop()?.trim())).size}
          </p>
          <p class="text-xs text-gray-500 font-medium">Ubicaciones</p>
        </div>
      </div>
    </GlassCard>
  </div>

  <!-- Lista de Propiedades -->
  {#if $propertiesStore.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each $propertiesStore as property (property.id)}
        <PropertyCard {property} />
      {/each}
    </div>
  {:else}
    <GlassCard hover={false}>
      <div class="text-center py-16">
        <div class="inline-flex p-6 gradient-primary rounded-full mb-4">
          <Building2 size={48} class="text-white" />
        </div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">
          No tienes propiedades aún
        </h3>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Crea tu primera propiedad para empezar a gestionar tus alquileres de forma profesional
        </p>
        <Button on:click={() => showCreateModal = true}>
          <Plus size={20} class="inline mr-2" />
          Crear Primera Propiedad
        </Button>
      </div>
    </GlassCard>
  {/if}
</div>

<!-- Modal Crear Propiedad -->
<Modal bind:open={showCreateModal} title="Nueva Propiedad">
  <PropertyForm 
    on:success={handleCreateSuccess}
    on:cancel={() => showCreateModal = false}
  />
</Modal>

