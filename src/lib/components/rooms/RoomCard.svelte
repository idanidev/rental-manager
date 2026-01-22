<script>
  import {
    DoorOpen,
    User,
    Euro,
    Maximize,
    Home,
    Camera,
    UserPlus,
    UserX,
    Calendar,
    AlertCircle,
    MoveRight,
    Edit,
    Check,
    LogOut,
    FileText,
    Download,
  } from "lucide-svelte";
  import GlassCard from "../ui/GlassCard.svelte";
  import QuickCheckIn from "../tenants/QuickCheckIn.svelte";
  import QuickCheckOut from "../tenants/QuickCheckOut.svelte";
  import MoveTenantModal from "../tenants/MoveTenantModal.svelte";
  import EditTenantModal from "../tenants/EditTenantModal.svelte";
  import RoomForm from "./RoomForm.svelte";
  import RoomAdGenerator from "./RoomAdGenerator.svelte";
  import Modal from "../ui/Modal.svelte";
  import { storageService } from "$lib/services/storage";
  import { tenantsService } from "$lib/services/tenants";
  import { propertiesService } from "$lib/services/properties";
  import { roomsService } from "$lib/services/rooms";
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";

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
      console.error("Error loading property:", err);
    }
  }

  async function loadCommonRooms() {
    if (!propertyId) return;
    try {
      const allRoomsData = await roomsService.getPropertyRooms(propertyId);
      commonRooms = (allRoomsData || []).filter(
        (/** @type {Room} */ r) => r.room_type === "common",
      );
    } catch (err) {
      console.error("Error loading common rooms:", err);
    }
  }

  $: isCommonRoom = room.room_type === "common";
  $: photoCount = room.photos?.length || 0;
  $: firstPhotoUrl =
    photoCount > 0 && room.photos?.[0]
      ? storageService.getPhotoUrl(room.photos[0])
      : null;

  // Cargar datos del inquilino si existe
  $: if (room.tenant_id && propertyId) {
    loadTenant();
  }

  async function loadTenant() {
    if (!room?.tenant_id || !propertyId) return;
    try {
      tenantData = await tenantsService.getTenantById(room.tenant_id);
    } catch (err) {
      console.error("Error loading tenant:", err);
    }
  }

  // Función helper para formatear fechas de forma segura
  /**
   * @param {string | null | undefined} dateString
   */
  function formatDate(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }

  // Calcular días hasta vencimiento
  $: daysUntilExpiry = tenantData?.contract_end_date
    ? (() => {
        try {
          const endDate = new Date(tenantData.contract_end_date);
          if (isNaN(endDate.getTime())) return null;
          return Math.floor(
            (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          );
        } catch {
          return null;
        }
      })()
    : null;

  $: isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  $: isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  // Calcular progreso del contrato
  $: contractProgress = (() => {
    if (
      !tenantData?.contract_start_date ||
      !tenantData?.contract_end_date ||
      !tenantData?.contract_months
    )
      return null;
    try {
      const startDate = new Date(tenantData.contract_start_date);
      const endDate = new Date(tenantData.contract_end_date);
      const today = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

      const totalDays = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const passedDays = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const percentage =
        totalDays > 0
          ? Math.max(0, Math.min(100, (passedDays / totalDays) * 100))
          : 0;
      const monthsPassed = Math.floor(passedDays / 30);

      return {
        percentage,
        monthsPassed,
        totalMonths: tenantData.contract_months,
      };
    } catch {
      return null;
    }
  })();

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
        console.error("Error reloading tenant:", err);
      }
    }
    dispatch("changed");
  }
</script>

