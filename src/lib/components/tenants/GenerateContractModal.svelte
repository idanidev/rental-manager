<script>
  import { FileText, Download, X } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import { contractService } from '$lib/services/contract';
  import { showToast } from '$lib/stores/toast';
  import { userStore } from '$lib/stores/user';
  
  export let open = false;
  export let tenant = null;
  export let property = null;
  export let room = null;
  
  let loading = false;
  let error = '';
  
  $: canGenerate = tenant && property;
  
  async function handleGenerate() {
    if (!canGenerate) {
      error = 'Faltan datos necesarios para generar el contrato';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Obtener la habitación asignada al inquilino si no se proporciona
      let tenantRoom = room;
      if (!tenantRoom && tenant.room) {
        tenantRoom = tenant.room;
      }
      
      // Preparar los datos del contrato
      const contractData = {
        tenantName: tenant.full_name || '',
        tenantDni: tenant.dni || '',
        tenantEmail: tenant.email || '',
        tenantPhone: tenant.phone || '',
        tenantCurrentAddress: tenant.current_address || '', // Domicilio actual del inquilino
        propertyName: property.name || '',
        propertyAddress: property.address || '', // Dirección de la propiedad
        roomName: tenantRoom?.name || 'Habitación',
        monthlyRent: tenantRoom?.monthly_rent || tenant.monthly_rent || 0,
        depositAmount: tenant.deposit_amount || 0,
        startDate: tenant.contract_start_date || new Date().toISOString(),
        endDate: tenant.contract_end_date || new Date().toISOString(),
        contractMonths: tenant.contract_months || 6,
        contractNotes: tenant.contract_notes || '',
        ownerName: $userStore?.user_metadata?.name || $userStore?.email?.split('@')[0] || 'Propietario',
        ownerDni: $userStore?.user_metadata?.dni || ''
      };
      
      await contractService.generateContractFromTemplate(contractData);
      showToast('Contrato generado correctamente', 'success');
      open = false;
    } catch (err) {
      console.error('Error generando contrato:', err);
      error = err.message || 'Error al generar el contrato';
      showToast(error, 'error');
    } finally {
      loading = false;
    }
  }
</script>

<Modal bind:open title="Generar Contrato" size="lg">
  <div class="space-y-4">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}
    
    {#if canGenerate}
      <div class="space-y-3 text-sm">
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FileText size={16} />
          <span class="font-medium text-gray-800 dark:text-gray-200">Vista previa de datos del contrato:</span>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300">Inquilino:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{tenant.full_name}</span>
            {#if tenant.dni}
              <span class="ml-2 text-gray-500 dark:text-gray-500">(DNI: {tenant.dni})</span>
            {/if}
          </div>
          
          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300">Propiedad:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{property.name}</span>
          </div>
          
          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300">Dirección Propiedad:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">{property.address}</span>
          </div>
          
          {#if tenant.current_address}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300">Domicilio Actual:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{tenant.current_address}</span>
            </div>
          {:else}
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
              <p class="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ No hay domicilio actual configurado. Se usará la dirección de la propiedad en el contrato.
              </p>
            </div>
          {/if}
          
          {#if room || tenant.room}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300">Habitación:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{(room || tenant.room)?.name || 'No asignada'}</span>
            </div>
          {/if}
          
          <div>
            <span class="font-semibold text-gray-700 dark:text-gray-300">Renta mensual:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-400">
              {(room || tenant.room)?.monthly_rent || tenant.monthly_rent || 0}€
            </span>
          </div>
          
          {#if tenant.contract_start_date}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300">Fecha inicio:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">
                {new Date(tenant.contract_start_date).toLocaleDateString('es-ES')}
              </span>
            </div>
          {/if}
          
          {#if tenant.contract_end_date}
            <div>
              <span class="font-semibold text-gray-700 dark:text-gray-300">Fecha fin:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">
                {new Date(tenant.contract_end_date).toLocaleDateString('es-ES')}
              </span>
            </div>
          {/if}
        </div>
        
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p class="text-xs text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> El contrato se generará desde la plantilla DOCX y se descargará automáticamente.
            Asegúrate de que la plantilla tenga los campos correctos configurados.
          </p>
        </div>
      </div>
      
      <div class="flex gap-3 pt-4">
        <Button
          on:click={handleGenerate}
          disabled={loading}
          className="flex-1"
        >
          <Download size={18} class="inline mr-2" />
          {loading ? 'Generando...' : 'Generar y Descargar'}
        </Button>
        <Button
          variant="secondary"
          on:click={() => open = false}
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

