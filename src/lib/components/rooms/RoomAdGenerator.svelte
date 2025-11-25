<script>
  import { FileText, Download } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import { pdfService } from '$lib/services/pdf';
  import { storageService } from '$lib/services/storage';
  import { createEventDispatcher } from 'svelte';
  
  export let room = null;
  export let property = null;
  export let commonRooms = [];
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  
  async function generateAd() {
    if (!room || !property) {
      error = 'Faltan datos de la habitación o propiedad';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Obtener URLs completas de las fotos de la habitación
      const roomPhotoUrls = (room.photos || []).map(photo => {
        if (typeof photo === 'string') {
          return storageService.getPhotoUrl(photo);
        }
        return photo.url || photo;
      });
      
      // Obtener URLs completas de las fotos de zonas comunes
      const commonRoomsWithPhotos = commonRooms.map(r => ({
        name: r.name,
        photos: (r.photos || []).map(photo => {
          if (typeof photo === 'string') {
            return storageService.getPhotoUrl(photo);
          }
          return photo.url || photo;
        })
      }));
      
      const adData = {
        roomName: room.name,
        propertyName: property.name,
        propertyAddress: property.address,
        monthlyRent: room.monthly_rent || 0,
        sizeSqm: room.size_sqm || null,
        description: property.description || `Habitación en ${property.name}, ${property.address}`,
        photos: roomPhotoUrls,
        commonRooms: commonRoomsWithPhotos,
        depositAmount: room.deposit_amount || null,
        expenses: null // Se puede agregar más adelante
      };
      
      await pdfService.generateRoomAd(adData);
      dispatch('generated');
    } catch (err) {
      error = err.message || 'Error al generar el anuncio';
      console.error('Error generating ad:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-2">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-xs">
      {error}
    </div>
  {/if}
  
  <button
    on:click={generateAd}
    disabled={loading || !room || !property}
    class="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    type="button"
  >
    <Download size={12} />
    <span>{loading ? 'Generando...' : 'Anuncio PDF'}</span>
  </button>
</div>

