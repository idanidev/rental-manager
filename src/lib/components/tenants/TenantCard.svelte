<script>
  import {
    User,
    Phone,
    Calendar,
    Euro,
    AlertCircle,
    FileText,
    Edit,
    MoreVertical,
    RefreshCw,
  } from "lucide-svelte";
  import GlassCard from "../ui/GlassCard.svelte";
  import { createEventDispatcher } from "svelte";

  export let tenant;
  export let onClick = null;
  export let property = null;
  export let room = null;
  export let propertyId = null;

  const dispatch = createEventDispatcher();

  // Estado del menú contextual
  let showMenu = false;
  let menuButton;
  let menuX = 0;
  let menuY = 0;

  // Función helper para formatear fechas de forma segura
  function formatDate(
    dateString,
    options = { month: "short", year: "numeric" },
  ) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString("es-ES", options);
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

  function toggleMenu() {
    if (!showMenu && menuButton) {
      const rect = menuButton.getBoundingClientRect();
      menuX = rect.right - 200;
      menuY = rect.bottom + 4;
      // Asegurar que no se salga de la pantalla por la izquierda
      if (menuX < 8) menuX = 8;
    }
    showMenu = !showMenu;
  }

  function closeMenu() {
    showMenu = false;
  }

  function handleEdit() {
    closeMenu();
    dispatch("edit", { tenant });
  }

  function handleAutoRenew() {
    closeMenu();
    dispatch("auto-renew", { tenant });
  }

  function handleGenerateContract() {
    closeMenu();
    dispatch("generate-contract", {
      tenant,
      property,
      room,
      isRenewal: false,
    });
  }

  function handleCardClick() {
    if (onClick) {
      onClick();
    }
  }
</script>

<GlassCard className="!p-3 hover:shadow-lg transition-shadow">
  <div class="flex items-center gap-3">
    <!-- Clickable card content -->
    <button
      type="button"
      on:click={handleCardClick}
      class="flex-1 flex items-center gap-3 text-left min-w-0"
    >
      <!-- Avatar -->
      <div
        class="p-2.5 {tenant.active
          ? 'gradient-primary'
          : 'bg-gray-400'} rounded-lg flex-shrink-0"
      >
        <User size={20} class="text-white" />
      </div>

      <!-- Main Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h4
            class="text-base font-bold text-gray-800 dark:text-gray-200 truncate"
          >
            {tenant.full_name}
          </h4>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 {tenant.active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'}"
          >
            {tenant.active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div
          class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-1"
        >
          {#if tenant.phone}
            <div class="flex items-center gap-1">
              <Phone size={12} />
              <span class="truncate">{tenant.phone}</span>
            </div>
          {/if}
          {#if tenant.room?.monthly_rent}
            <div class="flex items-center gap-1">
              <Euro size={12} class="text-orange-600" />
              <span class="font-semibold">{tenant.room.monthly_rent}€</span>
            </div>
          {/if}
          {#if tenant.contract_end_date}
            {@const formattedDate = formatDate(tenant.contract_end_date)}
            {#if formattedDate}
              <div class="flex items-center gap-1">
                <Calendar size={12} class="text-pink-600" />
                <span>{formattedDate}</span>
              </div>
            {/if}
          {/if}
        </div>

        {#if tenant.active && isExpiringSoon}
          <div
            class="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-500"
          >
            <AlertCircle size={12} />
            <span class="font-medium">Vence en {daysUntilExpiry} días</span>
          </div>
        {:else if tenant.active && isExpired}
          <div
            class="flex items-center gap-1 text-xs text-red-700 dark:text-red-500"
          >
            <AlertCircle size={12} />
            <span class="font-medium">Contrato vencido</span>
          </div>
        {/if}
      </div>
    </button>

    <!-- Menu Button -->
    <button
      type="button"
      bind:this={menuButton}
      on:click|stopPropagation={toggleMenu}
      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
      aria-label="Más opciones"
    >
      <MoreVertical size={18} class="text-gray-600 dark:text-gray-400" />
    </button>
  </div>
</GlassCard>

<!-- Menu rendered OUTSIDE GlassCard to escape overflow:hidden -->
{#if showMenu}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-[9998]" on:click={closeMenu}></div>

  <div
    class="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]"
    style="top: {menuY}px; left: {menuX}px;"
  >
    <button
      type="button"
      on:click={handleEdit}
      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-gray-700"
    >
      <Edit size={16} class="text-blue-500" />
      <span>Editar</span>
    </button>

    {#if tenant.contract_end_date}
      <button
        type="button"
        on:click={handleAutoRenew}
        class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-gray-700"
      >
        <RefreshCw size={16} class="text-green-500" />
        <span>Renovar</span>
      </button>

      <button
        type="button"
        on:click={handleGenerateContract}
        class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
      >
        <FileText size={16} class="text-orange-500" />
        <span>Documentos</span>
      </button>
    {:else}
      <button
        type="button"
        on:click={handleGenerateContract}
        class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
      >
        <FileText size={16} class="text-orange-500" />
        <span>Generar Contrato</span>
      </button>
    {/if}
  </div>
{/if}
