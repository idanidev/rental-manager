<script>
  import { FileText, Download, X, File } from "lucide-svelte";
  import Modal from "../ui/Modal.svelte";
  import Button from "../ui/Button.svelte";
  import { contractService } from "$lib/services/contract";
  import { showToast } from "$lib/stores/toast";
  import { userStore } from "$lib/stores/user";

  export let open = false;
  export let tenant = null;
  export let property = null;
  export let room = null;
  export let isRenewal = false; // Si es true, es una renovación de contrato

  let loading = false;
  let loadingFormat = ""; // 'word' o 'pdf'
  let error = "";

  $: canGenerate = tenant && property;

  // Determinar si el contrato está caducado
  $: isExpired = tenant?.contract_end_date
    ? (() => {
        try {
          const endDate = new Date(tenant.contract_end_date);
          if (isNaN(endDate.getTime())) return false;
          return endDate < new Date();
        } catch {
          return false;
        }
      })()
    : false;

  $: modalTitle =
    isRenewal || isExpired ? "Renovar Contrato" : "Generar Contrato";

  // Precalcular datos del contrato para vista previa
  $: contractData = canGenerate ? getContractData() : null;

  // Helper para calcular fecha fin (igual que en TenantForm)
  function calculateEndDate(startDate, months) {
    if (!startDate || !months) return "";
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));

    // Obtener último día del mes
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0); // día 0 del siguiente mes = último día mes actual

    return lastDay.toISOString();
  }

  function getContractData() {
    // Obtener la habitación asignada al inquilino si no se proporciona
    let tenantRoom = room;
    if (!tenantRoom && tenant.room) {
      tenantRoom = tenant.room;
    }

    // Si es renovación, calcular nuevas fechas (solo fin, respetando inicio)
    let startDate = tenant.contract_start_date || new Date().toISOString();
    let endDate = tenant.contract_end_date || new Date().toISOString();

    if (isRenewal) {
      try {
        // Corrección: Fecha inicio renovación = Fecha fin actual + 1 día
        if (tenant.contract_end_date) {
          const currentEnd = new Date(tenant.contract_end_date);
          const nextDay = new Date(currentEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          startDate = nextDay.toISOString();
        }

        // Calculamos fecha fin = nueva fecha inicio + duración -> fin de mes
        const months = tenant.contract_months || 6;
        endDate = calculateEndDate(startDate, months);
      } catch (err) {
        console.error("Error calculando fechas de renovación:", err);
      }
    } else {
      // Si NO es renovación (es ver actual o generar nuevo), recalculamos la fecha fin
      // para asegurar consistencia con la duración (meses)
      try {
        const months = tenant.contract_months || 6;
        // Solo recalculamos si tenemos start_date, de lo contrario fallback a lo guardado
        if (tenant.contract_start_date) {
          endDate = calculateEndDate(tenant.contract_start_date, months);
        }
      } catch (err) {
        console.error("Error recalculando fecha fin contrato:", err);
      }
    }

    return {
      tenantName: tenant.full_name || "",
      tenantDni: tenant.dni || "",
      tenantEmail: tenant.email || "",
      tenantPhone: tenant.phone || "",
      tenantCurrentAddress: tenant.current_address || "",
      propertyName: property.name || "",
      propertyAddress: property.address || "",
      roomName: tenantRoom?.name || "Habitación",
      monthlyRent: tenantRoom?.monthly_rent || tenant.monthly_rent || 0,
      depositAmount: tenant.deposit_amount || 0,
      startDate: startDate,
      endDate: endDate,
      contractMonths: tenant.contract_months || 6,
      contractNotes: tenant.contract_notes || "",
      ownerName:
        $userStore?.user_metadata?.owner_name || "M.ª Ángeles Díaz Trillo",
      ownerDni: $userStore?.user_metadata?.owner_dni || "03093405C",
    };
  }

  async function handleGenerate(format = "word") {
    if (!canGenerate) {
      error = "Faltan datos necesarios para generar el contrato";
      return;
    }

    loading = true;
    loadingFormat = format;
    error = "";

    try {
      const contractData = getContractData();

      if (format === "pdf") {
        await contractService.generateContractAsPDF(contractData);
        showToast("Contrato PDF generado correctamente", "success");
      } else {
        await contractService.generateContractFromTemplate(contractData);
        showToast("Contrato Word generado correctamente", "success");
      }
      open = false;
    } catch (err) {
      console.error("Error generando contrato:", err);
      error = err.message || "Error al generar el contrato";
      showToast(error, "error");
    } finally {
      loading = false;
      loadingFormat = "";
    }
  }
</script>

<Modal bind:open title={modalTitle} size="lg">
  <div class="space-y-4">
    {#if error}
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm"
      >
        {error}
      </div>
    {/if}

    {#if canGenerate}
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FileText size={16} />
          <span class="font-medium text-gray-800 dark:text-gray-200"
            >Vista previa de datos del contrato:</span
          >
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300"
              >Inquilino:</span
            >
            <span class="ml-2 text-gray-600 dark:text-gray-400"
              >{tenant.full_name}</span
            >
            {#if tenant.dni}
              <span class="ml-2 text-gray-500 dark:text-gray-500"
                >(DNI: {tenant.dni})</span
              >
            {/if}
          </div>

          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300"
              >Propiedad:</span
            >
            <span class="ml-2 text-gray-600 dark:text-gray-400"
              >{property.name}</span
            >
          </div>

          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300"
              >Dirección Propiedad:</span
            >
            <span class="ml-2 text-gray-600 dark:text-gray-400"
              >{property.address}</span
            >
          </div>

          {#if tenant.current_address}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300"
                >Domicilio Actual:</span
              >
              <span class="ml-2 text-gray-600 dark:text-gray-400"
                >{tenant.current_address}</span
              >
            </div>
          {:else}
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2"
            >
              <p class="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ No hay domicilio actual configurado. Se usará la dirección de
                la propiedad en el contrato.
              </p>
            </div>
          {/if}

          {#if room || tenant.room}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300"
                >Habitación:</span
              >
              <span class="ml-2 text-gray-600 dark:text-gray-400"
                >{(room || tenant.room)?.name || "No asignada"}</span
              >
            </div>
          {/if}

          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300"
              >Renta mensual:</span
            >
            <span class="ml-2 text-gray-600 dark:text-gray-400">
              {(room || tenant.room)?.monthly_rent || tenant.monthly_rent || 0}€
            </span>
          </div>

          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300"
              >Fianza:</span
            >
            <span class="ml-2 text-gray-600 dark:text-gray-400">
              {tenant.deposit_amount ||
                (room || tenant.room)?.monthly_rent ||
                0}€
            </span>
          </div>

          {#if contractData?.startDate}
            {@const startDate = (() => {
              try {
                const date = new Date(contractData.startDate);
                return isNaN(date.getTime())
                  ? null
                  : date.toLocaleDateString("es-ES");
              } catch {
                return null;
              }
            })()}
            {#if startDate}
              <div>
                <span class="font-semibold text-gray-700 dark:text-gray-300"
                  >Fecha inicio {isRenewal ? "(Renovación)" : ""}:</span
                >
                <span class="ml-2 text-gray-600 dark:text-gray-400">
                  {startDate}
                </span>
              </div>
            {/if}
          {/if}

          {#if contractData?.endDate}
            {@const endDate = (() => {
              try {
                const date = new Date(contractData.endDate);
                return isNaN(date.getTime())
                  ? null
                  : date.toLocaleDateString("es-ES");
              } catch {
                return null;
              }
            })()}
            {#if endDate}
              <div>
                <span class="font-semibold text-gray-700 dark:text-gray-300"
                  >Fecha fin {isRenewal ? "(Renovación)" : ""}:</span
                >
                <span class="ml-2 text-gray-600 dark:text-gray-400">
                  {endDate}
                </span>
              </div>
            {/if}
          {/if}
        </div>

        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
        >
          <p class="text-xs text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> El contrato se generará desde la plantilla DOCX
            y se descargará automáticamente. Asegúrate de que la plantilla tenga
            los campos correctos configurados.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pt-4">
        <div class="flex gap-3">
          <Button
            on:click={() => handleGenerate("word")}
            disabled={loading}
            className="flex-1"
          >
            <File size={18} class="inline mr-2" />
            {loadingFormat === "word" ? "Generando..." : "Descargar Word"}
          </Button>
          <Button
            on:click={() => handleGenerate("pdf")}
            disabled={loading}
            variant="secondary"
            className="flex-1"
          >
            <Download size={18} class="inline mr-2" />
            {loadingFormat === "pdf" ? "Generando..." : "Descargar PDF"}
          </Button>
        </div>
        <Button
          variant="ghost"
          on:click={() => (open = false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    {:else}
      <div class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">
          No hay datos suficientes para generar el contrato.
        </p>
      </div>
    {/if}
  </div>
</Modal>
