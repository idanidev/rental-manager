<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Redirigir al dashboard cuando acceden a /properties
  onMount(() => {
    goto('/');
  });
</script>

<!-- Redirigiendo... -->

