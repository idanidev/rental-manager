-- =====================================================
-- FIX: Función grant_property_access para aceptar invitaciones
-- =====================================================
-- Modifica grant_property_access para permitir aceptar invitaciones
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS grant_property_access(UUID, UUID, TEXT);

-- Crear función mejorada que permite:
-- 1. Owners pueden dar acceso a otros usuarios
-- 2. Usuarios pueden aceptar sus propias invitaciones
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
  v_has_invitation BOOLEAN;
  v_invitation_role TEXT;
  v_user_email TEXT;
  v_result JSONB;
BEGIN
  -- Verificar si el usuario que llama es owner
  -- Primero verificar si es owner_id directamente en properties
  SELECT EXISTS(
    SELECT 1 
    FROM properties p
    WHERE p.id = p_property_id
    AND p.owner_id = auth.uid()
  ) OR EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;

  -- Si no es owner, verificar si tiene una invitación válida
  IF NOT v_is_owner THEN
    -- Verificar si el usuario que acepta (p_user_id) es el mismo que llama (auth.uid())
    -- Y si tiene una invitación válida para esta propiedad
    IF p_user_id = auth.uid() THEN
      -- Obtener el email del usuario autenticado
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = auth.uid();
      
      -- Verificar si hay una invitación válida
      SELECT EXISTS(
        SELECT 1 
        FROM invitations
        WHERE property_id = p_property_id
        AND email = v_user_email
        AND expires_at > NOW()
      ), 
      (
        SELECT role
        FROM invitations
        WHERE property_id = p_property_id
        AND email = v_user_email
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      )
      INTO v_has_invitation, v_invitation_role;
      
      IF NOT v_has_invitation THEN
        RAISE EXCEPTION 'No tienes una invitación válida para esta propiedad';
      END IF;
      
      -- Usar el rol de la invitación, no el que se pasa como parámetro
      p_role := v_invitation_role;
    ELSE
      -- Si no es owner y no está aceptando su propia invitación, no tiene permisos
      RAISE EXCEPTION 'No tienes permisos para dar acceso a otros usuarios';
    END IF;
  END IF;

  -- Verificar que el usuario no tenga acceso ya
  IF EXISTS(
    SELECT 1 
    FROM property_access
    WHERE property_id = p_property_id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Este usuario ya tiene acceso a esta propiedad';
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

-- Verificar que la función se creó correctamente
SELECT '✅ Función grant_property_access actualizada' as status;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'grant_property_access'
AND routine_schema = 'public';

