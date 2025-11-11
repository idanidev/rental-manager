-- =====================================================
-- LIMPIAR BASE DE DATOS - ELIMINAR TODOS LOS DATOS
-- =====================================================
-- Este script elimina TODOS los datos de las tablas
-- pero mantiene la estructura (tablas, índices, políticas, etc.)
-- =====================================================

-- Desactivar temporalmente las restricciones de claves foráneas
SET session_replication_role = 'replica';

-- Eliminar datos en orden (respetando las foreign keys)
TRUNCATE TABLE income CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE tenants CASCADE;
TRUNCATE TABLE invitations CASCADE;
TRUNCATE TABLE property_access CASCADE;
TRUNCATE TABLE properties CASCADE;

-- Reactivar restricciones
SET session_replication_role = 'origin';

-- Verificar que las tablas están vacías
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM properties;
  IF table_count = 0 THEN
    RAISE NOTICE '✅ Base de datos limpiada correctamente';
  ELSE
    RAISE WARNING '⚠️ Aún hay datos en properties: %', table_count;
  END IF;
END $$;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '🗑️  Todas las tablas han sido limpiadas';
  RAISE NOTICE '📊 La estructura de la base de datos se mantiene intacta';
  RAISE NOTICE '✨ Puedes empezar a usar la aplicación desde cero';
END $$;

