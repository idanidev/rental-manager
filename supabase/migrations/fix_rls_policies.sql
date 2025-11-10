-- =====================================================
-- FIX: Arreglar recursión infinita en property_access
-- =====================================================

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view access of their properties" ON property_access;
DROP POLICY IF EXISTS "Owners can update access" ON property_access;
DROP POLICY IF EXISTS "Owners can delete access" ON property_access;

-- Crear nuevas políticas sin recursión
-- Ver accesos: el usuario puede ver sus propios accesos O si es owner de la propiedad
CREATE POLICY "Users can view their own access"
  ON property_access FOR SELECT
  USING (
    user_id = auth.uid()
    OR property_id IN (
      SELECT property_id FROM property_access 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Actualizar accesos: solo owners (verificando directamente)
CREATE POLICY "Owners can update access"
  ON property_access FOR UPDATE
  USING (
    property_id IN (
      SELECT property_id FROM property_access 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Eliminar accesos: solo owners (verificando directamente) y no pueden eliminarse a sí mismos
CREATE POLICY "Owners can delete access"
  ON property_access FOR DELETE
  USING (
    property_id IN (
      SELECT property_id FROM property_access 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    AND user_id != auth.uid()
  );

