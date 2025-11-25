<script>
  import { onDestroy } from 'svelte';
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
  let pendingFiles = []; // Archivos pendientes de subir (cuando roomId es 'new')
  
  const MAX_PHOTOS = 10;
  
  // Si roomId cambia de 'new' a un ID real, subir fotos pendientes
  let previousRoomId = roomId;
  $: {
    if (roomId && roomId !== 'new' && roomId !== previousRoomId && pendingFiles.length > 0) {
      // Usar setTimeout para evitar problemas de reactividad
      setTimeout(() => {
        uploadPendingFiles();
      }, 100);
    }
    previousRoomId = roomId;
  }
  
  async function uploadPendingFiles() {
    if (pendingFiles.length === 0 || !roomId || roomId === 'new') return;
    
    uploading = true;
    const filesToUpload = [...pendingFiles];
    const tempUrlsToReplace = filesToUpload.map(f => f.tempUrl);
    pendingFiles = [];
    
    try {
      const uploadedPaths = [];
      
      for (const fileData of filesToUpload) {
        // Subir foto ahora que tenemos el roomId real
        const result = await storageService.uploadRoomPhoto(propertyId, roomId, fileData.file);
        uploadedPaths.push(result.path);
        
        // Limpiar URL temporal
        if (fileData.tempUrl) {
          URL.revokeObjectURL(fileData.tempUrl);
        }
      }
      
      // Reemplazar URLs temporales por paths reales en el array de photos
      photos = photos.map(photo => {
        const index = tempUrlsToReplace.indexOf(photo);
        if (index !== -1) {
          return uploadedPaths[index];
        }
        return photo;
      });
      
      toast.success(`${filesToUpload.length} foto${filesToUpload.length > 1 ? 's' : ''} subida${filesToUpload.length > 1 ? 's' : ''} correctamente`);
    } catch (err) {
      toast.error(err.message || 'Error al subir la foto');
      // Si falla, devolver los archivos a pendientes
      pendingFiles = [...filesToUpload, ...pendingFiles];
    } finally {
      uploading = false;
    }
  }
  
  async function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validar número máximo de fotos
    if (photos.length + files.length + pendingFiles.length > MAX_PHOTOS) {
      toast.warning(`Máximo ${MAX_PHOTOS} fotos por habitación`);
      return;
    }
    
    uploading = true;
    
    try {
      for (const file of files) {
        // Comprimir imagen antes de subir
        const compressedFile = await storageService.compressImage(file);
        
        // Si la habitación aún no existe, guardar temporalmente
        if (roomId === 'new') {
          // Crear una URL temporal para previsualización
          const tempUrl = URL.createObjectURL(compressedFile);
          pendingFiles = [...pendingFiles, { file: compressedFile, tempUrl }];
          // Añadir un marcador temporal a photos para mostrar la previsualización
          photos = [...photos, tempUrl];
          toast.success(`Foto preparada. Se subirá cuando guardes la habitación.`);
        } else {
          // Subir foto directamente si la habitación ya existe
          const result = await storageService.uploadRoomPhoto(propertyId, roomId, compressedFile);
          photos = [...photos, result.path];
        }
      }
      
      if (roomId !== 'new') {
        toast.success(`${files.length} foto${files.length > 1 ? 's' : ''} subida${files.length > 1 ? 's' : ''} correctamente`);
      }
      
      // Resetear input
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      toast.error(err.message || 'Error al preparar la foto');
    } finally {
      uploading = false;
    }
  }
  
  // Función para obtener URL de previsualización
  function getPhotoPreview(photo) {
    // Si es una URL temporal (comienza con blob:), devolverla directamente
    if (typeof photo === 'string' && photo.startsWith('blob:')) {
      return photo;
    }
    // Si no, usar el servicio de storage
    return storageService.getPhotoUrl(photo);
  }
  
  async function deletePhoto(index) {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;
    
    try {
      const photo = photos[index];
      
      // Si es una foto temporal (blob URL), solo eliminar de la lista
      if (typeof photo === 'string' && photo.startsWith('blob:')) {
        // Encontrar y eliminar el archivo correspondiente de pendingFiles
        const tempUrlIndex = pendingFiles.findIndex(pf => pf.tempUrl === photo);
        if (tempUrlIndex !== -1) {
          // Limpiar la URL del blob
          URL.revokeObjectURL(pendingFiles[tempUrlIndex].tempUrl);
          pendingFiles = pendingFiles.filter((_, i) => i !== tempUrlIndex);
        }
        // Eliminar de la lista
        photos = photos.filter((_, i) => i !== index);
        toast.success('Foto eliminada');
      } else {
        // Es una foto ya subida, eliminar del storage
        await storageService.deleteRoomPhoto(photo);
        photos = photos.filter((_, i) => i !== index);
        toast.success('Foto eliminada');
      }
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la foto');
    }
  }
  
  function openPhotoViewer(index) {
    currentPhotoIndex = index;
    showLightbox = true;
  }
  
  function getPhotoUrl(photo) {
    // Si es una URL temporal, devolverla directamente
    if (typeof photo === 'string' && photo.startsWith('blob:')) {
      return photo;
    }
    // Si no, usar el servicio de storage
    return storageService.getPhotoUrl(photo);
  }
  
  async function downloadPhoto(photo, index) {
    try {
      // Si es una foto temporal, no se puede descargar aún
      if (typeof photo === 'string' && photo.startsWith('blob:')) {
        toast.warning('Esta foto se subirá cuando guardes la habitación');
        return;
      }
      
      const url = getPhotoUrl(photo);
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
        const photo = photos[i];
        // Solo descargar fotos que ya están subidas
        if (!(typeof photo === 'string' && photo.startsWith('blob:'))) {
          await downloadPhoto(photo, i);
          // Pequeña pausa entre descargas para evitar bloqueos del navegador
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      toast.error('Error al descargar fotos');
    }
  }
  
  $: photoUrls = photos.map(p => getPhotoUrl(p));
  
  // Limpiar URLs temporales cuando el componente se destruye
  onDestroy(() => {
    pendingFiles.forEach(pf => {
      if (pf.tempUrl) {
        URL.revokeObjectURL(pf.tempUrl);
      }
    });
    // También limpiar URLs temporales que quedaron en photos
    photos.forEach(photo => {
      if (typeof photo === 'string' && photo.startsWith('blob:')) {
        URL.revokeObjectURL(photo);
      }
    });
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
      <Camera size={20} class="text-orange-600" />
      Fotos
      {#if photos.length > 0}
        <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
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
            type="button"
            on:click={(e) => {
              e.stopPropagation();
              e.preventDefault();
              openPhotoViewer(index);
            }}
            class="w-full h-full rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-500 transition-all shadow-sm hover:shadow-md focus:outline-none"
          >
            <img
              src={getPhotoUrl(photo)}
              alt="Foto {index + 1}"
              class="w-full h-full object-cover transition-transform group-hover:scale-110"
              loading="lazy"
            />
            {#if typeof photo === 'string' && photo.startsWith('blob:')}
              <div class="absolute top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center">
                <div class="text-white text-xs text-center px-2">
                  <Upload size={16} class="mx-auto mb-1" />
                  Pendiente
                </div>
              </div>
            {/if}
          </button>
          
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              on:click|stopPropagation|preventDefault={() => downloadPhoto(photo, index)}
              class="p-1.5 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none"
              aria-label="Descargar foto"
            >
              <Download size={14} />
            </button>
            {#if canEdit}
              <button
                type="button"
                on:click|stopPropagation|preventDefault={() => deletePhoto(index)}
                class="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 focus:outline-none"
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


