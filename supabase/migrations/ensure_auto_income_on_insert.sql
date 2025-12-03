-- =====================================================
-- ASEGURAR GENERACIÓN AUTOMÁTICA DE INGRESOS EN INSERT
-- =====================================================
-- Modifica el trigger para que también funcione cuando se crea
-- una habitación nueva con un inquilino asignado desde el inicio
-- =====================================================

-- Mejorar la función del trigger para soportar INSERT y UPDATE
CREATE OR REPLACE FUNCTION trigger_generate_income_on_tenant_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_generated_incomes INTEGER;
  v_existing_incomes INTEGER;
BEGIN
  -- Solo generar ingresos si:
  -- 1. Se está asignando un inquilino (NEW.tenant_id IS NOT NULL)
  -- 2. La habitación está ocupada
  -- 3. Es un INSERT (nueva habitación) O un UPDATE donde se asigna por primera vez
  IF NEW.tenant_id IS NOT NULL 
     AND NEW.occupied = true 
     AND (
       -- Caso INSERT: nueva habitación con inquilino
       TG_OP = 'INSERT'
       OR
       -- Caso UPDATE: se asigna inquilino por primera vez (de NULL a un valor)
       (TG_OP = 'UPDATE' AND (OLD.tenant_id IS NULL OR OLD.tenant_id != NEW.tenant_id))
     ) THEN
    
    -- Verificar si ya existen ingresos para esta habitación
    SELECT COUNT(*) INTO v_existing_incomes
    FROM income
    WHERE room_id = NEW.id
      AND notes = 'Generado automáticamente al asignar inquilino';
    
    -- Solo generar si NO hay ingresos existentes
    IF v_existing_incomes = 0 THEN
      -- Generar ingresos mensuales automáticamente
      BEGIN
        v_generated_incomes := generate_monthly_income_for_contract(NEW.tenant_id, NEW.id);
        
        -- Log opcional
        IF v_generated_incomes > 0 THEN
          RAISE NOTICE 'Se generaron % ingresos mensuales para la habitación %', v_generated_incomes, NEW.id;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- No fallar la inserción/actualización si la generación de ingresos falla
        -- Solo registrar el error
        RAISE WARNING 'Error al generar ingresos automáticos para habitación %: %', NEW.id, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Ingresos ya existen para la habitación %, omitiendo generación', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger anterior
DROP TRIGGER IF EXISTS generate_income_on_tenant_assignment ON rooms;

-- Crear trigger que funcione tanto en INSERT como en UPDATE
CREATE TRIGGER generate_income_on_tenant_assignment
  AFTER INSERT OR UPDATE OF tenant_id, occupied ON rooms
  FOR EACH ROW
  WHEN (
    -- Solo ejecutar cuando:
    -- 1. Se asigna un inquilino
    -- 2. La habitación está ocupada
    NEW.tenant_id IS NOT NULL 
    AND NEW.occupied = true
  )
  EXECUTE FUNCTION trigger_generate_income_on_tenant_assignment();

-- Comentarios actualizados
COMMENT ON FUNCTION trigger_generate_income_on_tenant_assignment IS 'Trigger que genera ingresos automáticamente cuando se crea o actualiza una habitación con inquilino asignado';
COMMENT ON TRIGGER generate_income_on_tenant_assignment ON rooms IS 'Genera ingresos automáticamente al crear o asignar inquilino a habitación';

