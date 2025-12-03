-- ========================================
-- SISTEMA DE NOTIFICACIONES
-- ========================================

-- Tabla: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'contract_expiring',
    'contract_expired',
    'weekly_report',
    'invitation',
    'expense',
    'income',
    'room_change'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read) 
  WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_property 
  ON notifications(property_id) 
  WHERE property_id IS NOT NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuarios pueden actualizar sus propias notificaciones
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuarios pueden eliminar sus propias notificaciones
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Política: Solo el sistema puede insertar notificaciones (via service role)
-- Esto se manejará desde Edge Functions con service role usando la función create_notification
-- que es SECURITY DEFINER y puede insertar sin necesidad de política RLS

-- ========================================
-- Tabla: notification_settings
-- ========================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuración de alertas de contratos
  contract_alert_days INTEGER[] DEFAULT ARRAY[7, 15, 30],
  enable_contract_alerts BOOLEAN DEFAULT TRUE,
  enable_weekly_report BOOLEAN DEFAULT TRUE,
  
  -- Otras notificaciones
  enable_invitation_alerts BOOLEAN DEFAULT TRUE,
  enable_expense_alerts BOOLEAN DEFAULT TRUE,
  enable_income_alerts BOOLEAN DEFAULT FALSE,
  enable_room_alerts BOOLEAN DEFAULT FALSE,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_notification_settings_user 
  ON notification_settings(user_id);

-- RLS Policies
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden gestionar sus propias configuraciones
DROP POLICY IF EXISTS "Users can manage own settings" ON notification_settings;
CREATE POLICY "Users can manage own settings"
  ON notification_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Función para crear configuración por defecto al crear usuario
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear settings automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- ========================================
-- Función helper: Crear notificación
-- ========================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_property_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    property_id,
    type,
    title,
    message,
    metadata
  )
  VALUES (
    p_user_id,
    p_property_id,
    p_type,
    p_title,
    p_message,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Función: Obtener notificaciones no leídas
-- ========================================

CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Comentarios
-- ========================================

COMMENT ON TABLE notifications IS 'Sistema de notificaciones in-app para usuarios';
COMMENT ON TABLE notification_settings IS 'Configuración personalizada de notificaciones por usuario';
COMMENT ON FUNCTION create_notification IS 'Helper para crear notificaciones desde Edge Functions';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Obtener contador de notificaciones no leídas';

