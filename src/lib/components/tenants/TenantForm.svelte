<script>
  import { 
    User, Mail, Phone, CreditCard, Calendar, Clock, 
    Shield, FileText
  } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { tenantsService } from '$lib/services/tenants';
  import { createEventDispatcher } from 'svelte';
  
  
  export let tenant = null; // Si existe, estamos editando
  export let propertyId;
  export let roomMonthlyRent = null; // Precio mensual de la habitación (opcional)
  
  const dispatch = createEventDispatcher();
  
  // Obtener fecha de hoy en formato YYYY-MM-DD
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  // Calcular fianza por defecto (igual al precio mensual si está disponible)
  function getDefaultDeposit() {
    if (tenant?.deposit_amount) {
      return tenant.deposit_amount;
    }
    if (roomMonthlyRent) {
      return roomMonthlyRent.toString();
    }
    return '';
  }
  
  // Calcular fecha de fin del contrato
  function calculateEndDate(startDate, months) {
    if (!startDate || !months) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split('T')[0];
  }
  
  // Obtener fecha de inicio por defecto (hoy si es nuevo inquilino)
  const defaultStartDate = tenant?.contract_start_date 
    ? tenant.contract_start_date.split('T')[0] 
    : getTodayDate();
  
  // Obtener duración por defecto
  const defaultMonths = tenant?.contract_months || 12;
  
  // Calcular fecha de fin por defecto
  const defaultEndDate = tenant?.contract_end_date
    ? tenant.contract_end_date.split('T')[0]
    : calculateEndDate(defaultStartDate, defaultMonths);
  
  let formData = {
    property_id: propertyId,
    full_name: tenant?.full_name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    dni: tenant?.dni || '',
    contract_start_date: defaultStartDate,
    contract_months: defaultMonths,
    contract_end_date: defaultEndDate,
    deposit_amount: getDefaultDeposit(),
    contract_notes: tenant?.contract_notes || '',
    notes: tenant?.notes || '',
    active: tenant?.active !== undefined ? tenant.active : true
  };
  
  let loading = false;
  let error = '';

  // Calcular fecha de fin del contrato automáticamente cuando cambian la fecha de inicio o la duración
  $: if (formData.contract_start_date && formData.contract_months) {
    const calculatedEndDate = calculateEndDate(formData.contract_start_date, formData.contract_months);
    if (calculatedEndDate !== formData.contract_end_date) {
      formData.contract_end_date = calculatedEndDate;
    }
  }

  async function handleSubmit() {
    if (!formData.full_name) {
      error = 'El nombre completo es obligatorio';
      return;
    }

    loading = true;
    error = '';

    try {
      let result;
      if (tenant?.id) {
        // Actualizar inquilino existente
        result = await tenantsService.updateTenant(tenant.id, formData);
        dispatch('success', { tenant: result, action: 'update' });
      } else {
        // Crear nuevo inquilino
        result = await tenantsService.createTenant(formData);
        dispatch('success', { tenant: result, action: 'create' });
      }
    } catch (err) {
      error = err.message || 'Error al guardar el inquilino';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
      {error}
    </div>
  {/if}

  <!-- Datos Personales -->
  <div class="space-y-4">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
      <User size={20} class="text-purple-600" />
      Datos Personales
    </h3>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Nombre Completo *
      </label>
      <input
        type="text"
        bind:value={formData.full_name}
        placeholder="Juan Pérez García"
        class="input-glass"
        required
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Mail size={16} class="inline mr-1" />
          Email
        </label>
        <input
          type="email"
          bind:value={formData.email}
          placeholder="email@example.com"
          class="input-glass"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Phone size={16} class="inline mr-1" />
          Teléfono
        </label>
        <input
          type="tel"
          bind:value={formData.phone}
          placeholder="+34 600 123 456"
          class="input-glass"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <CreditCard size={16} class="inline mr-1" />
        DNI/NIE
      </label>
      <input
        type="text"
        bind:value={formData.dni}
        placeholder="12345678A"
        class="input-glass"
      />
    </div>
  </div>

  <!-- Datos del Contrato -->
  <div class="border-t border-gray-200 pt-4 space-y-4">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
      <FileText size={20} class="text-purple-600" />
      Contrato
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Calendar size={16} class="inline mr-1" />
          Fecha de Inicio
        </label>
        <input
          type="date"
          bind:value={formData.contract_start_date}
          class="input-glass"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Clock size={16} class="inline mr-1" />
          Duración (meses)
        </label>
        <input
          type="number"
          bind:value={formData.contract_months}
          placeholder="12"
          class="input-glass"
          min="1"
        />
      </div>
    </div>

    {#if formData.contract_end_date}
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p class="text-sm text-blue-800">
          📅 <strong>Fecha de vencimiento:</strong> {new Date(formData.contract_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    {/if}

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <Shield size={16} class="inline mr-1" />
        Fianza/Depósito (€)
      </label>
      <input
        type="number"
        bind:value={formData.deposit_amount}
        placeholder={roomMonthlyRent ? roomMonthlyRent.toString() : "450"}
        class="input-glass"
        min="0"
        step="0.01"
      />
      <p class="text-xs text-gray-500 mt-1">
        💡 {roomMonthlyRent ? `La fianza por defecto es igual a la renta mensual (${roomMonthlyRent}€). Puedes modificarla si es necesario.` : 'La renta mensual se define en la habitación, no en el inquilino'}
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Notas del Contrato
      </label>
      <textarea
        bind:value={formData.contract_notes}
        placeholder="Condiciones especiales, renovaciones, etc."
        class="input-glass min-h-[80px]"
        rows="3"
      ></textarea>
    </div>
  </div>

  <!-- Notas Generales -->
  <div class="border-t border-gray-200 pt-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <FileText size={16} class="inline mr-1" />
      Notas Generales
    </label>
    <textarea
      bind:value={formData.notes}
      placeholder="Información adicional sobre el inquilino..."
      class="input-glass min-h-[80px]"
      rows="3"
    ></textarea>
  </div>

  <!-- Estado -->
  {#if tenant?.id}
    <div class="border-t border-gray-200 pt-4">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={formData.active}
          class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
        />
        <span class="text-sm font-medium text-gray-700">
          Inquilino activo
        </span>
      </label>
      <p class="text-xs text-gray-500 mt-1 ml-6">
        {formData.active ? 'El inquilino está actualmente en la propiedad' : 'El inquilino ya no vive en la propiedad'}
      </p>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-3 pt-4">
    <Button type="submit" disabled={loading} className="flex-1">
      {#if loading}
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
      {/if}
      {tenant?.id ? 'Actualizar' : 'Crear'} Inquilino
    </Button>
    
    <Button 
      type="button" 
      variant="secondary" 
      on:click={() => dispatch('cancel')}
      disabled={loading}
    >
      Cancelar
    </Button>
  </div>
</form>

