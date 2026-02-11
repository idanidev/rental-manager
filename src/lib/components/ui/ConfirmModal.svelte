<script>
  import Modal from "./Modal.svelte";
  import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-svelte";

  export let open = false;
  export let title = "Confirmar acción";
  export let message = "¿Estás seguro?";
  export let confirmText = "Confirmar";
  export let cancelText = "Cancelar";
  export let variant = "warning"; // 'warning' | 'danger' | 'info' | 'success'
  export let loading = false;
  export let onConfirm = () => {};
  export let onCancel = () => {};

  const variants = {
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-900/30",
      buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    danger: {
      icon: XCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-50 dark:bg-red-900/30",
      buttonClass: "bg-red-500 hover:bg-red-600 text-white",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
      iconBg: "bg-green-50 dark:bg-green-900/30",
      buttonClass: "bg-green-500 hover:bg-green-600 text-white",
    },
  };

  $: config = variants[variant] || variants.warning;

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    open = false;
    onCancel();
  }
</script>

<Modal bind:open {title} size="sm">
  <div class="flex flex-col items-center text-center py-2">
    <!-- Icon -->
    <div
      class="w-16 h-16 rounded-full {config.iconBg} flex items-center justify-center mb-4"
    >
      <svelte:component this={config.icon} size={32} class={config.iconColor} />
    </div>

    <!-- Message -->
    <p class="text-gray-600 dark:text-gray-300 text-base mb-2">{message}</p>

    <!-- Extra content slot -->
    <slot />
  </div>

  <!-- Actions -->
  <div class="flex gap-3 mt-4">
    <button
      type="button"
      on:click={handleCancel}
      disabled={loading}
      class="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
    >
      {cancelText}
    </button>
    <button
      type="button"
      on:click={handleConfirm}
      disabled={loading}
      class="flex-1 px-4 py-3 rounded-xl font-semibold {config.buttonClass} transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {#if loading}
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
            fill="none"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Procesando...</span>
      {:else}
        {confirmText}
      {/if}
    </button>
  </div>
</Modal>
