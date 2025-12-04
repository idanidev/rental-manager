-- =====================================================
-- CAMBIAR DURACIÓN PREDETERMINADA DEL CONTRATO A 6 MESES
-- =====================================================

-- Cambiar el valor por defecto en la tabla tenants
ALTER TABLE tenants 
ALTER COLUMN contract_months SET DEFAULT 6;

-- Actualizar comentario
COMMENT ON COLUMN tenants.contract_months IS 'Duración del contrato en meses (por defecto 6 meses)';






