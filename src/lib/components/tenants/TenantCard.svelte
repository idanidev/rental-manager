<script>
  import { User, Mail, Phone, Calendar, Euro, AlertCircle, FileText, Edit } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let tenant;
  export let onClick = null;
  export let property = null;
  export let room = null;
  export let propertyId = null;
  
  const dispatch = createEventDispatcher();
  
  // Función helper para formatear fechas de forma segura
  function formatDate(dateString, options = { month: 'short', year: 'numeric' }) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('es-ES', options);
    } catch {
      return null;
    }
  }

  // Calcular días hasta vencimiento del contrato
  $: daysUntilExpiry = tenant.contract_end_date 
    ? (() => {
        try {
          const endDate = new Date(tenant.contract_end_date);
          if (isNaN(endDate.getTime())) return null;
          return Math.floor((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        } catch {
          return null;
        }
      })()
    : null;
  
  $: isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  $: isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  
  function handleGenerateContract(e) {
    e.stopPropagation();
    dispatch('generate-contract', { tenant, property, room });
  }
  
  function handleEdit(e) {
    e.stopPropagation();
    dispatch('edit', { tenant });
  }
  
  function handleCardClick() {
    if (onClick) {
      onClick();
    } else {
      // Si no hay onClick personalizado, abrir edición por defecto
      dispatch('edit', { tenant });
    }
  }
</script>

<GlassCard>
  <button 
    on:click={handleCardClick}
    class="w-full text-left space-y-3 relative"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-3 {tenant.active ? 'gradient-primary' : 'bg-gray-400'} rounded-xl">
          <User size={24} class="text-white" />
        </div>
        <div>
          <h4 class="text-lg font-bold text-gray-800">
            {tenant.full_name}
          </h4>
          {#if tenant.email}
            <div class="flex items-center text-sm text-gray-600 mt-1">
              <Mail size={14} class="mr-1" />
              {tenant.email}
            </div>
          {/if}
        </div>
      </div>

      <!-- Estado -->
      <span class="px-3 py-1 rounded-full text-xs font-semibold
        {tenant.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
        {tenant.active ? 'Activo' : 'Inactivo'}
      </span>
    </div>

    <!-- Datos de Contacto -->
    {#if tenant.phone}
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <Phone size={14} />
        <span>{tenant.phone}</span>
      </div>
    {/if}

    <!-- Datos del Contrato -->
    <div class="grid grid-cols-2 gap-3">
      {#if tenant.room?.monthly_rent}
        <div class="flex items-center gap-2 text-sm">
          <Euro size={16} class="text-orange-600" />
          <span class="font-semibold">{tenant.room.monthly_rent}€/mes</span>
        </div>
      {/if}
      
      {#if tenant.contract_end_date}
        {@const formattedDate = formatDate(tenant.contract_end_date)}
        {#if formattedDate}
          <div class="flex items-center gap-2 text-sm">
            <Calendar size={16} class="text-pink-600" />
            <span class="font-semibold">
              {formattedDate}
            </span>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Alerta de Contrato -->
    {#if tenant.active && isExpiringSoon}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
        <AlertCircle size={16} class="text-yellow-600 flex-shrink-0" />
        <p class="text-xs text-yellow-800">
          <strong>Contrato vence en {daysUntilExpiry} días</strong>
        </p>
      </div>
    {:else if tenant.active && isExpired}
      <div class="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
        <AlertCircle size={16} class="text-red-600 flex-shrink-0" />
        <p class="text-xs text-red-800">
          <strong>Contrato vencido</strong>
        </p>
      </div>
    {/if}
  </button>
  
  <!-- Botones de Acción -->
  <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
    <button
      on:click={handleEdit}
      class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
    >
      <Edit size={16} />
      Editar Inquilino
    </button>
    <button
      on:click={handleGenerateContract}
      class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
    >
      <FileText size={16} />
      Generar Contrato
    </button>
  </div>
</GlassCard>

