import { supabase, handleSupabaseError } from './supabase';

export const storageService = {
  // Subir foto de habitación
  async uploadRoomPhoto(propertyId, roomId, file) {
    try {
      // Validar archivo
      if (!file || !file.type) {
        throw new Error('Archivo inválido');
      }
      
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Solo se permiten imágenes JPG, PNG o WEBP');
      }
      
      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen debe pesar menos de 5MB');
      }
      
      // Generar nombre único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `photo_${timestamp}.${extension}`;
      const path = `room-photos/${propertyId}/${roomId}/${filename}`;
      
      // Subir archivo
      const { data, error } = await supabase.storage
        .from('room-photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw new Error(handleSupabaseError(error, 'uploadRoomPhoto'));
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('room-photos')
        .getPublicUrl(path);
      
      return {
        url: publicUrl,
        path: path
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },
  
  // Eliminar foto de habitación
  async deleteRoomPhoto(photoPath) {
    try {
      
      const { error } = await supabase.storage
        .from('room-photos')
        .remove([photoPath]);
      
      if (error) throw new Error(handleSupabaseError(error, 'deleteRoomPhoto'));
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  },
  
  // Obtener URL pública de una foto
  getPhotoUrl(photoPath) {
    if (!photoPath) return null;
    
    const { data: { publicUrl } } = supabase.storage
      .from('room-photos')
      .getPublicUrl(photoPath);
    
    return publicUrl;
  },
  
  // Comprimir imagen antes de subir (opcional)
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Crear nuevo File object
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            file.type,
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
};

