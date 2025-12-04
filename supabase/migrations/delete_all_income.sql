-- =====================================================
-- SCRIPT PARA ELIMINAR TODOS LOS INGRESOS
-- =====================================================
-- ⚠️ ADVERTENCIA: Este script elimina TODOS los ingresos de la base de datos
-- Ejecuta este script en el SQL Editor de Supabase
-- =====================================================

-- Ver cuántos ingresos hay antes de borrar
SELECT COUNT(*) as total_income_before FROM income;

-- Eliminar todos los ingresos
DELETE FROM income;

-- Verificar que se eliminaron todos
SELECT COUNT(*) as total_income_after FROM income;

-- =====================================================
-- OPCIONAL: Si quieres borrar solo los ingresos de una propiedad específica
-- Descomenta y reemplaza 'TU_PROPERTY_ID' con el ID real:
-- =====================================================
-- DELETE FROM income WHERE property_id = 'TU_PROPERTY_ID';

-- =====================================================
-- OPCIONAL: Si quieres borrar solo los ingresos de una habitación específica
-- Descomenta y reemplaza 'TU_ROOM_ID' con el ID real:
-- =====================================================
-- DELETE FROM income WHERE room_id = 'TU_ROOM_ID';





