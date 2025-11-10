<script>
  export let message;
  export let className = '';
</script>

{#if message}
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl {className}">
    <p class="text-sm">{message}</p>
  </div>
{/if}

