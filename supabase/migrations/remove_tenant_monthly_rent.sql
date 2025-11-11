-- Eliminar columna monthly_rent de la tabla tenants
-- El precio mensual debe estar asociado a la habitación, no al inquilino

-- La renta mensual se define en la tabla rooms
-- Un inquilino paga el precio de la habitación donde está asignado

ALTER TABLE tenants 
DROP COLUMN IF EXISTS monthly_rent;

-- Comentario: Ahora el monthly_rent solo existe en rooms
-- Para obtener cuánto paga un inquilino, se debe hacer JOIN con rooms

