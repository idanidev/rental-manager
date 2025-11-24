-- FIX: RLS Policy para properties - permite INSERT y SELECT para owners
DROP POLICY IF EXISTS "Users can view properties they have access to" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;

-- SELECT: Ver propiedades donde eres owner O tienes acceso
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

-- INSERT: Crear propiedades
CREATE POLICY "Users can create properties"
ON properties FOR INSERT
WITH CHECK (
  auth.uid() = owner_id
  AND auth.uid() IS NOT NULL
);
