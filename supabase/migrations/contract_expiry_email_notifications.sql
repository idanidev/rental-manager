-- =====================================================
-- RENTAL MANAGER - NOTIFICACIONES POR EMAIL DE CONTRATOS POR VENCER
-- =====================================================
-- Este sistema envía emails a propietarios y editores cuando un contrato está por vencer
-- =====================================================

-- Tabla para registrar notificaciones enviadas (evitar duplicados)
CREATE TABLE IF NOT EXISTS contract_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  days_until_expiry INTEGER NOT NULL,
  sent_to_emails TEXT[] NOT NULL, -- Array de emails a los que se envió
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, notification_date, days_until_expiry)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_notifications_tenant ON contract_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_property ON contract_notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_date ON contract_notifications(notification_date);

-- Comentarios
COMMENT ON TABLE contract_notifications IS 'Registro de notificaciones por email enviadas sobre contratos por vencer';
COMMENT ON COLUMN contract_notifications.days_until_expiry IS 'Días hasta el vencimiento cuando se envió la notificación';

-- Función para obtener contratos por vencer que necesitan notificación
CREATE OR REPLACE FUNCTION get_contracts_needing_notification(
  days_before INTEGER DEFAULT 30
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR,
  tenant_email VARCHAR,
  property_id UUID,
  property_name VARCHAR,
  property_address TEXT,
  contract_end_date DATE,
  days_until_expiry INTEGER,
  owner_emails TEXT[],
  editor_emails TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.full_name as tenant_name,
    t.email as tenant_email,
    p.id as property_id,
    p.name as property_name,
    p.address as property_address,
    t.contract_end_date,
    (t.contract_end_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    -- Obtener emails de propietarios
    ARRAY(
      SELECT DISTINCT u.email
      FROM property_access pa
      JOIN auth.users u ON u.id = pa.user_id
      WHERE pa.property_id = p.id
        AND pa.role = 'owner'
        AND u.email IS NOT NULL
    ) as owner_emails,
    -- Obtener emails de editores
    ARRAY(
      SELECT DISTINCT u.email
      FROM property_access pa
      JOIN auth.users u ON u.id = pa.user_id
      WHERE pa.property_id = p.id
        AND pa.role = 'editor'
        AND u.email IS NOT NULL
    ) as editor_emails
  FROM tenants t
  JOIN properties p ON t.property_id = p.id
  WHERE t.active = true
    AND t.contract_end_date IS NOT NULL
    AND t.contract_end_date <= CURRENT_DATE + (days_before || ' days')::INTERVAL
    AND t.contract_end_date >= CURRENT_DATE
    -- Solo contratos que no han recibido notificación hoy para este número de días
    AND NOT EXISTS (
      SELECT 1 
      FROM contract_notifications cn
      WHERE cn.tenant_id = t.id
        AND cn.notification_date = CURRENT_DATE
        AND cn.days_until_expiry = (t.contract_end_date - CURRENT_DATE)::INTEGER
    )
  ORDER BY t.contract_end_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función para registrar que se envió una notificación
CREATE OR REPLACE FUNCTION record_contract_notification(
  p_tenant_id UUID,
  p_property_id UUID,
  p_days_until_expiry INTEGER,
  p_sent_to_emails TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO contract_notifications (
    tenant_id,
    property_id,
    notification_date,
    days_until_expiry,
    sent_to_emails
  ) VALUES (
    p_tenant_id,
    p_property_id,
    CURRENT_DATE,
    p_days_until_expiry,
    p_sent_to_emails
  )
  ON CONFLICT (tenant_id, notification_date, days_until_expiry) 
  DO UPDATE SET
    sent_to_emails = contract_notifications.sent_to_emails || p_sent_to_emails
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para contract_notifications
ALTER TABLE contract_notifications ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver notificaciones de sus propiedades
CREATE POLICY contract_notifications_select_policy ON contract_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_access
      WHERE property_access.property_id = contract_notifications.property_id
        AND property_access.user_id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON FUNCTION get_contracts_needing_notification IS 'Obtiene contratos por vencer que necesitan notificación por email';
COMMENT ON FUNCTION record_contract_notification IS 'Registra que se envió una notificación por email sobre un contrato por vencer';

-- =====================================================
-- NOTA: Para enviar los emails, necesitarás crear una Edge Function en Supabase
-- o usar un servicio externo como SendGrid, Resend, etc.
-- 
-- Ejemplo de uso desde una Edge Function:
-- 
-- 1. Llamar a get_contracts_needing_notification(30) para obtener contratos
-- 2. Para cada contrato, enviar email a owner_emails y editor_emails
-- 3. Llamar a record_contract_notification() para registrar el envío
-- 
-- Puedes configurar un cron job en Supabase para ejecutar esto diariamente
-- =====================================================






