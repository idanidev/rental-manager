<script>
  export let variant = 'primary'; // primary, secondary, ghost
  export let type = 'button';
  export let disabled = false;
  export let className = '';
  export let fullWidth = false;

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'hover:bg-white/20 px-4 py-2 rounded-lg transition-all'
  };
</script>

<button
  {type}
  {disabled}
  class="{variants[variant]} {className} {fullWidth ? 'w-full' : ''} disabled:opacity-50 disabled:cursor-not-allowed"
  on:click
>
  <slot />
</button>
