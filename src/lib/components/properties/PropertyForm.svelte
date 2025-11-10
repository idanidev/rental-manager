<script>
  import { Home, MapPin, FileText } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { propertiesService } from '$lib/services/properties';
  import { propertiesStore } from '$lib/stores/properties';
  import { userStore } from '$lib/stores/user';
  import { createEventDispatcher } from 'svelte';
  
  export let property = null; // Si existe, estamos editando
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    name: property?.name || '',
    address: property?.address || '',
    description: property?.description || ''
  };
  
  let loading = false;
  let error = '';

  async function handleSubmit() {
    if (!formData.name || !formData.address) {
      error = 'Por favor completa los campos obligatorios';
      return;
    }

    if (!$userStore || !$userStore.id) {
      error = 'Error: No se ha detectado una sesión de usuario. Por favor, recarga la página.';
      return;
    }

    loading = true;
    error = '';

    try {
      if (property) {
        // Actualizar propiedad existente
        await propertiesService.updateProperty(property.id, formData);
        await propertiesStore.updateProperty(property.id, formData);
      } else {
        // Crear nueva propiedad
        const newProperty = await propertiesService.createProperty(formData, $userStore.id);
        await propertiesStore.add(newProperty);
      }
      
      dispatch('success');
    } catch (err) {
      console.error('Error al guardar:', err);
      error = err.message || 'Error al guardar la propiedad';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Nombre -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Home size={16} class="inline mr-1" />
      Nombre de la propiedad *
    </label>
    <input
      type="text"
      bind:value={formData.name}
      placeholder="Ej: Casa Principal"
      class="input-glass"
      required
    />
  </div>

  <!-- Dirección -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <MapPin size={16} class="inline mr-1" />
      Dirección *
    </label>
    <input
      type="text"
      bind:value={formData.address}
      placeholder="Calle, número, ciudad"
      class="input-glass"
      required
    />
  </div>

  <!-- Descripción -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <FileText size={16} class="inline mr-1" />
      Descripción (opcional)
    </label>
    <textarea
      bind:value={formData.description}
      placeholder="Detalles adicionales de la propiedad"
      class="input-glass resize-none"
      rows="3"
    ></textarea>
  </div>

  <!-- Error -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
      {error}
    </div>
  {/if}

  <!-- Botones -->
  <div class="flex gap-3 pt-4">
    <Button type="button" variant="secondary" on:click={() => dispatch('cancel')}>
      Cancelar
    </Button>
    <Button type="submit" disabled={loading} className="flex-1">
      {loading ? 'Guardando...' : property ? 'Actualizar' : 'Crear Propiedad'}
    </Button>
  </div>
</form>
