<script>
  import { onMount, onDestroy } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { fade } from "svelte/transition";
  import { Bell, Check, X, Settings, Eye } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { notificationsStore, unreadCount } from "$lib/stores/notifications";
  import NotificationItem from "./NotificationItem.svelte";
  import { showToast } from "$lib/stores/toast";
  import {
    requestNotificationPermission,
    getNotificationPermission,
  } from "$lib/services/browserNotifications";

  const dispatch = createEventDispatcher();

  export let open = false;

  let activeTab = "all"; // 'all' | 'unread'
  let loading = false;
  let browserPermission = "default";
  let requestingPermission = false;
  let savedScrollY = 0;

  // Manejar el bloqueo de scroll (solo en navegador)
  function handleScrollLock() {
    if (
      !browser ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    )
      return;

    if (open && window.innerWidth < 640) {
      // Móvil: bloquear scroll
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else if (!open && savedScrollY > 0) {
      // Restaurar scroll
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, savedScrollY);
      savedScrollY = 0;
    }
  }

  // Reaccionar a cambios en `open`
  $: if (browser) {
    handleScrollLock();
  }

  // Cerrar con Escape
  function handleKeydown(e) {
    if (e.key === "Escape" && open) {
      dispatch("close");
    }
  }

  onMount(() => {
    if (browser) {
      browserPermission = getNotificationPermission();
      notificationsStore.load();
      handleScrollLock();

      // Escuchar tecla Escape
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeydown);
      }
    }
  });

  onDestroy(() => {
    // Remover listener de Escape
    if (browser && typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }

    // Asegurar que se restaure el scroll al destruir el componente
    if (browser && typeof document !== "undefined") {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (savedScrollY > 0 && typeof window !== "undefined") {
        window.scrollTo(0, savedScrollY);
      }
    }
  });

  async function requestBrowserPermission() {
    if (!browser) return;

    requestingPermission = true;
    try {
      const permission = await requestNotificationPermission();
      browserPermission = permission;

      if (permission === "granted") {
        showToast("Permisos de notificación activados", "success");
      } else if (permission === "denied") {
        showToast(
          "Permisos de notificación denegados. Puedes activarlos en la configuración del navegador.",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error al solicitar permisos:", error);
      showToast("Error al solicitar permisos", "error");
    } finally {
      requestingPermission = false;
    }
  }

  async function markAllAsRead() {
    if ($unreadCount === 0) return;

    loading = true;
    try {
      await notificationsStore.markAllAsRead();
      showToast("Todas las notificaciones marcadas como leídas", "success");
    } catch (error) {
      showToast("Error al marcar como leídas", "error");
    } finally {
      loading = false;
    }
  }

  function goToSettings() {
    dispatch("close");
    goto("/notifications");
  }

  function goToHistory() {
    dispatch("close");
    goto("/notifications");
  }

  $: filteredNotifications =
    activeTab === "unread"
      ? $notificationsStore.filter((n) => !n.read)
      : $notificationsStore;

  $: hasNotifications = filteredNotifications.length > 0;
</script>

{#if open}
  <!-- Overlay (móvil y desktop) -->
  <div
    class="fixed inset-0 bg-black/60 dark:bg-black/80 z-[9999] sm:bg-black/20"
    on:click={() => dispatch("close")}
    role="button"
    tabindex="0"
    aria-label="Cerrar panel"
    transition:fade={{ duration: 200 }}
  ></div>

  <!-- Panel de Notificaciones -->
  <div
    class="fixed sm:absolute inset-0 sm:inset-auto sm:right-0 sm:top-full sm:mt-2
           w-full sm:w-96 sm:max-w-[calc(100vw-2rem)]
           bg-white dark:bg-gray-900 sm:glass-card
           shadow-2xl border-0 sm:border sm:border-white/20
           rounded-none sm:rounded-2xl
           overflow-hidden z-[10000]
           animate-fade-in sm:animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-label="Panel de notificaciones"
    transition:fade={{ duration: 200 }}
    on:click|stopPropagation
    style="display: flex; flex-direction: column; max-height: 100vh;"
  >
    <!-- Header -->
    <div
      class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-start gap-2 flex-shrink-0 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
    >
      <!-- Botón atrás a la izquierda -->
      <button
        on:click={() => dispatch("close")}
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
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

      <div class="flex items-center gap-2">
        <div class="p-2 gradient-primary rounded-lg">
          <Bell size={20} class="text-white" />
        </div>
        <h3
          class="font-bold text-gray-900 dark:text-gray-100 text-lg gradient-text"
        >
          Notificaciones
        </h3>
        {#if $unreadCount > 0}
          <span
            class="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full"
          >
            {$unreadCount}
          </span>
        {/if}
      </div>
    </div>

    <!-- Tabs -->
    <div
      class="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50"
    >
      <button
        on:click={() => (activeTab = "all")}
        class="flex-1 px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] relative
          {activeTab === 'all'
          ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900'
          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}"
      >
        Todas
        {#if activeTab === "all"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary"
          ></div>
        {/if}
      </button>
      <button
        on:click={() => (activeTab = "unread")}
        class="flex-1 px-4 py-3 text-sm font-semibold transition-colors relative min-h-[44px]
          {activeTab === 'unread'
          ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900'
          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}"
      >
        No leídas
        {#if $unreadCount > 0 && activeTab !== "unread"}
          <span
            class="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"
          ></span>
        {/if}
        {#if activeTab === "unread"}
          <div
            class="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary"
          ></div>
        {/if}
      </button>
    </div>

    <!-- Actions Bar -->
    <div
      class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap flex-shrink-0"
    >
      {#if hasNotifications && $unreadCount > 0}
        <button
          on:click={markAllAsRead}
          disabled={loading || $unreadCount === 0}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Check size={16} />
          <span class="hidden sm:inline">Marcar todas como leídas</span>
          <span class="sm:hidden">Marcar todas</span>
        </button>
      {:else}
        <div></div>
      {/if}

      <div class="flex gap-2">
        <button
          on:click={goToSettings}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
          title="Configuración"
        >
          <Settings size={16} />
          <span class="hidden sm:inline">Configuración</span>
        </button>
        <button
          on:click={goToHistory}
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px]"
          title="Ver historial"
        >
          <Eye size={16} />
          <span class="hidden sm:inline">Historial</span>
        </button>
      </div>
    </div>

    <!-- Notifications List - Scrollable -->
    <div class="flex-1 overflow-y-auto min-h-0" style="padding-bottom: 80px;">
      {#if loading && filteredNotifications.length === 0}
        <div class="p-8 text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"
          ></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      {:else if hasNotifications}
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredNotifications as notification (notification.id)}
            <NotificationItem
              {notification}
              on:click={() => {
                if (notification.property_id) {
                  goto(`/properties/${notification.property_id}`);
                  dispatch("close");
                }
              }}
            />
          {/each}
        </div>
      {:else}
        <div class="p-8 text-center">
          <Bell size={48} class="text-gray-400 mx-auto mb-3 opacity-50" />
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {activeTab === "unread"
              ? "No hay notificaciones no leídas"
              : "No hay notificaciones aún"}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mb-6">
            {activeTab === "unread"
              ? "Todas tus notificaciones están al día"
              : "Las notificaciones aparecerán aquí cuando haya actualizaciones importantes"}
          </p>

          <!-- Botón para solicitar permisos del navegador (solo si no hay notificaciones y no tiene permisos) -->
          {#if browser && browserPermission !== "granted" && activeTab === "all"}
            <button
              on:click={requestBrowserPermission}
              disabled={requestingPermission}
              class="px-4 py-2 gradient-primary hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] mx-auto shadow-md"
            >
              {#if requestingPermission}
                <span class="flex items-center justify-center gap-2">
                  <div
                    class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                  ></div>
                  Solicitando permisos...
                </span>
              {:else if browserPermission === "denied"}
                <span>Permisos denegados</span>
              {:else}
                <span>Activar notificaciones del navegador</span>
              {/if}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer sutil y elegante -->
    <div
      class="sticky bottom-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center gap-2 flex-shrink-0"
      style="z-index: 10;"
    >
      <button
        on:click={() => dispatch("close")}
        class="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl transition-all"
      >
        <X size={18} />
        <span>Cerrar</span>
      </button>
    </div>
  </div>
{/if}

<style>
  :global(.glass-card) {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
</style>
