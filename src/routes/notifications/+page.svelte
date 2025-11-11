<script>
  import { onMount } from 'svelte';
  import { Bell, AlertTriangle, Clock, Calendar, Home, User, Phone, Mail } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { notificationsService } from '$lib/services/notifications';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import { goto } from '$app/navigation';
  
  let loading = true;
  let error = '';
  let expiringContracts = [];
  let expiredContracts = [];
  
  onMount(async () => {
    await loadNotifications();
  });
  
  async function loadNotifications() {
    if (!$userStore) return;
    
    loading = true;
    error = '';
    
    try {
      const notifications = await notificationsService.getAllNotifications($userStore.id);
      expiringContracts = notifications.expiring;
      expiredContracts = notifications.expired;
    } catch (err) {
      console.error('Error loading notifications:', err);
      error = 'Error al cargar las notificaciones';
    } finally {
      loading = false;
    }
  }
  
  function getUrgencyColor(urgency) {
    switch (urgency) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-orange-500 to-yellow-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  function goToProperty(propertyId) {
    goto(`/properties/${propertyId}`);
  }
</script>

<svelte:head>
  <title>Notificaciones - Rental Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-3">
      <Bell size={32} />
      Notificaciones
    </h1>
    <p class="text-sm text-gray-500 mt-1">
      Contratos próximos a vencer y vencidos
    </p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando notificaciones...</p>
      </div>
    </div>
  {:else if error}
    <GlassCard>
      <div class="text-center py-10">
        <AlertTriangle size={48} class="text-red-500 mx-auto mb-4" />
        <p class="text-red-600">{error}</p>
      </div>
    </GlassCard>
  {:else}
    <!-- Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Total Notificaciones</p>
            <p class="text-3xl font-bold gradient-text">{expiringContracts.length + expiredContracts.length}</p>
          </div>
          <div class="p-3 gradient-primary rounded-2xl">
            <Bell size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Próximos a Vencer</p>
            <p class="text-3xl font-bold text-orange-600">{expiringContracts.length}</p>
            <p class="text-xs text-gray-500 mt-1">En los próximos 30 días</p>
          </div>
          <div class="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl">
            <Clock size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Contratos Vencidos</p>
            <p class="text-3xl font-bold text-red-600">{expiredContracts.length}</p>
            <p class="text-xs text-gray-500 mt-1">Requieren atención inmediata</p>
          </div>
          <div class="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl">
            <AlertTriangle size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Contratos Vencidos (Prioridad Alta) -->
    {#if expiredContracts.length > 0}
      <div>
        <h2 class="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
          <AlertTriangle size={24} />
          Contratos Vencidos ({expiredContracts.length})
        </h2>
        <div class="space-y-3">
          {#each expiredContracts as contract (contract.id)}
            <GlassCard hover={true}>
              <button
                on:click={() => goToProperty(contract.propertyId)}
                class="w-full text-left"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-start gap-3">
                      <div class="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex-shrink-0">
                        <AlertTriangle size={20} class="text-white" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-gray-800 text-lg">{contract.tenantName}</h3>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                          <span class="flex items-center gap-1">
                            <Home size={14} />
                            {contract.propertyName} - {contract.roomName}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                          {#if contract.tenantEmail}
                            <span class="flex items-center gap-1 text-gray-600">
                              <Mail size={14} />
                              {contract.tenantEmail}
                            </span>
                          {/if}
                          {#if contract.tenantPhone}
                            <span class="flex items-center gap-1 text-gray-600">
                              <Phone size={14} />
                              {contract.tenantPhone}
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <span class="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold whitespace-nowrap">
                      Vencido hace {contract.daysExpired} {contract.daysExpired === 1 ? 'día' : 'días'}
                    </span>
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      Venció: {formatDate(contract.contractEndDate)}
                    </span>
                  </div>
                </div>
              </button>
            </GlassCard>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Contratos Próximos a Vencer -->
    {#if expiringContracts.length > 0}
      <div>
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Clock size={24} class="text-orange-600" />
          Contratos Próximos a Vencer ({expiringContracts.length})
        </h2>
        <div class="space-y-3">
          {#each expiringContracts as contract (contract.id)}
            <GlassCard hover={true}>
              <button
                on:click={() => goToProperty(contract.propertyId)}
                class="w-full text-left"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-start gap-3">
                      <div class="p-3 bg-gradient-to-br {getUrgencyColor(contract.urgency)} rounded-2xl flex-shrink-0">
                        <User size={20} class="text-white" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-gray-800 text-lg">{contract.tenantName}</h3>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                          <span class="flex items-center gap-1">
                            <Home size={14} />
                            {contract.propertyName} - {contract.roomName}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                          {#if contract.tenantEmail}
                            <span class="flex items-center gap-1 text-gray-600">
                              <Mail size={14} />
                              {contract.tenantEmail}
                            </span>
                          {/if}
                          {#if contract.tenantPhone}
                            <span class="flex items-center gap-1 text-gray-600">
                              <Phone size={14} />
                              {contract.tenantPhone}
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <span class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap
                      {contract.urgency === 'high' ? 'bg-red-100 text-red-700' : 
                       contract.urgency === 'medium' ? 'bg-orange-100 text-orange-700' : 
                       'bg-blue-100 text-blue-700'}">
                      {contract.daysUntilExpiry === 0 ? 'Vence hoy' : 
                       contract.daysUntilExpiry === 1 ? 'Vence mañana' : 
                       `${contract.daysUntilExpiry} días`}
                    </span>
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      Vence: {formatDate(contract.contractEndDate)}
                    </span>
                  </div>
                </div>
              </button>
            </GlassCard>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Sin Notificaciones -->
    {#if expiringContracts.length === 0 && expiredContracts.length === 0}
      <GlassCard hover={false}>
        <div class="text-center py-16">
          <div class="inline-flex p-6 gradient-primary rounded-full mb-4">
            <Bell size={48} class="text-white" />
          </div>
          <h3 class="text-xl font-bold text-gray-700 mb-2">
            ¡Todo al día!
          </h3>
          <p class="text-gray-500 max-w-md mx-auto">
            No hay contratos próximos a vencer ni vencidos. Todos tus inquilinos tienen contratos vigentes.
          </p>
        </div>
      </GlassCard>
    {/if}
  {/if}
</div>

