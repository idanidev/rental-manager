<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  onMount(() => {
    // Redirigir al dashboard principal
    goto('/');
  });
</script>

<div class="flex items-center justify-center min-h-[50vh]">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
    <p class="text-gray-600">Redirigiendo...</p>
  </div>
</div>
