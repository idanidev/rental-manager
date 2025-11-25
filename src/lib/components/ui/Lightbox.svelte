<script>
  import { X, ChevronLeft, ChevronRight, Download } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  
  export let open = false;
  export let images = [];
  export let currentIndex = 0;
  
  const dispatch = createEventDispatcher();
  
  $: currentImage = images[currentIndex];
  $: canGoPrev = currentIndex > 0;
  $: canGoNext = currentIndex < images.length - 1;
  
  function close() {
    // Asegurar que no cause navegación
    if (typeof window !== 'undefined' && open) {
      open = false;
    }
  }
  
  function prev() {
    if (canGoPrev) currentIndex--;
  }
  
  function next() {
    if (canGoNext) currentIndex++;
  }
  
  function handleKeydown(e) {
    if (!open) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  }
  
  function downloadImage() {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `imagen-${currentIndex + 1}.jpg`;
    link.click();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && currentImage}
  <div 
    class="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center p-4"
    on:click|stopPropagation={close}
    on:keydown|stopPropagation={(e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Visor de imagen"
    transition:fly={{ y: 20, duration: 200 }}
  >
    <!-- Close Button -->
    <button
      on:click={close}
      class="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
    >
      <X size={24} class="text-white" />
    </button>
    
    <!-- Download Button -->
    <button
      on:click|stopPropagation={downloadImage}
      class="absolute top-4 right-20 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
    >
      <Download size={24} class="text-white" />
    </button>
    
    <!-- Counter -->
    {#if images.length > 1}
      <div class="absolute top-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium z-10">
        {currentIndex + 1} / {images.length}
      </div>
    {/if}
    
    <!-- Image -->
    <div 
      class="relative max-w-6xl max-h-[90vh] w-full flex items-center justify-center"
      on:click|stopPropagation
    >
      <img 
        src={currentImage} 
        alt="Foto {currentIndex + 1}"
        class="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
      />
    </div>
    
    <!-- Navigation -->
    {#if images.length > 1}
      <button
        on:click|stopPropagation={prev}
        disabled={!canGoPrev}
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={24} class="text-white" />
      </button>
      
      <button
        on:click|stopPropagation={next}
        disabled={!canGoNext}
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={24} class="text-white" />
      </button>
    {/if}
    
    <!-- Thumbnails -->
    {#if images.length > 1}
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-2xl max-w-[90vw] overflow-x-auto">
        {#each images as image, i}
          <button
            on:click|stopPropagation={() => currentIndex = i}
            class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
              {i === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}"
          >
            <img src={image} alt="Miniatura {i + 1}" class="w-full h-full object-cover" />
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

