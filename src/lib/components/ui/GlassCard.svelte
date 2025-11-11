<script>
  export let className = '';
  export let hover = true;
  
  $: hasNoPadding = className.includes('p-0');
</script>

<div class="glass-card {hover ? 'hover:scale-[1.02]' : ''} {className}" class:compact={hasNoPadding}>
  <slot />
</div>

<style>
  :global(.glass-card.compact) {
    padding: 0 !important;
  }
</style>
