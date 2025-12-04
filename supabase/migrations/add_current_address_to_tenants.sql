-- Añadir campo current_address a la tabla de tenants
-- Este campo almacena el domicilio actual del inquilino (diferente de la dirección de la propiedad)
-- Se usa en los contratos para indicar dónde vive el inquilino antes de mudarse

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS current_address VARCHAR(500);

COMMENT ON COLUMN tenants.current_address IS 'Domicilio actual del inquilino (usado en contratos, diferente de la dirección de la propiedad)';






