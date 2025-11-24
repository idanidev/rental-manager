-- =====================================================
-- RENTAL MANAGER - TODAS LAS MIGRACIONES CONSOLIDADAS
-- =====================================================
-- Este archivo contiene TODAS las migraciones necesarias
-- Ejecuta este archivo completo en el SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: SCHEMA INICIAL (init.sql)
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: properties (Propiedades)
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- =====================================================
-- TABLA: property_access (Permisos de acceso)
-- =====================================================
CREATE TABLE IF NOT EXISTS property_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Índices para property_access
CREATE INDEX IF NOT EXISTS idx_property_access_property ON property_access(property_id);
CREATE INDEX IF NOT EXISTS idx_property_access_user ON property_access(user_id);

-- =====================================================
-- TABLA: rooms (Habitaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  size_sqm DECIMAL(10, 2),
  occupied BOOLEAN DEFAULT FALSE,
  tenant_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rooms
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_occupied ON rooms(occupied);

-- =====================================================
-- TABLA: expenses (Gastos)
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para expenses
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- =====================================================
-- TABLA: income (Ingresos)
-- =====================================================
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  month DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para income
CREATE INDEX IF NOT EXISTS idx_income_property ON income(property_id);
CREATE INDEX IF NOT EXISTS idx_income_room ON income(room_id);
CREATE INDEX IF NOT EXISTS idx_income_month ON income(month DESC);
CREATE INDEX IF NOT EXISTS idx_income_paid ON income(paid);

-- =====================================================
-- TABLA: invitations (Invitaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_property ON invitations(property_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para rooms
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para expenses
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para income
DROP TRIGGER IF EXISTS update_income_updated_at ON income;
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES para properties
-- =====================================================

DROP POLICY IF EXISTS "Users can view properties they have access to" ON properties;
CREATE POLICY "Users can view properties they have access to"
  ON properties FOR SELECT
  USING (
    -- Ver si eres el owner_id directamente
    owner_id = auth.uid()
    OR
    -- O si tienes acceso a través de property_access
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = properties.id
      AND property_access.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create properties" ON properties;
CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Owners and editors can update properties" ON properties;
CREATE POLICY "Owners and editors can update properties"
  ON properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = properties.id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Only owners can delete properties" ON properties;
CREATE POLICY "Only owners can delete properties"
  ON properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = properties.id
      AND property_access.user_id = auth.uid()
      AND property_access.role = 'owner'
    )
  );

-- =====================================================
-- POLICIES para property_access
-- =====================================================

DROP POLICY IF EXISTS "Users can view access of their properties" ON property_access;
CREATE POLICY "Users can view access of their properties"
  ON property_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create property access" ON property_access;
CREATE POLICY "System can create property access"
  ON property_access FOR INSERT
  WITH CHECK (
    -- Solo permitir si el usuario es el owner_id de la propiedad
    -- Esto evita recursión porque no consulta property_access
    -- Para invitaciones posteriores, usar la función grant_property_access (SECURITY DEFINER)
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_access.property_id
      AND p.owner_id = auth.uid()
    )
  );

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

DROP POLICY IF EXISTS "Owners can delete access" ON property_access;
CREATE POLICY "Owners can delete access"
  ON property_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
      AND pa.role = 'owner'
    )
  );

-- =====================================================
-- POLICIES para rooms
-- =====================================================

DROP POLICY IF EXISTS "Users can view rooms of their properties" ON rooms;
CREATE POLICY "Users can view rooms of their properties"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = rooms.property_id
      AND property_access.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and editors can create rooms" ON rooms;
CREATE POLICY "Owners and editors can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = rooms.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can update rooms" ON rooms;
CREATE POLICY "Owners and editors can update rooms"
  ON rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = rooms.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can delete rooms" ON rooms;
CREATE POLICY "Owners and editors can delete rooms"
  ON rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = rooms.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

-- =====================================================
-- POLICIES para expenses
-- =====================================================

DROP POLICY IF EXISTS "Users can view expenses of their properties" ON expenses;
CREATE POLICY "Users can view expenses of their properties"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = expenses.property_id
      AND property_access.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and editors can create expenses" ON expenses;
