-- =====================================================
-- RENTAL MANAGER - PUSH NOTIFICATIONS
-- Sistema de notificaciones push para contratos y facturas
-- =====================================================

-- Tabla para almacenar suscripciones push de usuarios
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_info JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled);

-- Comentarios
COMMENT ON TABLE push_subscriptions IS 'Suscripciones push de usuarios para recibir notificaciones';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL endpoint de la suscripción push';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Clave pública P256DH de la suscripción';
COMMENT ON COLUMN push_subscriptions.auth IS 'Token de autenticación de la suscripción';
COMMENT ON COLUMN push_subscriptions.device_info IS 'Información del dispositivo (navegador, OS, etc.)';

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y gestionar sus propias suscripciones
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla para almacenar notificaciones enviadas (para evitar duplicados)
CREATE TABLE IF NOT EXISTS sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'contract_expiring', 'contract_expired', 'invoice_pending'
  reference_id UUID, -- ID del contrato, factura, etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_type, reference_id, DATE(sent_at))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sent_notifications_user_id ON sent_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_notifications_type ON sent_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_sent_notifications_sent_at ON sent_notifications(sent_at DESC);

-- RLS Policies
ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sent notifications"
  ON sent_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Función para limpiar notificaciones antiguas (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM sent_notifications
  WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



