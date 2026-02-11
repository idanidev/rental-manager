<script>
  import { Calendar, RefreshCw, ArrowRight } from "lucide-svelte";
  import Modal from "../ui/Modal.svelte";
  import { tenantsService } from "$lib/services/tenants";
  import { showToast } from "$lib/stores/toast";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let tenant = null;

  const dispatch = createEventDispatcher();

  let loading = false;
  let contractMonths = 0;

  // Cuando el modal se abre, calcular meses desde el inquilino
  $: if (open && tenant) {
    contractMonths = tenant.contract_months || 6;
  }

  // Calcular fechas de renovación previsualizadas
  $: newStartDate = (() => {
    if (!tenant?.contract_end_date) return null;
    try {
      const currentEnd = new Date(tenant.contract_end_date);
      const nextDay = new Date(currentEnd);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    } catch {
      return null;
    }
  })();

  $: newEndDate = (() => {
    if (!newStartDate || !contractMonths) return null;
    try {
      const end = new Date(newStartDate);
      end.setMonth(end.getMonth() + parseInt(contractMonths));
      // Último día del mes
      const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);
      return lastDay;
    } catch {
      return null;
    }
  })();

  function formatDate(date) {
    if (!date) return "—";
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatInputDate(date) {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  }

  async function handleRenew() {
    if (!tenant?.id) return;
    loading = true;
    try {
      await tenantsService.renewContract(tenant.id, contractMonths);
      showToast("Contrato renovado correctamente", "success");
      open = false;
      dispatch("success");
    } catch (err) {
      showToast(err.message || "Error al renovar el contrato", "error");
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    open = false;
  }
</script>

<Modal bind:open title="Renovar Contrato" size="sm">
  {#if tenant}
    <div class="space-y-5">
      <!-- Tenant Info -->
      <div
        class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
      >
        <div class="p-2 gradient-primary rounded-lg">
          <RefreshCw size={20} class="text-white" />
        </div>
        <div>
          <p class="font-bold text-gray-800 dark:text-gray-200">
            {tenant.full_name}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Renovación de contrato
          </p>
        </div>
      </div>

      <!-- Current Contract -->
      <div>
        <h4
          class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
        >
          Contrato Actual
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Inicio</p>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {tenant.contract_start_date
                ? formatDate(new Date(tenant.contract_start_date))
                : "—"}
            </p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Fin</p>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {tenant.contract_end_date
                ? formatDate(new Date(tenant.contract_end_date))
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flex justify-center">
        <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <ArrowRight size={20} class="text-orange-500 rotate-90" />
        </div>
      </div>

      <!-- New Contract Dates -->
      <div>
        <h4
          class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
        >
          Nuevo Contrato
        </h4>

        <!-- Duration Selector -->
        <div class="mb-3">
          <label
            for="contract-months"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Duración (meses)
          </label>
          <select
            id="contract-months"
            bind:value={contractMonths}
            class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          >
            <option value={1}>1 mes</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses (1 año)</option>
            <option value={24}>24 meses (2 años)</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50"
          >
            <p class="text-xs text-orange-600 dark:text-orange-400 mb-1">
              Nuevo inicio
            </p>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {formatDate(newStartDate)}
            </p>
          </div>
          <div
            class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50"
          >
            <p class="text-xs text-orange-600 dark:text-orange-400 mb-1">
              Nuevo fin
            </p>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {formatDate(newEndDate)}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button
          type="button"
          on:click={handleClose}
          disabled={loading}
          class="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          on:click={handleRenew}
          disabled={loading || !newStartDate || !newEndDate}
          class="flex-1 px-4 py-3 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            <span>Renovando...</span>
          {:else}
            <RefreshCw size={16} />
            <span>Renovar Contrato</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</Modal>
