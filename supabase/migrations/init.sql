-- =====================================================
-- RENTAL MANAGER - INITIAL DATABASE SCHEMA
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
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

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
CREATE INDEX idx_property_access_property ON property_access(property_id);
CREATE INDEX idx_property_access_user ON property_access(user_id);

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
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_rooms_occupied ON rooms(occupied);

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
CREATE INDEX idx_expenses_property ON expenses(property_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);

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
CREATE INDEX idx_income_property ON income(property_id);
CREATE INDEX idx_income_room ON income(room_id);
CREATE INDEX idx_income_month ON income(month DESC);
CREATE INDEX idx_income_paid ON income(paid);

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
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_property ON invitations(property_id);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

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
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para rooms
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para income
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

-- Ver propiedades: usuarios con acceso
CREATE POLICY "Users can view properties they have access to"
  ON properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = properties.id
      AND property_access.user_id = auth.uid()
    )
  );

-- Crear propiedades: cualquier usuario autenticado
CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Actualizar propiedades: owners y editors
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

-- Eliminar propiedades: solo owners
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

-- Ver accesos: usuarios con acceso a la propiedad
CREATE POLICY "Users can view access of their properties"
  ON property_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
    )
  );

-- Crear accesos: se maneja por trigger o función
CREATE POLICY "System can create property access"
  ON property_access FOR INSERT
  WITH CHECK (true);

-- Actualizar accesos: solo owners
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

-- Eliminar accesos: solo owners
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

-- Ver habitaciones: usuarios con acceso
CREATE POLICY "Users can view rooms of their properties"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = rooms.property_id
      AND property_access.user_id = auth.uid()
    )
  );

-- Crear habitaciones: owners y editors
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

-- Actualizar habitaciones: owners y editors
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

-- Eliminar habitaciones: owners y editors
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

CREATE POLICY "Users can view expenses of their properties"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = expenses.property_id
      AND property_access.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can view income of their properties"
  ON income FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = income.property_id
      AND property_access.user_id = auth.uid()
    )
  );

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
-- DATOS DE EJEMPLO (OPCIONAL - Comentado)
-- =====================================================

-- Descomentar para insertar datos de prueba
/*
-- Insertar propiedad de ejemplo
INSERT INTO properties (name, address, description, owner_id)
VALUES ('Casa Principal', 'Calle Ejemplo 123, Madrid', 'Casa de 3 habitaciones', auth.uid());

-- Obtener el ID de la propiedad recién creada
-- Y usarlo para insertar habitaciones, gastos, etc.
*/
