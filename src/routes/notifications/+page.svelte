<script>
  import { onMount } from "svelte";
  import {
    Bell,
    Settings,
    Filter,
    Check,
    X,
    SlidersHorizontal,
  } from "lucide-svelte";
  import { userStore } from "$lib/stores/user";
  import { notificationsStore, unreadCount } from "$lib/stores/notifications";
  import { goto } from "$app/navigation";
  import GlassCard from "$lib/components/ui/GlassCard.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import NotificationItem from "$lib/components/notifications/NotificationItem.svelte";
  import NotificationSettings from "$lib/components/notifications/NotificationSettings.svelte";
  import { showToast } from "$lib/stores/toast";

  let loading = true;
  let activeTab = "list"; // 'list' | 'settings'
  let activeFilter = "all"; // 'all' | 'unread' | 'contract_expiring' | 'weekly_report' | 'invitation'

  onMount(async () => {
    if ($userStore?.id) {
      await notificationsStore.load();
    }
    loading = false;
  });

  async function markAllAsRead() {
    if ($unreadCount === 0) return;

    try {
      await notificationsStore.markAllAsRead();
      showToast("Todas las notificaciones marcadas como leídas", "success");
    } catch (error) {
      showToast("Error al marcar como leídas", "error");
    }
  }

  function handleNotificationClick(notification) {
    if (notification.property_id) {
      goto(`/properties/${notification.property_id}`);
    }
  }

  $: filteredNotifications = (() => {
    let filtered = $notificationsStore;

    if (activeFilter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (activeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === activeFilter);
    }

    return filtered;
  })();

  $: hasNotifications = filteredNotifications.length > 0;

  const filterOptions = [
    { value: "all", label: "Todas las notificaciones" },
    { value: "unread", label: "No leídas" },
    { value: "contract_expiring", label: "Contratos" },
    { value: "weekly_report", label: "Resúmenes semanales" },
    { value: "invitation", label: "Invitaciones" },
  ];
</script>

<svelte:head>
  <title>Notificaciones - Rental Manager</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6 animate-fade-in px-4">
  <!-- Header con Tabs -->
  <div
    class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
    <div class="flex items-center gap-3 w-full sm:w-auto">
      <!-- Botón Volver (solo móvil) -->
      <button
        on:click={() => goto("/")}
        class="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Volver"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-700 dark:text-gray-300"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div class="flex-1">
        <h1
          class="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-3"
        >
          <Bell size={32} />
          Notificaciones
        </h1>
        {#if activeTab === "list"}
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {#if $unreadCount > 0}
              Tienes {$unreadCount} notificación{$unreadCount === 1 ? "" : "es"}
              no
              {$unreadCount === 1 ? "leída" : "leídas"}
            {:else}
              Todas las notificaciones están leídas
            {/if}
          </p>
        {/if}
      </div>
    </div>

    <!-- Tab Switcher -->
    <div
      class="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto"
    >
      <button
        on:click={() => (activeTab = "list")}
        class="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 justify-center
          {activeTab === 'list'
          ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
      >
        <Bell size={16} />
        Lista
      </button>
      <button
        on:click={() => (activeTab = "settings")}
        class="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 justify-center
          {activeTab === 'settings'
          ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
      >
        <Settings size={16} />
        Ajustes
      </button>
    </div>
  </div>

  {#if activeTab === "list"}
    <!-- Controles y Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Selector de Filtros Simplificado -->
      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <Filter size={18} class="text-gray-400" />
        </div>
        <select
          bind:value={activeFilter}
          class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none cursor-pointer shadow-sm"
        >
          {#each filterOptions as option}
            <option value={option.value}>
              {option.label}
              {option.value === "all" ? ` (${$notificationsStore.length})` : ""}
              {option.value === "unread" ? ` (${$unreadCount})` : ""}
            </option>
          {/each}
        </select>
        <div
          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
        >
          <SlidersHorizontal size={14} class="text-gray-400" />
        </div>
      </div>

      {#if $unreadCount > 0}
        <Button
          variant="secondary"
          on:click={markAllAsRead}
          className="whitespace-nowrap min-h-[42px]"
        >
          <Check size={18} class="inline mr-1.5" />
          Marcar leídas
        </Button>
      {/if}
    </div>

    <!-- Lista de Notificaciones -->
    {#if loading}
      <GlassCard>
        <div class="flex items-center justify-center py-20">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Cargando notificaciones...</p>
          </div>
        </div>
      </GlassCard>
    {:else if hasNotifications}
      <div class="space-y-3">
        {#each filteredNotifications as notification (notification.id)}
          <GlassCard>
            <NotificationItem
              {notification}
              on:click={() => handleNotificationClick(notification)}
            />
          </GlassCard>
        {/each}
      </div>
    {:else}
      <GlassCard>
        <div class="text-center py-16">
          <Bell size={64} class="text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No hay notificaciones
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {activeFilter === "unread"
              ? "Todas tus notificaciones están al día"
              : `No tienes notificaciones en la categoría seleccionada`}
          </p>
        </div>
      </GlassCard>
    {/if}
  {:else}
    <!-- Vista de Ajustes Embedida -->
    <NotificationSettings />
  {/if}
</div>
