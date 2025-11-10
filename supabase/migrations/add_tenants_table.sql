-- =====================================================
-- RENTAL MANAGER - TENANTS TABLE
-- Sistema de inquilinos separado de habitaciones
-- =====================================================

-- Crear tabla de inquilinos
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Datos personales
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  dni VARCHAR(50),
  
  -- Datos del contrato
  contract_start_date DATE,
  contract_months INTEGER DEFAULT 12,
  contract_end_date DATE,
  deposit_amount DECIMAL(10, 2),
  monthly_rent DECIMAL(10, 2),
  
  -- Notas y documentos
  notes TEXT,
  contract_notes TEXT,
  
  -- Estado
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE tenants IS 'Inquilinos de las propiedades, gestionados de forma independiente';
COMMENT ON COLUMN tenants.property_id IS 'Propiedad a la que pertenece el inquilino';
COMMENT ON COLUMN tenants.active IS 'Si el inquilino está actualmente activo (no se ha ido)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

-- Modificar tabla de rooms para referenciar inquilinos
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Índice para la relación room-tenant
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);

-- Comentario
COMMENT ON COLUMN rooms.tenant_id IS 'Referencia al inquilino asignado a esta habitación (si existe)';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver inquilinos de sus propiedades
CREATE POLICY tenants_select_policy ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = tenants.property_id
        AND property_access.user_id = auth.uid()
    )
  );

-- Política: Los usuarios con rol owner/editor pueden crear inquilinos
CREATE POLICY tenants_insert_policy ON tenants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = tenants.property_id
        AND property_access.user_id = auth.uid()
        AND property_access.role IN ('owner', 'editor')
    )
  );

-- Política: Los usuarios con rol owner/editor pueden actualizar inquilinos
CREATE POLICY tenants_update_policy ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = tenants.property_id
        AND property_access.user_id = auth.uid()
        AND property_access.role IN ('owner', 'editor')
    )
  );

-- Política: Los usuarios con rol owner pueden eliminar inquilinos
CREATE POLICY tenants_delete_policy ON tenants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = tenants.property_id
        AND property_access.user_id = auth.uid()
        AND property_access.role = 'owner'
    )
  );

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de inquilinos con sus habitaciones
CREATE OR REPLACE VIEW tenants_with_rooms AS
SELECT 
  t.*,
  p.name as property_name,
  p.address as property_address,
  r.id as room_id,
  r.name as room_name,
  r.monthly_rent as room_rent
FROM tenants t
JOIN properties p ON t.property_id = p.id
LEFT JOIN rooms r ON r.tenant_id = t.id
ORDER BY t.property_id, t.full_name;

-- Vista de inquilinos activos
CREATE OR REPLACE VIEW active_tenants AS
SELECT 
  t.*,
  p.name as property_name,
  COUNT(r.id) as rooms_count
FROM tenants t
JOIN properties p ON t.property_id = p.id
LEFT JOIN rooms r ON r.tenant_id = t.id
WHERE t.active = true
GROUP BY t.id, p.name
ORDER BY t.created_at DESC;

