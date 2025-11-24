-- =====================================================
-- ROOMIE RULES FEATURES
-- Sistema de reglas de convivencia, gastos compartidos y recordatorios
-- =====================================================

-- =====================================================
-- TABLA: house_rules (Reglas de Convivencia)
-- =====================================================
CREATE TABLE IF NOT EXISTS house_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('limpieza', 'ruido', 'visitas', 'cocina', 'baño', 'comunidad', 'otro')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para house_rules
CREATE INDEX IF NOT EXISTS idx_house_rules_property ON house_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_house_rules_category ON house_rules(category);

-- =====================================================
-- TABLA: shared_expenses (Gastos Compartidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('servicios', 'compras', 'reparaciones', 'limpieza', 'otro')),
  date DATE NOT NULL,
  split_type VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'by_room')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para shared_expenses
CREATE INDEX IF NOT EXISTS idx_shared_expenses_property ON shared_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_date ON shared_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_category ON shared_expenses(category);

-- =====================================================
-- TABLA: expense_splits (División de Gastos)
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Asegurar que cada split tiene un tenant_id o user_id
  CHECK (tenant_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Índices para expense_splits
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_tenant ON expense_splits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_paid ON expense_splits(paid);

-- =====================================================
-- TABLA: reminders (Recordatorios y Eventos)
-- =====================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('pago', 'reunion', 'limpieza', 'evento', 'otro')),
  due_date DATE NOT NULL,
  due_time TIME,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reminders
CREATE INDEX IF NOT EXISTS idx_reminders_property ON reminders(property_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================

-- Trigger para house_rules
CREATE OR REPLACE FUNCTION update_house_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_house_rules_updated_at
  BEFORE UPDATE ON house_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_house_rules_updated_at();

-- Trigger para shared_expenses
CREATE OR REPLACE FUNCTION update_shared_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_expenses_updated_at
  BEFORE UPDATE ON shared_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_expenses_updated_at();

-- Trigger para expense_splits
CREATE OR REPLACE FUNCTION update_expense_splits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_splits_updated_at
  BEFORE UPDATE ON expense_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_splits_updated_at();

-- Trigger para reminders
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE house_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES para house_rules
-- =====================================================

-- Ver reglas de propiedades accesibles
CREATE POLICY "Users can view rules of accessible properties"
ON house_rules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = house_rules.property_id
    AND property_access.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = house_rules.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Crear reglas (owners y editors)
CREATE POLICY "Owners and editors can create rules"
ON house_rules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = house_rules.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = house_rules.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Actualizar reglas (owners y editors)
CREATE POLICY "Owners and editors can update rules"
ON house_rules FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = house_rules.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = house_rules.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Eliminar reglas (solo owners)
CREATE POLICY "Only owners can delete rules"
ON house_rules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = house_rules.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role = 'owner'
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = house_rules.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- =====================================================
-- POLICIES para shared_expenses
-- =====================================================

-- Ver gastos compartidos de propiedades accesibles
CREATE POLICY "Users can view shared expenses of accessible properties"
ON shared_expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = shared_expenses.property_id
    AND property_access.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = shared_expenses.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Crear gastos compartidos (owners y editors)
CREATE POLICY "Owners and editors can create shared expenses"
ON shared_expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = shared_expenses.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = shared_expenses.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Actualizar gastos compartidos (owners y editors)
CREATE POLICY "Owners and editors can update shared expenses"
ON shared_expenses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = shared_expenses.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = shared_expenses.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Eliminar gastos compartidos (solo owners)
CREATE POLICY "Only owners can delete shared expenses"
ON shared_expenses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = shared_expenses.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role = 'owner'
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = shared_expenses.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- =====================================================
-- POLICIES para expense_splits
-- =====================================================

-- Ver splits de gastos accesibles
CREATE POLICY "Users can view expense splits of accessible expenses"
ON expense_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shared_expenses se
    JOIN property_access pa ON pa.property_id = se.property_id
    WHERE se.id = expense_splits.expense_id
    AND pa.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM shared_expenses se
    JOIN properties p ON p.id = se.property_id
    WHERE se.id = expense_splits.expense_id
    AND p.owner_id = auth.uid()
  )
  OR
  expense_splits.user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM expense_splits es
    JOIN tenants t ON t.id = es.tenant_id
    JOIN rooms r ON r.tenant_id = t.id
    WHERE es.id = expense_splits.id
    AND EXISTS (
      SELECT 1 FROM property_access pa
      WHERE pa.property_id = t.property_id
      AND pa.user_id = auth.uid()
    )
  )
);

-- Crear/actualizar splits (owners y editors)
CREATE POLICY "Owners and editors can manage expense splits"
ON expense_splits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shared_expenses se
    JOIN property_access pa ON pa.property_id = se.property_id
    WHERE se.id = expense_splits.expense_id
    AND pa.user_id = auth.uid()
    AND pa.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM shared_expenses se
    JOIN properties p ON p.id = se.property_id
    WHERE se.id = expense_splits.expense_id
    AND p.owner_id = auth.uid()
  )
);

-- =====================================================
-- POLICIES para reminders
-- =====================================================

-- Ver recordatorios de propiedades accesibles
CREATE POLICY "Users can view reminders of accessible properties"
ON reminders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = reminders.property_id
    AND property_access.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = reminders.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Crear recordatorios (owners y editors)
CREATE POLICY "Owners and editors can create reminders"
ON reminders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = reminders.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = reminders.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Actualizar recordatorios (owners y editors)
CREATE POLICY "Owners and editors can update reminders"
ON reminders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = reminders.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role IN ('owner', 'editor')
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = reminders.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Eliminar recordatorios (solo owners)
CREATE POLICY "Only owners can delete reminders"
ON reminders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_access
    WHERE property_access.property_id = reminders.property_id
    AND property_access.user_id = auth.uid()
    AND property_access.role = 'owner'
  )
  OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = reminders.property_id
    AND properties.owner_id = auth.uid()
  )
);

