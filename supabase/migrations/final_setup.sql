-- =====================================================
-- SETUP FINAL - Funciones RPC y Políticas Optimizadas
-- =====================================================
-- Ejecuta este archivo DESPUÉS de ejecutar ALL_MIGRATIONS.sql
-- =====================================================

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- 1. Función para buscar usuario por email
DROP FUNCTION IF EXISTS get_user_by_email(TEXT);
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255)
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.email = user_email
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

-- 2. Función para dar acceso a un usuario
DROP FUNCTION IF EXISTS grant_property_access(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION grant_property_access(
  p_property_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_result JSONB;
BEGIN
  -- Verificar que quien llama es owner
  SELECT EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No tienes permisos para invitar usuarios';
  END IF;

  -- Verificar que el usuario no tenga acceso ya
  IF EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Este usuario ya tiene acceso';
  END IF;

  -- Insertar acceso
  INSERT INTO property_access (property_id, user_id, role)
  VALUES (p_property_id, p_user_id, p_role)
  RETURNING jsonb_build_object(
    'id', id,
    'property_id', property_id,
    'user_id', user_id,
    'role', role
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION grant_property_access(UUID, UUID, TEXT) TO authenticated;

-- 3. Función para revocar acceso
DROP FUNCTION IF EXISTS revoke_property_access(UUID, UUID);
CREATE OR REPLACE FUNCTION revoke_property_access(
  p_property_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_target_is_owner BOOLEAN;
  v_result JSONB;
BEGIN
  -- Verificar que quien llama es owner
  SELECT EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Solo los propietarios pueden revocar acceso';
  END IF;

  -- Verificar que el usuario objetivo no sea owner
  SELECT EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = p_user_id
    AND role = 'owner'
  ) INTO v_target_is_owner;

  IF v_target_is_owner THEN
    RAISE EXCEPTION 'No puedes revocar acceso al propietario';
  END IF;

  -- Eliminar acceso
  DELETE FROM property_access
  WHERE property_id = p_property_id
  AND user_id = p_user_id
  RETURNING jsonb_build_object(
    'property_id', property_id,
    'user_id', user_id,
    'removed', true
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_property_access(UUID, UUID) TO authenticated;

-- 4. Función para obtener usuarios con acceso
DROP FUNCTION IF EXISTS get_property_users(UUID);
CREATE OR REPLACE FUNCTION get_property_users(
  p_property_id UUID
)
RETURNS TABLE (
  access_id UUID,
  user_id UUID,
  user_email VARCHAR(255),
  role VARCHAR(20),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id as access_id,
    pa.user_id,
    au.email::VARCHAR(255) as user_email,
    pa.role,
    pa.created_at
  FROM property_access pa
  JOIN auth.users au ON au.id = pa.user_id
  WHERE pa.property_id = p_property_id
  ORDER BY pa.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_property_users(UUID) TO authenticated;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_access_user_role 
ON property_access(user_id, role) 
WHERE role = 'owner';

CREATE INDEX IF NOT EXISTS idx_property_access_property_user 
ON property_access(property_id, user_id);

-- =====================================================
-- POLÍTICAS RLS ACTUALIZADAS
-- =====================================================

-- Property Access: SELECT
DROP POLICY IF EXISTS "Users can view their own access" ON property_access;
CREATE POLICY "Users can view their own access"
ON property_access FOR SELECT
USING (user_id = auth.uid());

-- Property Access: INSERT (para owners)
DROP POLICY IF EXISTS "Owners can grant access" ON property_access;
CREATE POLICY "Owners can grant access"
ON property_access FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = property_access.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- Property Access: UPDATE
DROP POLICY IF EXISTS "Owners can update access" ON property_access;
CREATE POLICY "Owners can update access"
ON property_access FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = property_access.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- Property Access: DELETE
DROP POLICY IF EXISTS "Owners can revoke access" ON property_access;
CREATE POLICY "Owners can revoke access"
ON property_access FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = property_access.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
  AND user_id != auth.uid()
);

-- Properties: SELECT (ver propiedades a las que tienes acceso)
DROP POLICY IF EXISTS "Users can view properties they have access to" ON properties;
CREATE POLICY "Users can view properties they have access to"
ON properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = properties.id
    AND property_access.user_id = auth.uid()
  )
);

-- Rooms: SELECT (ver habitaciones de propiedades accesibles)
DROP POLICY IF EXISTS "Users can view rooms of accessible properties" ON rooms;
CREATE POLICY "Users can view rooms of accessible properties"
ON rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = rooms.property_id
    AND property_access.user_id = auth.uid()
  )
);

-- Invitations: Habilitar RLS y políticas
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their invitations" ON invitations;
CREATE POLICY "Users can view their invitations"
ON invitations FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Property owners can view invitations" ON invitations;
CREATE POLICY "Property owners can view invitations"
ON invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

DROP POLICY IF EXISTS "Property owners can create invitations" ON invitations;
CREATE POLICY "Property owners can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

DROP POLICY IF EXISTS "Users can delete their invitations" ON invitations;
CREATE POLICY "Users can delete their invitations"
ON invitations FOR DELETE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Property owners can delete invitations" ON invitations;
CREATE POLICY "Property owners can delete invitations"
ON invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_access pa
    WHERE pa.property_id = invitations.property_id
    AND pa.user_id = auth.uid()
    AND pa.role = 'owner'
  )
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT '✅ Funciones RPC creadas' as status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_user_by_email', 'grant_property_access', 'revoke_property_access', 'get_property_users')
AND routine_schema = 'public';

SELECT '✅ Políticas RLS creadas' as status;
SELECT policyname, tablename FROM pg_policies 
WHERE tablename IN ('property_access', 'properties', 'rooms', 'invitations')
ORDER BY tablename, policyname;

