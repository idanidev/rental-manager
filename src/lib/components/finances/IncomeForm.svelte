<script>
  import { TrendingUp, Euro, Calendar, FileText, DoorOpen } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { financesService } from '$lib/services/finances';
  import { roomsService } from '$lib/services/rooms';
  import { createEventDispatcher, onMount } from 'svelte';
  
  
  export let income = null;
  export let propertyId;
  
  const dispatch = createEventDispatcher();
  
  let rooms = [];
  let formData = {
    property_id: propertyId,
    room_id: income?.room_id || '',
    amount: income?.amount || '',
    month: income?.month ? income.month.split('T')[0].substring(0, 7) : new Date().toISOString().substring(0, 7),
    paid: income?.paid || false,
    payment_date: income?.payment_date ? income.payment_date.split('T')[0] : '',
    notes: income?.notes || ''
  };
  
  let loading = false;
  let error = '';
  
  onMount(async () => {
    try {
      // Cargar habitaciones directamente sin necesidad de esperar al store
      rooms = await roomsService.getPropertyRooms(propertyId);
      
      // Si solo hay una habitación, seleccionarla automáticamente
      if (rooms.length === 1 && !formData.room_id) {
        formData.room_id = rooms[0].id;
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  });

  async function handleSubmit() {
    if (!formData.room_id || !formData.amount || !formData.month) {
      error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    loading = true;
    error = '';

    try {
      if (income) {
        await financesService.updateIncome(income.id, formData);
      } else {
        await financesService.createIncome(formData);
      }
      dispatch('success');
    } catch (err) {
      error = err.message || 'Error al guardar el ingreso';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Habitación -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <DoorOpen size={16} class="inline mr-1" />
      Habitación *
    </label>
    <select bind:value={formData.room_id} class="input-glass" required>
      <option value="">Selecciona una habitación</option>
      {#each rooms as room}
        <option value={room.id}>{room.name} - {room.monthly_rent}€</option>
      {/each}
    </select>
  </div>

  <!-- Monto -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Euro size={16} class="inline mr-1" />
      Monto (€) *
    </label>
    <input
      type="number"
      bind:value={formData.amount}
      placeholder="450.00"
      class="input-glass"
      min="0"
      step="0.01"
      required
    />
  </div>

  <!-- Mes -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <Calendar size={16} class="inline mr-1" />
      Mes *
    </label>
    <input
      type="month"
      bind:value={formData.month}
      class="input-glass"
      required
    />
  </div>

  <!-- Estado de pago -->
  <div class="flex items-center gap-2">
    <input
      type="checkbox"
      id="paid"
      bind:checked={formData.paid}
      class="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
    />
    <label for="paid" class="text-sm font-medium text-gray-700">
      Pagado
    </label>
  </div>

  {#if formData.paid}
    <!-- Fecha de pago -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <Calendar size={16} class="inline mr-1" />
        Fecha de pago
      </label>
      <input
        type="date"
        bind:value={formData.payment_date}
        class="input-glass"
      />
    </div>
  {/if}

  <!-- Notas -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <FileText size={16} class="inline mr-1" />
      Notas (opcional)
    </label>
    <textarea
      bind:value={formData.notes}
      placeholder="Detalles adicionales..."
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
      {loading ? 'Guardando...' : income ? 'Actualizar' : 'Registrar Ingreso'}
    </Button>
  </div>
</form>

