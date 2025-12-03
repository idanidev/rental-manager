<script>
  import { DoorOpen, User, Euro, Maximize, Home, Camera, UserPlus, UserX, Calendar, AlertCircle, MoveRight, Edit } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  import QuickCheckIn from '../tenants/QuickCheckIn.svelte';
  import QuickCheckOut from '../tenants/QuickCheckOut.svelte';
  import MoveTenantModal from '../tenants/MoveTenantModal.svelte';
  import EditTenantModal from '../tenants/EditTenantModal.svelte';
  import RoomForm from './RoomForm.svelte';
  import Modal from '../ui/Modal.svelte';
  import { storageService } from '$lib/services/storage';
  import { tenantsService } from '$lib/services/tenants';
  import { propertiesService } from '$lib/services/properties';
  import { roomsService } from '$lib/services/rooms';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  /** @typedef {import('$lib/types').Room} Room */
  /** @typedef {import('$lib/types').Tenant} Tenant */
  /** @typedef {import('$lib/types').Property} Property */
  
  /** @type {Room} */
  export let room;
  /** @type {string | null} */
  export let propertyId = null;
  /** @type {Room[]} */
  export let allRooms = [];
  /** @type {(() => void) | null} */
  export let onClick = null;
  export let showQuickActions = false;
  
  const dispatch = createEventDispatcher();
  
  let showCheckInModal = false;
  let showCheckOutModal = false;
  let showMoveModal = false;
  let showEditModal = false;
  let showEditRoomModal = false;
  /** @type {Tenant | null} */
  let tenantData = null;
  /** @type {Property | null} */
  let propertyData = null;
  /** @type {Room[]} */
  let commonRooms = [];
  
  onMount(async () => {
    if (propertyId) {
      await loadPropertyData();
      await loadCommonRooms();
    }
  });
  
  async function loadPropertyData() {
    if (!propertyId) return;
    try {
      propertyData = await propertiesService.getProperty(propertyId);
    } catch (err) {
      console.error('Error loading property:', err);
    }
  }
  
  async function loadCommonRooms() {
    if (!propertyId) return;
    try {
      const allRoomsData = await roomsService.getPropertyRooms(propertyId);
      commonRooms = (allRoomsData || []).filter((/** @type {Room} */ r) => r.room_type === 'common');
    } catch (err) {
      console.error('Error loading common rooms:', err);
    }
  }
  
  $: isCommonRoom = room.room_type === 'common';
  $: photoCount = room.photos?.length || 0;
  $: firstPhotoUrl = photoCount > 0 && room.photos?.[0] ? storageService.getPhotoUrl(room.photos[0]) : null;
  
  // Cargar datos del inquilino si existe
  $: if (room.tenant_id && propertyId) {
    loadTenant();
  }
  
  async function loadTenant() {
    if (!room?.tenant_id || !propertyId) return;
    try {
      tenantData = await tenantsService.getTenantById(room.tenant_id);
    } catch (err) {
      console.error('Error loading tenant:', err);
    }
  }
  
  // Calcular días hasta vencimiento
  $: daysUntilExpiry = tenantData?.contract_end_date 
    ? Math.floor((new Date(tenantData.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  $: isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  $: isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  
  /**
   * @param {MouseEvent | KeyboardEvent} e
   */
  function handleCheckIn(e) {
    e.stopPropagation();
    showCheckInModal = true;
  }
  
  /**
   * @param {MouseEvent | KeyboardEvent} e
   */
  function handleCheckOut(e) {
    e.stopPropagation();
    showCheckOutModal = true;
  }
  
  /**
   * @param {MouseEvent | KeyboardEvent} e
   */
  function handleMove(e) {
    e.stopPropagation();
    showMoveModal = true;
  }
  
  /**
   * @param {MouseEvent | KeyboardEvent} e
   */
  function handleEdit(e) {
    e.stopPropagation();
    showEditModal = true;
  }
  
  /**
   * @param {MouseEvent | KeyboardEvent | null} e
   */
  function handleEditRoom(e) {
    if (e) e.stopPropagation();
    showEditRoomModal = true;
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

<GlassCard className="cursor-pointer">
  <div 
    on:click={(_e) => { if (onClick) onClick(); }}
    class="w-full text-left space-y-3 relative"
    role="button"
    tabindex="0"
    on:keydown={(e) => { if (e.key === 'Enter' && onClick) onClick(); }}
  >
    <!-- Foto de fondo si existe -->
    {#if firstPhotoUrl}
      <div class="absolute inset-0 rounded-2xl overflow-hidden opacity-60 dark:opacity-20 pointer-events-none">
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
        <div class="p-2 {isCommonRoom ? 'bg-blue-500' : room.occupied ? 'gradient-primary' : 'bg-white/60 dark:bg-gray-700'} rounded-lg transition-all">
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
              <div class="flex items-center gap-0.5 text-xs text-gray-600 dark:text-gray-400">
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
                <div class="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {tenantData.email}
                </div>
              {/if}
              {#if tenantData.phone}
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  📞 {tenantData.phone}
                </div>
              {/if}
              {#if tenantData.contract_start_date}
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  📅 Inicio: {new Date(tenantData.contract_start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              {/if}
              {#if tenantData.contract_end_date}
                <div class="flex items-center text-xs font-medium
                  {isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}">
                  <Calendar size={12} class="mr-1" />
                  {#if isExpired && daysUntilExpiry !== null}
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
            <div class="flex items-center text-sm text-gray-700 dark:text-gray-300 mt-1">
              <User size={14} class="mr-1" />
              {room.tenant_name}
            </div>
          {/if}
        </div>
      </div>

      <!-- Estado con chip -->
      <div class="flex items-center gap-2">
        {#if !isCommonRoom}
          <span class="px-3 py-1 rounded-full text-xs font-semibold
            {room.occupied ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}">
            {room.occupied ? 'Ocupada' : 'Disponible'}
          </span>
        {:else}
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
            Sala Común
          </span>
        {/if}
      </div>
    </div>

    <!-- Detalles -->
    <div class="space-y-2 relative z-10">
      <div class="grid grid-cols-2 gap-2">
        {#if !isCommonRoom}
          <div class="flex items-center gap-1.5 text-xs sm:text-sm">
            <Euro size={14} class="text-orange-600" />
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
    
    <!-- Botones de acción directos - Tamaño táctil 44px -->
    {#if propertyId && showQuickActions}
      <div 
        class="flex flex-wrap gap-2 mt-4 relative z-10" 
        on:click|stopPropagation
        role="none"
        on:keydown|stopPropagation
      >
        {#if !isCommonRoom}
          {#if room.occupied}
            <button
              on:click|stopPropagation={handleCheckOut}
              class="flex-1 min-h-[44px] px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <UserX size={18} />
              <span>Check-Out</span>
            </button>
          {:else}
            <button
              on:click|stopPropagation={handleCheckIn}
              class="flex-1 min-h-[44px] px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              <span>Check-In</span>
            </button>
          {/if}
        {/if}
        <button
          on:click|stopPropagation={handleEditRoom}
          class="flex-1 min-h-[44px] px-4 py-2.5 glass-card hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Edit size={18} />
          <span>Editar</span>
        </button>
      </div>
    {/if}
    
  </div>
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
  
  {#if propertyId}
    <MoveTenantModal 
      bind:open={showMoveModal}
      tenant={tenantData}
      currentRoom={room}
      {allRooms}
      propertyId={propertyId || null}
      on:success={handleSuccess}
    />
  
    <EditTenantModal
      bind:open={showEditModal}
      tenant={tenantData}
      propertyId={propertyId || null}
      on:success={handleSuccess}
    />
  {/if}
  
  <Modal bind:open={showEditRoomModal} title="Editar Habitación" size="xl">
    <RoomForm 
      {propertyId}
      {room}
      on:success={() => {
        showEditRoomModal = false;
        handleSuccess();
        // Recargar datos de habitaciones comunes
        loadCommonRooms();
      }}
      on:cancel={() => showEditRoomModal = false}
    />
  </Modal>
{/if}
