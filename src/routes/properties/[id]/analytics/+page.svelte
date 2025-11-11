<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  $: propertyId = $page.params.id;
  
  onMount(() => {
    // Redirigir a la vista principal de la propiedad
    goto(`/properties/${propertyId}`);
  });
</script>

<div class="flex items-center justify-center min-h-[50vh]">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
    <p class="text-gray-600">Redirigiendo...</p>
  </div>
</div>
