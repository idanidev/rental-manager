-- ========================================
-- FIX: Hacer el trigger de notificaciones más resiliente
-- ========================================
-- Este fix evita que el trigger bloquee la creación de usuarios
-- si hay algún problema con las tablas de notificaciones

-- Función mejorada para crear configuración por defecto al crear usuario
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Intentar crear los settings, pero no fallar si hay algún problema
  BEGIN
    -- Verificar si la tabla existe antes de intentar insertar
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_settings'
    ) THEN
      INSERT INTO notification_settings (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay algún error, solo loguear y continuar
      -- NO bloquear la creación del usuario
      RAISE WARNING 'Error al crear notification_settings para usuario %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear el trigger con la función mejorada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

COMMENT ON FUNCTION create_default_notification_settings IS 'Crea settings de notificaciones por defecto para nuevos usuarios. No bloquea la creación del usuario si falla.';