CREATE POLICY "Owners and editors can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = expenses.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can update expenses" ON expenses;
CREATE POLICY "Owners and editors can update expenses"
  ON expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = expenses.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can delete expenses" ON expenses;
CREATE POLICY "Owners and editors can delete expenses"
  ON expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = expenses.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

-- =====================================================
-- POLICIES para income
-- =====================================================

DROP POLICY IF EXISTS "Users can view income of their properties" ON income;
CREATE POLICY "Users can view income of their properties"
  ON income FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = income.property_id
      AND property_access.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and editors can create income" ON income;
CREATE POLICY "Owners and editors can create income"
  ON income FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = income.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can update income" ON income;
CREATE POLICY "Owners and editors can update income"
  ON income FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = income.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Owners and editors can delete income" ON income;
CREATE POLICY "Owners and editors can delete income"
  ON income FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = income.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role IN ('owner', 'editor')
    )
  );

-- =====================================================
-- POLICIES para invitations
-- =====================================================

DROP POLICY IF EXISTS "Users can view invitations for their properties" ON invitations;
CREATE POLICY "Users can view invitations for their properties"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = invitations.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role = 'owner'
    )
    OR invitations.email = auth.jwt()->>'email'
  );

DROP POLICY IF EXISTS "Owners can create invitations" ON invitations;
CREATE POLICY "Owners can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = invitations.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can delete invitations" ON invitations;
CREATE POLICY "Owners can delete invitations"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = invitations.property_id
      AND property_access.user_id = auth.uid()
      AND property_access.role = 'owner'
    )
  );

-- =====================================================
-- PARTE 2: FOTOS Y SALAS COMUNES
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
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_occupied_check;
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_type_occupied_check;

-- Las habitaciones privadas pueden estar ocupadas, las comunes no
ALTER TABLE rooms ADD CONSTRAINT rooms_type_occupied_check 
  CHECK (
    (room_type = 'private') OR 
    (room_type = 'common' AND occupied = false)
  );

-- =====================================================
-- PARTE 3: SISTEMA DE INQUILINOS
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

-- Comentarios
COMMENT ON TABLE tenants IS 'Inquilinos de las propiedades, gestionados de forma independiente';
COMMENT ON COLUMN tenants.property_id IS 'Propiedad a la que pertenece el inquilino';
COMMENT ON COLUMN tenants.active IS 'Si el inquilino está actualmente activo (no se ha ido)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

-- Modificar tabla de rooms para referenciar inquilinos
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);

COMMENT ON COLUMN rooms.tenant_id IS 'Referencia al inquilino asignado a esta habitación (si existe)';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select_policy ON tenants;
CREATE POLICY tenants_select_policy ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = tenants.property_id
        AND property_access.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS tenants_insert_policy ON tenants;
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

DROP POLICY IF EXISTS tenants_update_policy ON tenants;
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

DROP POLICY IF EXISTS tenants_delete_policy ON tenants;
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
-- FUNCIONES ÚTILES
-- =====================================================

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
  SELECT property_id INTO v_property_id FROM rooms WHERE id = p_room_id;
  SELECT property_id INTO v_tenant_property_id FROM tenants WHERE id = p_tenant_id;
  
  IF v_property_id != v_tenant_property_id THEN
    RAISE EXCEPTION 'El inquilino y la habitación deben ser de la misma propiedad';
  END IF;
  
  IF EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id AND room_type = 'common') THEN
    RAISE EXCEPTION 'No se puede asignar inquilinos a salas comunes';
  END IF;
  
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
-- FUNCIÓN PARA BUSCAR USUARIOS POR EMAIL
-- =====================================================

-- Función para buscar usuarios por email
-- Esta función permite buscar si un email ya está registrado en la app
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT
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

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

-- =====================================================
-- FINALIZADO
-- =====================================================

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ TODAS LAS MIGRACIONES COMPLETADAS CON ÉXITO';
  RAISE NOTICE '📊 Tablas creadas: properties, property_access, rooms, tenants, expenses, income, invitations';
  RAISE NOTICE '🔒 Row Level Security configurado';
  RAISE NOTICE '🔍 Función get_user_by_email creada';
  RAISE NOTICE '🎯 Próximo paso: Configurar Storage bucket "room-photos"';
END $$;

