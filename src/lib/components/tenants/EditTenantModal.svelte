<script>
  import { Edit } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import TenantForm from './TenantForm.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let open = false;
  export let tenant;
  export let propertyId;
  
  const dispatch = createEventDispatcher();
  
  function handleSuccess(event) {
    dispatch('success', event.detail);
    open = false;
  }
  
  function handleCancel() {
    open = false;
  }
</script>

{#if tenant}
  <Modal bind:open title="Editar Inquilino" size="lg">
    <TenantForm
      {tenant}
      {propertyId}
      on:success={handleSuccess}
      on:cancel={handleCancel}
    />
  </Modal>
{/if}

