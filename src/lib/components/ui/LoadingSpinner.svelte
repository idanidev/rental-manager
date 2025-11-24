<script>
  export let size = 'md'; // sm, md, lg
  export let color = 'purple'; // purple, white, gray
  
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4'
  };
  
  const colors = {
    purple: 'border-orange-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-500 border-t-transparent'
  };
</script>

<div class="animate-spin rounded-full {sizes[size]} {colors[color]}"></div>

