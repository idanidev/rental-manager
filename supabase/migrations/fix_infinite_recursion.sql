-- =====================================================
-- FIX: Infinite Recursion en property_access
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para corregir el error de recursión infinita
-- =====================================================

-- Eliminar todas las políticas de property_access para empezar limpio
DROP POLICY IF EXISTS "Users can view their own access" ON property_access;
DROP POLICY IF EXISTS "Users can view access of their properties" ON property_access;
DROP POLICY IF EXISTS "Owners can grant access" ON property_access;
DROP POLICY IF EXISTS "System can create property access" ON property_access;
DROP POLICY IF EXISTS "Owners can update access" ON property_access;
DROP POLICY IF EXISTS "Owners can revoke access" ON property_access;
DROP POLICY IF EXISTS "Owners can delete access" ON property_access;

-- Property Access: SELECT
-- Solo verificar user_id directamente, sin consultar property_access
CREATE POLICY "Users can view their own access"
ON property_access FOR SELECT
USING (user_id = auth.uid());

-- Property Access: INSERT
-- SOLO verificar owner_id en properties, NUNCA consultar property_access
-- Esto evita recursión infinita
CREATE POLICY "Owners can grant access"
ON property_access FOR INSERT
WITH CHECK (
  -- Solo permitir si el usuario es el owner_id de la propiedad
  -- NO consultar property_access aquí para evitar recursión
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_access.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Property Access: UPDATE
-- Para actualizar, verificar owner_id en properties primero
-- Si no es owner por properties, entonces verificar property_access
CREATE POLICY "Owners can update access"
ON property_access FOR UPDATE
USING (
  -- Primero verificar si es owner_id de la propiedad (sin recursión)
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_access.property_id
    AND p.owner_id = auth.uid()
  )
  OR
  -- Si no, verificar property_access (esto solo se usa para updates, no inserts)
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = property_access.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
    AND pa.id != property_access.id  -- Evitar auto-referencia
  )
);

-- Property Access: DELETE
-- Similar a UPDATE
CREATE POLICY "Owners can revoke access"
ON property_access FOR DELETE
USING (
  -- Primero verificar si es owner_id de la propiedad (sin recursión)
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_access.property_id
    AND p.owner_id = auth.uid()
  )
  OR
  -- Si no, verificar property_access
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = property_access.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
    AND pa.id != property_access.id  -- Evitar auto-referencia
  )
  AND user_id != auth.uid()  -- No puedes eliminar tu propio acceso
);

-- Verificar que las políticas se crearon correctamente
SELECT '✅ Políticas de property_access corregidas' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'property_access'
ORDER BY policyname;









