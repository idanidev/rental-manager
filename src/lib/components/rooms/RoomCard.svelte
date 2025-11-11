<script>
  import { DoorOpen, User, Euro, Maximize, Home, Camera, UserPlus, UserX, Calendar, AlertCircle, MoveRight, Edit } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  import QuickCheckIn from '../tenants/QuickCheckIn.svelte';
  import QuickCheckOut from '../tenants/QuickCheckOut.svelte';
  import MoveTenantModal from '../tenants/MoveTenantModal.svelte';
  import EditTenantModal from '../tenants/EditTenantModal.svelte';
  import { storageService } from '$lib/services/storage';
  import { tenantsService } from '$lib/services/tenants';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let room;
  export let propertyId = null;
  export let allRooms = [];
  export let onClick = null;
  export let showQuickActions = false;
  
  const dispatch = createEventDispatcher();
  
  let showCheckInModal = false;
  let showCheckOutModal = false;
  let showMoveModal = false;
  let showEditModal = false;
  let tenantData = null;
  
  $: isCommonRoom = room.room_type === 'common';
  $: photoCount = room.photos?.length || 0;
  $: firstPhotoUrl = photoCount > 0 ? storageService.getPhotoUrl(room.photos[0]) : null;
  
  // Cargar datos del inquilino si existe
  $: if (room.tenant_id && propertyId) {
    loadTenant();
  }
  
  async function loadTenant() {
    try {
      tenantData = await tenantsService.getTenantById(room.tenant_id);
    } catch (err) {
      console.error('Error loading tenant:', err);
    }
  }
  
  // Calcular días hasta vencimiento
  $: daysUntilExpiry = tenantData?.contract_end_date 
    ? Math.floor((new Date(tenantData.contract_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  
  $: isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  $: isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  
  function handleCheckIn(e) {
    e.stopPropagation();
    showCheckInModal = true;
  }
  
  function handleCheckOut(e) {
    e.stopPropagation();
    showCheckOutModal = true;
  }
  
  function handleMove(e) {
    e.stopPropagation();
    showMoveModal = true;
  }
  
  function handleEdit(e) {
    e.stopPropagation();
    showEditModal = true;
  }
  
  async function handleSuccess() {
    // Recargar datos del inquilino
    if (room.tenant_id && propertyId) {
      try {
        tenantData = await tenantsService.getTenantById(room.tenant_id);
      } catch (err) {
        console.error('Error reloading tenant:', err);
      }
    }
    dispatch('changed');
  }
</script>

<GlassCard>
  <button 
    on:click={onClick}
    class="w-full text-left space-y-3 relative"
    disabled={!onClick}
  >
    <!-- Foto de fondo si existe -->
    {#if firstPhotoUrl}
      <div class="absolute inset-0 rounded-2xl overflow-hidden opacity-10 pointer-events-none">
        <img 
          src={firstPhotoUrl} 
          alt={room.name}
          class="w-full h-full object-cover"
        />
      </div>
    {/if}
    
    <!-- Header -->
    <div class="flex items-center justify-between relative z-10">
      <div class="flex items-center gap-2">
        <div class="p-2 {isCommonRoom ? 'bg-blue-500' : room.occupied ? 'gradient-primary' : 'bg-gray-200'} rounded-lg transition-all">
          {#if isCommonRoom}
            <Home size={20} class="text-white" />
          {:else}
            <DoorOpen size={20} class="{room.occupied ? 'text-white' : 'text-gray-500'}" />
          {/if}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h4 class="text-base sm:text-lg font-bold text-gray-800">
              {room.name}
            </h4>
            {#if photoCount > 0}
              <div class="flex items-center gap-0.5 text-xs text-gray-500">
                <Camera size={10} />
                <span>{photoCount}</span>
              </div>
            {/if}
          </div>
          {#if isCommonRoom}
            <div class="text-xs text-blue-600 font-medium mt-1">
              Sala Común
            </div>
          {:else if tenantData}
            <div class="flex flex-col gap-0.5 mt-1">
              <div class="flex items-center text-sm text-gray-800 font-medium">
                <User size={14} class="mr-1" />
                {tenantData.full_name}
              </div>
              {#if tenantData.email}
                <div class="text-xs text-gray-500 truncate">
                  {tenantData.email}
                </div>
              {/if}
              {#if tenantData.phone}
                <div class="text-xs text-gray-500">
                  📞 {tenantData.phone}
                </div>
              {/if}
              {#if tenantData.contract_start_date}
                <div class="text-xs text-gray-500">
                  📅 Inicio: {new Date(tenantData.contract_start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              {/if}
              {#if tenantData.contract_end_date}
                <div class="flex items-center text-xs font-medium
                  {isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-500'}">
                  <Calendar size={12} class="mr-1" />
                  {#if isExpired}
                    Vencido hace {Math.abs(daysUntilExpiry)} días
                  {:else if isExpiringSoon}
                    Vence en {daysUntilExpiry} días
                  {:else}
                    Vence: {new Date(tenantData.contract_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {/if}
                </div>
              {/if}
            </div>
          {:else if room.tenant_name}
            <div class="flex items-center text-sm text-gray-600 mt-1">
              <User size={14} class="mr-1" />
              {room.tenant_name}
            </div>
          {/if}
        </div>
      </div>

      <!-- Estado -->
      {#if !isCommonRoom}
        <span class="px-2 py-1 rounded-full text-xs font-semibold
          {room.occupied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
          {room.occupied ? '✓' : '○'}
        </span>
      {:else}
        <span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          🏠
        </span>
      {/if}
    </div>

    <!-- Detalles -->
    <div class="space-y-2 relative z-10">
      <div class="grid grid-cols-2 gap-2">
        {#if !isCommonRoom}
          <div class="flex items-center gap-1.5 text-xs sm:text-sm">
            <Euro size={14} class="text-purple-600" />
            <span class="font-semibold">{room.monthly_rent}€/mes</span>
          </div>
        {/if}
        
        {#if room.size_sqm}
          <div class="flex items-center gap-1.5 text-xs sm:text-sm">
            <Maximize size={14} class="text-pink-600" />
            <span class="font-semibold">{room.size_sqm} m²</span>
          </div>
        {/if}
      </div>
      
      <!-- Alertas de contrato -->
      {#if tenantData && !isCommonRoom && (isExpired || isExpiringSoon)}
        <div class="bg-{isExpired ? 'red' : 'orange'}-50 border border-{isExpired ? 'red' : 'orange'}-200 rounded-lg p-2 flex items-center gap-2">
          <AlertCircle size={14} class="text-{isExpired ? 'red' : 'orange'}-600 flex-shrink-0" />
          <p class="text-xs text-{isExpired ? 'red' : 'orange'}-800 font-medium">
            {isExpired ? '⚠️ Contrato vencido' : '⏰ Contrato por vencer'}
          </p>
        </div>
      {/if}
    </div>
    
    <!-- Botones de Acción Rápida -->
    {#if showQuickActions && !isCommonRoom && propertyId}
      <div class="relative z-10 pt-2 border-t border-gray-200/50 mt-3 space-y-2">
        {#if room.occupied}
          <div class="grid grid-cols-3 gap-1.5">
            <button
              on:click={handleEdit}
              class="flex items-center justify-center gap-1 px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs font-medium"
            >
              <Edit size={14} />
              <span class="hidden sm:inline">Editar</span>
            </button>
            <button
              on:click={handleMove}
              class="flex items-center justify-center gap-1 px-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
            >
              <MoveRight size={14} />
              <span class="hidden sm:inline">Mover</span>
            </button>
            <button
              on:click={handleCheckOut}
              class="flex items-center justify-center gap-1 px-2 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-medium"
            >
              <UserX size={14} />
              <span class="hidden sm:inline">Salida</span>
            </button>
          </div>
        {:else}
          <button
            on:click={handleCheckIn}
            class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
          >
            <UserPlus size={16} />
            Añadir Inquilino
          </button>
        {/if}
      </div>
    {/if}
  </button>
</GlassCard>

<!-- Modales de Check-In/Check-Out/Move (fuera del GlassCard) -->
{#if propertyId}
  <QuickCheckIn 
    bind:open={showCheckInModal} 
    {room} 
    {propertyId}
    on:success={handleSuccess}
  />
  
  <QuickCheckOut 
    bind:open={showCheckOutModal} 
    {room}
    on:success={handleSuccess}
  />
  
  <MoveTenantModal 
    bind:open={showMoveModal}
    tenant={tenantData}
    currentRoom={room}
    {allRooms}
    {propertyId}
    on:success={handleSuccess}
  />
  
  <EditTenantModal
    bind:open={showEditModal}
    tenant={tenantData}
    {propertyId}
    on:success={handleSuccess}
  />
{/if}
