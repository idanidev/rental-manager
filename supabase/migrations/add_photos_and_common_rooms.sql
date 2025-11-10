-- =====================================================
-- RENTAL MANAGER - PHOTOS AND COMMON ROOMS
-- Añadir fotos y salas comunes a habitaciones
-- =====================================================

-- Añadir columnas para fotos y tipo de habitación
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type VARCHAR(20) DEFAULT 'private' CHECK (room_type IN ('private', 'common'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN rooms.room_type IS 'Tipo de habitación: private (privada/alquilable) o common (sala común/no alquilable)';
COMMENT ON COLUMN rooms.photos IS 'Array de URLs de fotos de la habitación en Supabase Storage';

-- Índice para búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type);

-- Modificar constraint para permitir habitaciones comunes sin inquilino
-- Las salas comunes no necesitan estar "ocupadas"
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_occupied_check;

-- Las habitaciones privadas pueden estar ocupadas, las comunes no
ALTER TABLE rooms ADD CONSTRAINT rooms_type_occupied_check 
  CHECK (
    (room_type = 'private') OR 
    (room_type = 'common' AND occupied = false)
  );

-- =====================================================
-- SUPABASE STORAGE BUCKETS
-- =====================================================
-- Estos comandos deben ejecutarse en la consola de Supabase Storage o mediante el dashboard

-- Crear bucket para fotos de habitaciones (ejecutar manualmente en Supabase Dashboard)
/*
1. Ve a Storage en Supabase Dashboard
2. Crea un bucket llamado: room-photos
3. Configura las políticas de acceso:
   - Público: false
   - Políticas personalizadas (ver abajo)
*/

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- Estas políticas se crean automáticamente, pero aquí está la referencia

-- Permitir a usuarios autenticados subir fotos de sus habitaciones
-- (Esta política se debe configurar en Supabase Dashboard > Storage > room-photos > Policies)

/*
Policy: "Users can upload photos to their property rooms"
Operation: INSERT
Target roles: authenticated
USING expression:
  EXISTS (
    SELECT 1 FROM rooms r
    JOIN properties p ON r.property_id = p.id
    JOIN property_access pa ON p.id = pa.property_id
    WHERE pa.user_id = auth.uid()
      AND pa.role IN ('owner', 'editor')
      AND storage.foldername(name)[1] = 'room-photos'
  )
*/

/*
Policy: "Users can view photos of their property rooms"
Operation: SELECT
Target roles: authenticated
USING expression:
  EXISTS (
    SELECT 1 FROM rooms r
    JOIN properties p ON r.property_id = p.id
    JOIN property_access pa ON p.id = pa.property_id
    WHERE pa.user_id = auth.uid()
      AND storage.foldername(name)[1] = 'room-photos'
  )
*/

/*
Policy: "Users can delete photos of their property rooms"
Operation: DELETE
Target roles: authenticated, anon
USING expression:
  EXISTS (
    SELECT 1 FROM rooms r
    JOIN properties p ON r.property_id = p.id
    JOIN property_access pa ON p.id = pa.property_id
    WHERE pa.user_id = auth.uid()
      AND pa.role IN ('owner', 'editor')
      AND storage.foldername(name)[1] = 'room-photos'
  )
*/

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de salas comunes por propiedad
CREATE OR REPLACE VIEW common_rooms_view AS
SELECT 
  r.id,
  r.name,
  r.property_id,
  r.size_sqm,
  r.photos,
  r.notes,
  p.name as property_name,
  jsonb_array_length(COALESCE(r.photos, '[]'::jsonb)) as photo_count
FROM rooms r
JOIN properties p ON r.property_id = p.id
WHERE r.room_type = 'common'
ORDER BY p.name, r.name;

-- Vista de habitaciones privadas disponibles
CREATE OR REPLACE VIEW available_rooms_view AS
SELECT 
  r.id,
  r.name,
  r.monthly_rent,
  r.size_sqm,
  r.property_id,
  r.photos,
  p.name as property_name,
  p.address,
  jsonb_array_length(COALESCE(r.photos, '[]'::jsonb)) as photo_count
FROM rooms r
JOIN properties p ON r.property_id = p.id
WHERE r.room_type = 'private' 
  AND r.occupied = false
ORDER BY p.name, r.monthly_rent;

-- Políticas de seguridad para las vistas
GRANT SELECT ON common_rooms_view TO authenticated;
GRANT SELECT ON available_rooms_view TO authenticated;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para contar fotos de una habitación
CREATE OR REPLACE FUNCTION count_room_photos(room_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_array_length(photos), 0)
    FROM rooms
    WHERE id = room_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para obtener todas las fotos de una propiedad
CREATE OR REPLACE FUNCTION get_property_photos(property_id UUID)
RETURNS TABLE (
  room_id UUID,
  room_name VARCHAR,
  room_type VARCHAR,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.room_type,
    jsonb_array_elements_text(r.photos)
  FROM rooms r
  WHERE r.property_id = property_id
    AND jsonb_array_length(r.photos) > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- DATOS DE EJEMPLO (opcional)
-- =====================================================

-- Ejemplo de actualizar una habitación a sala común
-- UPDATE rooms SET room_type = 'common', occupied = false WHERE id = 'algún-id';

-- Ejemplo de añadir fotos a una habitación
-- UPDATE rooms 
-- SET photos = '["room-photos/property-id/room-id/photo1.jpg", "room-photos/property-id/room-id/photo2.jpg"]'::jsonb
-- WHERE id = 'algún-id';

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
ESTRUCTURA DE FOTOS EN STORAGE:
room-photos/
  └── {property_id}/
      └── {room_id}/
          ├── photo_1.jpg
          ├── photo_2.jpg
          └── photo_3.jpg

FORMATO DEL CAMPO photos (JSONB):
[
  "room-photos/property-id/room-id/photo1.jpg",
  "room-photos/property-id/room-id/photo2.jpg"
]

LÍMITES RECOMENDADOS:
- Máximo 10 fotos por habitación
- Tamaño máximo por foto: 5MB
- Formatos: JPG, PNG, WEBP
*/

