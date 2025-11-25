<script>
  import { DoorOpen, User, Euro, Maximize, Home, Camera, UserPlus, UserX, Calendar, AlertCircle, MoveRight, Edit, Settings, FileText, MoreVertical, Download } from 'lucide-svelte';
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
  import { pdfService } from '$lib/services/pdf';
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '$lib/stores/theme';
  
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
  let showEditRoomModal = false;
  let tenantData = null;
  let propertyData = null;
  let commonRooms = [];
  let showMenu = false;
  let menuContainer = null;
  let menuButton = null;
  let cleanupMenuListener = null;
  let generatingAd = false;
  let adError = '';
  let menuStyle = '';
  
  // Cerrar menú al hacer clic fuera
  $: if (showMenu && typeof window !== 'undefined') {
    if (cleanupMenuListener) {
      cleanupMenuListener();
      cleanupMenuListener = null;
    }
    
    const handleClickOutside = (e) => {
      if (menuContainer && !menuContainer.contains(e.target)) {
        showMenu = false;
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      cleanupMenuListener = () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    }, 0);
  } else if (cleanupMenuListener) {
    cleanupMenuListener();
    cleanupMenuListener = null;
  }
  
  onDestroy(() => {
    if (cleanupMenuListener) {
      cleanupMenuListener();
    }
  });
  
  onMount(async () => {
    if (propertyId) {
      await loadPropertyData();
      await loadCommonRooms();
    }
  });
  
  async function loadPropertyData() {
    try {
      propertyData = await propertiesService.getProperty(propertyId);
    } catch (err) {
      console.error('Error loading property:', err);
    }
  }
  
  async function loadCommonRooms() {
    try {
      const allRooms = await roomsService.getPropertyRooms(propertyId);
      commonRooms = allRooms.filter(r => r.room_type === 'common');
    } catch (err) {
      console.error('Error loading common rooms:', err);
    }
  }
  
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
  
  function handleEditRoom(e) {
    if (e) e.stopPropagation();
    showEditRoomModal = true;
  }
  
  // Cerrar menú al hacer clic fuera
  $: if (showMenu && typeof window !== 'undefined') {
    if (cleanupMenuListener) {
      cleanupMenuListener();
      cleanupMenuListener = null;
    }
    
    const handleClickOutside = (e) => {
      if (menuContainer && !menuContainer.contains(e.target)) {
        showMenu = false;
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      cleanupMenuListener = () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    }, 0);
  } else if (cleanupMenuListener) {
    cleanupMenuListener();
    cleanupMenuListener = null;
  }
  
  onDestroy(() => {
    if (cleanupMenuListener) {
      cleanupMenuListener();
    }
  });
  
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
  
  async function handleGenerateAd(e) {
    if (e) e.stopPropagation();
    
    if (!room || !propertyData) {
      adError = 'Faltan datos de la habitación o propiedad';
      return;
    }
    
    generatingAd = true;
    adError = '';
    showMenu = false;
    
    try {
      // Obtener URLs completas de las fotos de la habitación
      const roomPhotoUrls = (room.photos || []).map(photo => {
        if (typeof photo === 'string') {
          return storageService.getPhotoUrl(photo);
        }
        return photo.url || photo;
      });
      
      // Obtener URLs completas de las fotos de zonas comunes
      const commonRoomsWithPhotos = commonRooms.map(r => ({
        name: r.name,
        photos: (r.photos || []).map(photo => {
          if (typeof photo === 'string') {
            return storageService.getPhotoUrl(photo);
          }
          return photo.url || photo;
        })
      }));
      
      const adData = {
        roomName: room.name,
        propertyName: propertyData.name,
        propertyAddress: propertyData.address,
        monthlyRent: room.monthly_rent || 0,
        sizeSqm: room.size_sqm || null,
        description: propertyData.description || `Habitación en ${propertyData.name}, ${propertyData.address}`,
        photos: roomPhotoUrls,
        commonRooms: commonRoomsWithPhotos,
        depositAmount: room.deposit_amount || null,
        expenses: null
      };
      
      await pdfService.generateRoomAd(adData);
    } catch (err) {
      adError = err.message || 'Error al generar el anuncio';
      console.error('Error generating ad:', err);
    } finally {
      generatingAd = false;
    }
  }
