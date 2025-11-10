<script>
  export let className = '';
  export let hover = true;
</script>

<div class="glass-card {hover ? 'hover:scale-[1.02]' : ''} {className}">
  <slot />
</div>
