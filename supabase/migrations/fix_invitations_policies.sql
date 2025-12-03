-- =====================================================
-- FIX: Políticas de Invitaciones
-- =====================================================
-- Corrige las políticas RLS de invitations para que funcionen correctamente
-- =====================================================

-- Eliminar políticas existentes de invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON invitations;
DROP POLICY IF EXISTS "Property owners can view invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations for their properties" ON invitations;
DROP POLICY IF EXISTS "Property owners can create invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can delete their invitations" ON invitations;
DROP POLICY IF EXISTS "Property owners can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON invitations;

-- =====================================================
-- POLÍTICAS CORREGIDAS PARA INVITATIONS
-- =====================================================

-- SELECT: Los usuarios pueden ver sus propias invitaciones O las invitaciones de propiedades donde son owners
CREATE POLICY "Users can view invitations for their properties"
ON invitations FOR SELECT
USING (
  -- Ver invitaciones donde el email coincide con el del usuario autenticado
  invitations.email = (auth.jwt()->>'email')
  OR
  -- O ver invitaciones de propiedades donde el usuario es owner_id directamente
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = invitations.property_id
    AND p.owner_id = auth.uid()
  )
  OR
  -- O ver invitaciones de propiedades donde el usuario tiene rol owner en property_access
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- INSERT: Solo owners pueden crear invitaciones
CREATE POLICY "Owners can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  -- Verificar si el usuario es owner_id de la propiedad directamente
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = invitations.property_id
    AND p.owner_id = auth.uid()
  )
  OR
  -- O verificar si el usuario tiene rol owner en property_access
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- DELETE: Los usuarios pueden eliminar sus propias invitaciones O los owners pueden eliminar invitaciones de sus propiedades
CREATE POLICY "Users and owners can delete invitations"
ON invitations FOR DELETE
USING (
  -- El usuario puede eliminar invitaciones donde su email coincide
  invitations.email = (auth.jwt()->>'email')
  OR
  -- O el owner puede eliminar invitaciones de sus propiedades
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = invitations.property_id
    AND p.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT '✅ Políticas de invitations corregidas' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'invitations'
ORDER BY policyname;





