-- =====================================================
-- RENTAL MANAGER - ADD ROOM DETAILS
-- Añadir campos para inventario y gestión de contratos
-- =====================================================

-- Añadir campos de contrato e inventario a la tabla rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS contract_months INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_dni VARCHAR(50);

-- Inventario (almacenado como JSONB para flexibilidad)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;

-- Notas del contrato
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS contract_notes TEXT;

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_rooms_contract_end_date ON rooms(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_email ON rooms(tenant_email);

-- Comentarios para documentación
COMMENT ON COLUMN rooms.contract_start_date IS 'Fecha de inicio del contrato de alquiler';
COMMENT ON COLUMN rooms.contract_end_date IS 'Fecha de finalización del contrato';
COMMENT ON COLUMN rooms.contract_months IS 'Duración del contrato en meses';
COMMENT ON COLUMN rooms.deposit_amount IS 'Monto de la fianza/depósito';
COMMENT ON COLUMN rooms.tenant_email IS 'Email del inquilino';
COMMENT ON COLUMN rooms.tenant_phone IS 'Teléfono del inquilino';
COMMENT ON COLUMN rooms.tenant_dni IS 'DNI/Identificación del inquilino';
COMMENT ON COLUMN rooms.inventory IS 'Inventario de items entregados con la habitación (JSON array)';
COMMENT ON COLUMN rooms.contract_notes IS 'Notas adicionales del contrato';

-- Función para calcular fecha de finalización automáticamente
CREATE OR REPLACE FUNCTION calculate_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se proporciona fecha de inicio y meses, calcular fecha de fin
  IF NEW.contract_start_date IS NOT NULL AND NEW.contract_months IS NOT NULL THEN
    NEW.contract_end_date := NEW.contract_start_date + (NEW.contract_months || ' months')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automáticamente la fecha de fin
DROP TRIGGER IF EXISTS calculate_room_contract_end_date ON rooms;
CREATE TRIGGER calculate_room_contract_end_date
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_end_date();

-- Vista para contratos próximos a vencer (30 días)
CREATE OR REPLACE VIEW contracts_expiring_soon AS
SELECT 
  r.id,
  r.name as room_name,
  r.tenant_name,
  r.tenant_email,
  r.tenant_phone,
  r.monthly_rent,
  r.contract_start_date,
  r.contract_end_date,
  r.contract_months,
  r.deposit_amount,
  p.id as property_id,
  p.name as property_name,
  p.address,
  (r.contract_end_date - CURRENT_DATE) as days_until_expiration
FROM rooms r
JOIN properties p ON r.property_id = p.id
WHERE r.occupied = true
  AND r.contract_end_date IS NOT NULL
  AND r.contract_end_date <= CURRENT_DATE + INTERVAL '30 days'
  AND r.contract_end_date >= CURRENT_DATE
ORDER BY r.contract_end_date ASC;

-- Políticas de seguridad para la vista (heredan de rooms y properties)
GRANT SELECT ON contracts_expiring_soon TO authenticated;