</script>

<GlassCard className="cursor-pointer">
  <div 
    on:click={(e) => { if (!showMenu && onClick) onClick(); }}
    class="w-full text-left space-y-3 relative"
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && onClick && onClick()}
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
            <div class="flex items-center text-sm text-gray-700 dark:text-gray-300 mt-1">
              <User size={14} class="mr-1" />
              {room.tenant_name}
            </div>
          {/if}
        </div>
      </div>

      <!-- Estado y Menú de 3 puntos -->
      <div class="flex items-center gap-2 relative" bind:this={menuContainer}>
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
        {#if propertyId}
          <button
            bind:this={menuButton}
            on:click|stopPropagation={(e) => { 
              e.stopPropagation(); 
              if (!showMenu && menuButton) {
                // Calcular posición antes de mostrar el menú
                const rect = menuButton.getBoundingClientRect();
                menuStyle = `top: ${rect.bottom + 4}px; right: ${window.innerWidth - rect.right}px;`;
              }
              showMenu = !showMenu; 
            }}
            class="flex items-center justify-center p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative z-10"
            aria-label="Más opciones"
          >
            <MoreVertical size={16} class="text-gray-600 dark:text-gray-400" />
          </button>
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
    
  </div>
</GlassCard>

<!-- Menú dropdown (fuera del GlassCard para z-index correcto) -->
{#if showMenu}
  <!-- Overlay para bloquear contenido de atrás -->
  <div
    class="fixed inset-0 z-[99998]"
    style="background-color: rgba(0, 0, 0, 0.1);"
    on:click|stopPropagation={(e) => { e.stopPropagation(); showMenu = false; }}
    on:touchstart|stopPropagation={(e) => { e.stopPropagation(); showMenu = false; }}
    aria-hidden="true"
  ></div>
  
  <div 
    class="fixed w-48 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[99999]"
    style="background-color: {$theme === 'dark' ? 'rgb(30, 41, 59)' : 'rgb(255, 255, 255)'} !important; {menuStyle}"
    on:click|stopPropagation
  >
    <button
      on:click|stopPropagation={(e) => { e.stopPropagation(); handleEditRoom(e); showMenu = false; }}
      class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm"
      style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;"
    >
      <Settings size={14} style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;" />
      <span>Editar habitación</span>
    </button>
    {#if !isCommonRoom}
      <button
        on:click|stopPropagation={(e) => { e.stopPropagation(); handleEdit(e); showMenu = false; }}
        class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm"
        style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;"
      >
        <Edit size={14} style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;" />
        <span>Editar inquilino</span>
      </button>
      <button
        on:click|stopPropagation={(e) => { e.stopPropagation(); handleMove(e); showMenu = false; }}
        class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm"
        style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;"
      >
        <MoveRight size={14} style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;" />
        <span>Mover inquilino</span>
      </button>
      <div class="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
      <button
        on:click|stopPropagation={handleGenerateAd}
        disabled={generatingAd || !propertyData}
        class="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        style="color: rgb(29, 78, 216) !important;"
      >
        <Download size={14} style="color: rgb(29, 78, 216) !important;" />
        <span>{generatingAd ? 'Generando...' : 'Anuncio PDF'}</span>
      </button>
      {#if room.occupied}
        <button
          on:click|stopPropagation={(e) => { e.stopPropagation(); handleCheckOut(e); showMenu = false; }}
          class="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-sm"
          style="color: rgb(220, 38, 38) !important;"
        >
          <UserX size={14} style="color: rgb(220, 38, 38) !important;" />
          <span>Check-Out</span>
        </button>
      {:else}
        <button
          on:click|stopPropagation={(e) => { e.stopPropagation(); handleCheckIn(e); showMenu = false; }}
          class="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-left text-sm"
          style="color: rgb(22, 163, 74) !important;"
        >
          <UserPlus size={14} style="color: rgb(22, 163, 74) !important;" />
          <span>Check-In</span>
        </button>
      {/if}
    {/if}
  </div>
{/if}

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
