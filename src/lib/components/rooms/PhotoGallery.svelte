<script>
  import { Camera, X, Upload, Image as ImageIcon, Loader, Download } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import Lightbox from '../ui/Lightbox.svelte';
  import { storageService } from '$lib/services/storage';
  import { toast } from '$lib/stores/toast';
  
  export let photos = [];
  export let propertyId;
  export let roomId;
  export let canEdit = true;
  
  let uploading = false;
  let uploadProgress = 0;
  let fileInput;
  let showLightbox = false;
  let currentPhotoIndex = 0;
  
  const MAX_PHOTOS = 10;
  
  async function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validar número máximo de fotos
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.warning(`Máximo ${MAX_PHOTOS} fotos por habitación`);
      return;
    }
    
    uploading = true;
    
    try {
      for (const file of files) {
        // Comprimir imagen antes de subir
        const compressedFile = await storageService.compressImage(file);
        
        // Subir foto
        const result = await storageService.uploadRoomPhoto(propertyId, roomId, compressedFile);
        
        // Añadir a la lista
        photos = [...photos, result.path];
      }
      
      toast.success(`${files.length} foto${files.length > 1 ? 's' : ''} subida${files.length > 1 ? 's' : ''} correctamente`);
      
      // Resetear input
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      toast.error(err.message || 'Error al subir la foto');
    } finally {
      uploading = false;
    }
  }
  
  async function deletePhoto(index) {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;
    
    try {
      const photoPath = photos[index];
      await storageService.deleteRoomPhoto(photoPath);
      
      // Eliminar de la lista
      photos = photos.filter((_, i) => i !== index);
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la foto');
    }
  }
  
  function openPhotoViewer(index) {
    currentPhotoIndex = index;
    showLightbox = true;
  }
  
  function getPhotoUrl(path) {
    return storageService.getPhotoUrl(path);
  }
  
  async function downloadPhoto(path, index) {
    try {
      const url = getPhotoUrl(path);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `foto_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success('Foto descargada');
    } catch (err) {
      toast.error('Error al descargar la foto');
    }
  }
  
  async function downloadAllPhotos() {
    try {
      for (let i = 0; i < photos.length; i++) {
        await downloadPhoto(photos[i], i);
        // Pequeña pausa entre descargas para evitar bloqueos del navegador
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err) {
      toast.error('Error al descargar fotos');
    }
  }
  
  $: photoUrls = photos.map(p => getPhotoUrl(p));
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
      <Camera size={20} class="text-purple-600" />
      Fotos
      {#if photos.length > 0}
        <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
          {photos.length}/{MAX_PHOTOS}
        </span>
      {/if}
    </h3>
    
    <div class="flex gap-2">
      {#if photos.length > 0}
        <Button 
          variant="secondary" 
          className="text-sm"
          on:click={downloadAllPhotos}
          title="Descargar todas las fotos"
        >
          <Download size={16} class="inline mr-1" />
          <span class="hidden sm:inline">Descargar</span>
        </Button>
      {/if}
      
      {#if canEdit && photos.length < MAX_PHOTOS}
        <div>
          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFileSelect}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            class="hidden"
            disabled={uploading}
          />
          <Button 
            variant="secondary" 
            className="text-sm"
            on:click={() => fileInput?.click()}
            disabled={uploading}
          >
            {#if uploading}
              <Loader size={16} class="inline mr-1 animate-spin" />
              Subiendo...
            {:else}
              <Upload size={16} class="inline mr-1" />
              <span class="hidden sm:inline">Subir</span>
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Galería -->
  {#if photos.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {#each photos as photo, index (photo)}
        <div class="relative group aspect-square">
          <button
            on:click={() => openPhotoViewer(index)}
            class="w-full h-full rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all shadow-sm hover:shadow-md"
          >
            <img
              src={getPhotoUrl(photo)}
              alt="Foto {index + 1}"
              class="w-full h-full object-cover transition-transform group-hover:scale-110"
              loading="lazy"
            />
          </button>
          
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              on:click|stopPropagation={() => downloadPhoto(photo, index)}
              class="p-1.5 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600"
              aria-label="Descargar foto"
            >
              <Download size={14} />
            </button>
            {#if canEdit}
              <button
                on:click|stopPropagation={() => deletePhoto(index)}
                class="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                aria-label="Eliminar foto"
              >
                <X size={14} />
              </button>
            {/if}
          </div>
          
          <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
            {index + 1}
          </div>
        </div>
      {/each}
    </div>
    
    <div class="text-xs text-gray-500 text-center">
      Click en una foto para verla en tamaño completo
    </div>
  {:else}
    <div class="text-center py-8 glass-card">
      <ImageIcon size={40} class="mx-auto text-gray-400 mb-2" />
      <p class="text-gray-600 text-sm mb-4">
        No hay fotos aún. {canEdit ? 'Sube fotos para mostrar cómo es la habitación.' : ''}
      </p>
      {#if canEdit}
        <Button variant="secondary" on:click={() => fileInput?.click()}>
          <Camera size={18} class="inline mr-2" />
          Subir Primera Foto
        </Button>
      {/if}
    </div>
  {/if}
  
  <!-- Info -->
  {#if canEdit}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
      <p class="text-xs text-blue-800">
        💡 <strong>Consejo:</strong> Puedes subir hasta {MAX_PHOTOS} fotos. 
        Formatos: JPG, PNG, WEBP. Tamaño máximo: 5MB por foto.
      </p>
    </div>
  {/if}
</div>

<!-- Lightbox -->
<Lightbox bind:open={showLightbox} images={photoUrls} bind:currentIndex={currentPhotoIndex} />