-- Políticas para las vistas
GRANT SELECT ON tenants_with_rooms TO authenticated;
GRANT SELECT ON active_tenants TO authenticated;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener inquilinos de una propiedad
CREATE OR REPLACE FUNCTION get_property_tenants(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  active BOOLEAN,
  rooms_count BIGINT,
  monthly_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.full_name,
    t.email,
    t.phone,
    t.active,
    COUNT(r.id) as rooms_count,
    COALESCE(SUM(r.monthly_rent), 0) as monthly_total
  FROM tenants t
  LEFT JOIN rooms r ON r.tenant_id = t.id
  WHERE t.property_id = p_property_id
  GROUP BY t.id, t.full_name, t.email, t.phone, t.active
  ORDER BY t.active DESC, t.full_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para asignar inquilino a habitación
CREATE OR REPLACE FUNCTION assign_tenant_to_room(
  p_tenant_id UUID,
  p_room_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_property_id UUID;
  v_tenant_property_id UUID;
BEGIN
  -- Verificar que la habitación y el inquilino son de la misma propiedad
  SELECT property_id INTO v_property_id FROM rooms WHERE id = p_room_id;
  SELECT property_id INTO v_tenant_property_id FROM tenants WHERE id = p_tenant_id;
  
  IF v_property_id != v_tenant_property_id THEN
    RAISE EXCEPTION 'El inquilino y la habitación deben ser de la misma propiedad';
  END IF;
  
  -- Verificar que la habitación no es sala común
  IF EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id AND room_type = 'common') THEN
    RAISE EXCEPTION 'No se puede asignar inquilinos a salas comunes';
  END IF;
  
  -- Asignar inquilino a habitación
  UPDATE rooms 
  SET tenant_id = p_tenant_id, 
      occupied = true
  WHERE id = p_room_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función para desasignar inquilino de habitación
CREATE OR REPLACE FUNCTION unassign_tenant_from_room(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE rooms 
  SET tenant_id = NULL, 
      occupied = false
  WHERE id = p_room_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener contratos que vencen pronto
CREATE OR REPLACE FUNCTION get_expiring_contracts(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR,
  property_name VARCHAR,
  contract_end_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.full_name,
    p.name,
    t.contract_end_date,
    (t.contract_end_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM tenants t
  JOIN properties p ON t.property_id = p.id
  WHERE t.active = true
    AND t.contract_end_date IS NOT NULL
    AND t.contract_end_date <= CURRENT_DATE + days_ahead
    AND t.contract_end_date >= CURRENT_DATE
  ORDER BY t.contract_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- MIGRACIÓN DE DATOS EXISTENTES (OPCIONAL)
-- =====================================================

-- Esta función migra inquilinos existentes de rooms a tenants
-- EJECUTAR SOLO UNA VEZ Y CON PRECAUCIÓN
CREATE OR REPLACE FUNCTION migrate_existing_tenants()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_room RECORD;
  v_tenant_id UUID;
BEGIN
  -- Para cada habitación ocupada con datos de inquilino
  FOR v_room IN 
    SELECT * FROM rooms 
    WHERE occupied = true 
      AND tenant_name IS NOT NULL 
      AND tenant_name != ''
      AND tenant_id IS NULL
  LOOP
    -- Crear inquilino
    INSERT INTO tenants (
      property_id,
      full_name,
      email,
      phone,
      dni,
      contract_start_date,
      contract_months,
      contract_end_date,
      deposit_amount,
      monthly_rent,
      contract_notes,
      active
    ) VALUES (
      v_room.property_id,
      v_room.tenant_name,
      v_room.tenant_email,
      v_room.tenant_phone,
      v_room.tenant_dni,
      v_room.contract_start_date,
      v_room.contract_months,
      v_room.contract_end_date,
      v_room.deposit_amount,
      v_room.monthly_rent,
      v_room.contract_notes,
      true
    )
    RETURNING id INTO v_tenant_id;
    
    -- Asignar inquilino a habitación
    UPDATE rooms SET tenant_id = v_tenant_id WHERE id = v_room.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
FLUJO DE TRABAJO NUEVO:

1. GESTIÓN DE INQUILINOS (separado):
   - Ir a: Propiedades → [Mi Propiedad] → Inquilinos
   - Añadir nuevo inquilino con sus datos
   - El inquilino existe independientemente de habitaciones

2. ASIGNACIÓN A HABITACIONES:
   - Ir a: Habitaciones → Editar habitación
   - Seleccionar inquilino existente del dropdown
   - La habitación se marca como ocupada automáticamente

3. VENTAJAS:
   - Inquilinos no se pierden al cambiar de habitación
   - Historial completo de inquilinos
   - Múltiples habitaciones por inquilino
   - Datos centralizados

CAMPOS DEPRECADOS EN ROOMS:
- tenant_name
- tenant_email
- tenant_phone
- tenant_dni
- contract_*

NUEVOS CAMPOS:
- tenant_id (FK a tenants)

MANTENER COMPATIBILIDAD:
Los campos antiguos se mantienen temporalmente para migración suave.
*/