<GlassCard className="cursor-pointer overflow-hidden">
  <div
    on:click={(_e) => {
      if (onClick) onClick();
    }}
    class="w-full text-left space-y-4 relative"
    role="button"
    tabindex="0"
    on:keydown={(e) => {
      if (e.key === "Enter" && onClick) onClick();
    }}
  >
    <!-- Foto de portada si existe -->
    {#if firstPhotoUrl}
      <div class="relative -m-4 mb-0 h-48 overflow-hidden">
        <img
          src={firstPhotoUrl}
          alt={room.name}
          class="w-full h-full object-cover"
        />
        <!-- Gradiente oscuro en la parte inferior -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        ></div>

        <!-- Contador de fotos -->
        {#if photoCount > 1}
          <div
            class="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg"
          >
            <Camera size={14} class="text-white" />
            <span class="text-white text-xs font-semibold">{photoCount}</span>
          </div>
        {/if}

        <!-- Nombre de la habitación sobre la foto -->
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <h3 class="text-2xl font-bold text-white drop-shadow-lg">
            {room.name}
          </h3>
        </div>
      </div>
    {:else}
      <!-- Sin foto - mostrar nombre normalmente -->
      <div class="relative">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {room.name}
        </h3>
      </div>
    {/if}

    <!-- Chips de estado -->
    <div class="relative z-10 {firstPhotoUrl ? 'mt-4' : ''}">
      <div class="flex flex-wrap gap-2 mb-3">
        {#if !isCommonRoom}
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
            {room.occupied
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40'}"
          >
            {#if room.occupied}
              <Check size={14} />
              Ocupada
            {:else}
              <DoorOpen size={14} />
              Disponible
            {/if}
          </span>

          {#if tenantData}
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-md"
            >
              <User size={14} class="text-gray-700 dark:text-gray-300" />
              <span class="text-gray-900 dark:text-gray-100"
                >{tenantData.full_name}</span
              >
            </span>
          {/if}
        {:else}
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/40"
          >
            <Home size={14} />
            Sala Común
          </span>
        {/if}
      </div>
    </div>

    <!-- Grid de Info GRANDE (Precio + Tamaño) -->
    {#if !isCommonRoom}
      <div
        class="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/80 dark:backdrop-blur-md rounded-xl relative z-10 border border-gray-200 dark:border-gray-700/50 shadow-sm"
      >
        <div class="flex flex-col">
          <span
            class="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1"
            >Renta mensual</span
          >
          <span
            class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent"
            >{room.monthly_rent}€</span
          >
        </div>
        {#if room.size_sqm}
          <div class="flex flex-col">
            <span
              class="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1"
              >Tamaño</span
            >
            <span
              class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
              >{room.size_sqm} m²</span
            >
          </div>
        {/if}
      </div>
    {/if}

    <!-- Sección de Contrato con Progress Bar -->
    {#if tenantData && !isCommonRoom && tenantData.contract_start_date && tenantData.contract_end_date}
      <div
        class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl relative z-10"
      >
        <div class="space-y-2 mb-3">
          {#if tenantData.contract_start_date}
            {@const formattedStartDate = formatDate(
              tenantData.contract_start_date,
            )}
            {#if formattedStartDate}
              <div
                class="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-300"
              >
                <Calendar size={14} />
                <span>Inicio: {formattedStartDate}</span>
              </div>
            {/if}
          {/if}
          {#if tenantData.contract_end_date}
            {@const formattedEndDate = formatDate(tenantData.contract_end_date)}
            {#if formattedEndDate}
              <div
                class="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-300"
              >
                <Calendar size={14} />
                <span
                  class={isExpired
                    ? "text-red-600 dark:text-red-400 font-bold"
                    : isExpiringSoon
                      ? "text-orange-600 dark:text-orange-400 font-bold"
                      : ""}
                >
                  {isExpired && daysUntilExpiry !== null
                    ? `Vencido hace ${Math.abs(daysUntilExpiry)} días`
                    : isExpiringSoon
                      ? `Vence en ${daysUntilExpiry} días`
                      : `Vence: ${formattedEndDate}`}
                </span>
              </div>
            {/if}
          {/if}
        </div>

        {#if contractProgress}
          <div class="space-y-1.5">
            <div
              class="w-full h-2 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                style="width: {contractProgress.percentage}%"
              ></div>
            </div>
            <p class="text-xs text-amber-800 dark:text-amber-300 font-semibold">
              {contractProgress.monthsPassed} de {contractProgress.totalMonths} meses
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Botones de acción - Grid 2 columnas -->
    {#if propertyId && showQuickActions}
      <div
        class="grid grid-cols-2 gap-2 relative z-10"
        on:click|stopPropagation
        role="none"
        on:keydown|stopPropagation
      >
        <button
          on:click|stopPropagation={handleEditRoom}
          class="flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          <Edit size={18} />
          <span>Editar</span>
        </button>

        {#if !isCommonRoom}
          {#if room.occupied}
            <button
              on:click|stopPropagation={handleCheckOut}
              class="flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut size={18} />
              <span>Check-Out</span>
            </button>
          {:else}
            <button
              on:click|stopPropagation={handleCheckIn}
              class="flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus size={18} />
              <span>Check-In</span>
            </button>
          {/if}
        {:else}
          <div></div>
        {/if}
      </div>

      <!-- Botón de generar PDF del anuncio (solo para habitaciones disponibles) -->
      {#if !isCommonRoom && !room.occupied && propertyData}
        <div class="relative z-10 mt-2" on:click|stopPropagation role="none">
          <RoomAdGenerator {room} property={propertyData} {commonRooms} />
        </div>
      {/if}
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
      on:cancel={() => (showEditRoomModal = false)}
    />
  </Modal>
{/if}
