<script>
  import { AlertTriangle } from 'lucide-svelte';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  
  export let open = false;
  export let title = '¿Estás seguro?';
  export let message = 'Esta acción no se puede deshacer.';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancelar';
  export let danger = true;
  export let loading = false;
  export let onConfirm = () => {};
  export let onCancel = () => {};
  
  function handleConfirm() {
    onConfirm();
  }
  
  function handleCancel() {
    onCancel();
    if (!loading) {
      open = false;
    }
  }
</script>

<Modal bind:open {title} size="sm">
  <div class="space-y-5">
    <!-- Icon Warning -->
    <div class="flex justify-center">
      <div class="inline-flex p-4 bg-{danger ? 'red' : 'yellow'}-100 rounded-full">
        <AlertTriangle size={32} class="text-{danger ? 'red' : 'yellow'}-600" />
      </div>
    </div>
    
    <!-- Message -->
    <div class="text-center">
      <p class="text-gray-700">{message}</p>
    </div>
    
    <!-- Actions -->
    <div class="flex gap-3">
      <Button 
        variant="secondary" 
        on:click={handleCancel}
        disabled={loading}
        fullWidth
      >
        {cancelText}
      </Button>
      
      <Button 
        on:click={handleConfirm}
        disabled={loading}
        fullWidth
        className="{danger ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-red-500/30' : ''}"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
        {/if}
        {confirmText}
      </Button>
    </div>
  </div>
</Modal>

