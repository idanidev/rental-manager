<script>
  import { onMount } from 'svelte';
  
  export let src;
  export let alt = '';
  export let className = '';
  export let placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
  
  let isLoaded = false;
  let isInView = false;
  let imgElement;
  
  onMount(() => {
    // Usar Intersection Observer para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInView = true;
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    if (imgElement) {
      observer.observe(imgElement);
    }
    
    return () => {
      if (imgElement) {
        observer.unobserve(imgElement);
      }
    };
  });
  
  function handleLoad() {
    isLoaded = true;
  }
</script>

<img
  bind:this={imgElement}
  src={isInView ? src : placeholder}
  {alt}
  class="transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'} {className}"
  on:load={handleLoad}
/>

