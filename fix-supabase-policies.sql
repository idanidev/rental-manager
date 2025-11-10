-- =====================================================
-- ARREGLAR TODAS LAS POLÍTICAS RLS
-- =====================================================

-- Eliminar TODAS las políticas existentes de property_access
DROP POLICY IF EXISTS "Users can view access of their properties" ON property_access;
DROP POLICY IF EXISTS "Users can view their own access" ON property_access;
DROP POLICY IF EXISTS "System can create property access" ON property_access;
DROP POLICY IF EXISTS "Owners can update access" ON property_access;
DROP POLICY IF EXISTS "Owners can delete access" ON property_access;

-- Crear políticas simples y funcionales

-- SELECT: Ver propios accesos o accesos de propiedades donde eres owner
CREATE POLICY "view_property_access"
  ON property_access FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- INSERT: Cualquier usuario autenticado puede crear accesos (necesario para auto-asignarse como owner)
CREATE POLICY "insert_property_access"
  ON property_access FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE: Solo puedes actualizar accesos de propiedades donde eres owner
CREATE POLICY "update_property_access"
  ON property_access FOR UPDATE
  USING (
    property_id IN (
      SELECT property_id FROM property_access 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: Solo puedes eliminar accesos de propiedades donde eres owner
CREATE POLICY "delete_property_access"
  ON property_access FOR DELETE
  USING (
    property_id IN (
      SELECT property_id FROM property_access 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    AND user_id != auth.uid()
  );

