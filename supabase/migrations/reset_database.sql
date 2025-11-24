-- =====================================================
-- RESET COMPLETO DE BASE DE DATOS
-- =====================================================
-- Este script ELIMINA TODAS las tablas, funciones, políticas, etc.
-- y luego recrea todo desde cero
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos
-- =====================================================

-- Deshabilitar RLS temporalmente para poder eliminar políticas y tablas
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS property_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS income DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas de RLS
DROP POLICY IF EXISTS "Users can view properties they have access to" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Owners and editors can update properties" ON properties;
DROP POLICY IF EXISTS "Only owners can delete properties" ON properties;

DROP POLICY IF EXISTS "Users can view access of their properties" ON property_access;
DROP POLICY IF EXISTS "System can create property access" ON property_access;
DROP POLICY IF EXISTS "Owners can update access" ON property_access;
DROP POLICY IF EXISTS "Owners can delete access" ON property_access;

DROP POLICY IF EXISTS "Users can view rooms of their properties" ON rooms;
DROP POLICY IF EXISTS "Owners and editors can create rooms" ON rooms;
DROP POLICY IF EXISTS "Owners and editors can update rooms" ON rooms;
DROP POLICY IF EXISTS "Owners and editors can delete rooms" ON rooms;

DROP POLICY IF EXISTS "Users can view expenses of their properties" ON expenses;
DROP POLICY IF EXISTS "Owners and editors can create expenses" ON expenses;
DROP POLICY IF EXISTS "Owners and editors can update expenses" ON expenses;
DROP POLICY IF EXISTS "Owners and editors can delete expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view income of their properties" ON income;
DROP POLICY IF EXISTS "Owners and editors can create income" ON income;
DROP POLICY IF EXISTS "Owners and editors can update income" ON income;
DROP POLICY IF EXISTS "Owners and editors can delete income" ON income;

DROP POLICY IF EXISTS "Users can view invitations for their properties" ON invitations;
DROP POLICY IF EXISTS "Owners can create invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view their own pending invitations" ON invitations;
DROP POLICY IF EXISTS "Users can delete their own invitations" ON invitations;

DROP POLICY IF EXISTS tenants_select_policy ON tenants;
DROP POLICY IF EXISTS tenants_insert_policy ON tenants;
DROP POLICY IF EXISTS tenants_update_policy ON tenants;
DROP POLICY IF EXISTS tenants_delete_policy ON tenants;

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_income_updated_at ON income;
DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS calculate_contract_end_date_trigger ON tenants;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS calculate_contract_end_date();
DROP FUNCTION IF EXISTS assign_tenant_to_room(UUID, UUID);
DROP FUNCTION IF EXISTS unassign_tenant_from_room(UUID);
DROP FUNCTION IF EXISTS get_expiring_contracts(INTEGER);
DROP FUNCTION IF EXISTS get_user_by_email(TEXT);
DROP FUNCTION IF EXISTS grant_property_access(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS revoke_property_access(UUID, UUID);
DROP FUNCTION IF EXISTS get_property_users(UUID);

-- Eliminar tablas en orden de dependencia inversa
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS property_access CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Base de datos limpiada completamente. Todas las tablas, funciones, triggers y políticas RLS han sido eliminadas.';
  RAISE NOTICE '📝 Ahora ejecuta ALL_MIGRATIONS.sql y luego final_setup.sql para recrear todo desde cero.';
END $$;





