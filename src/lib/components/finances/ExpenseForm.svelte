<script>
  import { Receipt, Euro, Calendar, Tag, FileText } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { financesService } from '$lib/services/finances';
  import { createEventDispatcher } from 'svelte';
  
  
  export let expense = null;
  export let propertyId;
  
  const dispatch = createEventDispatcher();
  
  const categories = [
    'Mantenimiento',
    'Reparaciones',
    'Servicios',
    'Suministros',
    'Impuestos',
    'Seguros',
    'Comunidad',
    'Limpieza',
    'Otros'
  ];
  
  let formData = {
    property_id: propertyId,
    amount: expense?.amount || '',
    category: expense?.category || 'Mantenimiento',
    description: expense?.description || '',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
  };
  
  let loading = false;
  let error = '';

  async function handleSubmit() {
    if (!formData.amount || !formData.category || !formData.date) {
      error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    loading = true;
    error = '';

    try {
      if (expense) {
        await financesService.updateExpense(expense.id, formData);
      } else {
        await financesService.createExpense(formData);
      }
      dispatch('success');
    } catch (err) {
      error = err.message || 'Error al guardar el gasto';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Monto -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Euro size={16} class="inline mr-1" />
      Monto (€) *
    </label>
    <input
      type="number"
      bind:value={formData.amount}
      placeholder="100.00"
      class="input-glass"
      min="0"
      step="0.01"
      required
    />
  </div>

  <!-- Categoría -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Tag size={16} class="inline mr-1" />
      Categoría *
    </label>
    <select bind:value={formData.category} class="input-glass" required>
      {#each categories as category}
        <option value={category}>{category}</option>
      {/each}
    </select>
  </div>

  <!-- Fecha -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Calendar size={16} class="inline mr-1" />
      Fecha *
    </label>
    <input
      type="date"
      bind:value={formData.date}
      class="input-glass"
      required
    />
  </div>

  <!-- Descripción -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <FileText size={16} class="inline mr-1" />
      Descripción
    </label>
    <textarea
      bind:value={formData.description}
      placeholder="Detalles del gasto..."
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
      {loading ? 'Guardando...' : expense ? 'Actualizar' : 'Registrar Gasto'}
    </Button>
  </div>
</form>

