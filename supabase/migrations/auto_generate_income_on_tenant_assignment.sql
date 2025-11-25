-- =====================================================
-- RENTAL MANAGER - AUTO-GENERAR INGRESOS AL ASIGNAR INQUILINO
-- Genera automáticamente los ingresos mensuales cuando se asigna un inquilino
-- =====================================================

-- Función auxiliar para generar ingresos mensuales para un contrato
CREATE OR REPLACE FUNCTION generate_monthly_income_for_contract(
  p_tenant_id UUID,
  p_room_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_contract_start_date DATE;
  v_contract_end_date DATE;
  v_contract_months INTEGER;
  v_monthly_rent DECIMAL(10, 2);
  v_property_id UUID;
  v_current_month DATE;
  v_income_count INTEGER := 0;
  v_month_start DATE;
BEGIN
  -- Obtener datos del inquilino y la habitación
  SELECT 
    t.contract_start_date,
    t.contract_end_date,
    t.contract_months,
    r.monthly_rent,
    r.property_id
  INTO 
    v_contract_start_date,
    v_contract_end_date,
    v_contract_months,
    v_monthly_rent,
    v_property_id
  FROM tenants t
  JOIN rooms r ON r.id = p_room_id
  WHERE t.id = p_tenant_id
    AND r.tenant_id = p_tenant_id; -- Asegurar que está asignado
  
  -- Si no hay datos, salir
  IF v_monthly_rent IS NULL OR v_property_id IS NULL THEN
    RAISE WARNING 'No se encontraron datos del inquilino o habitación';
    RETURN 0;
  END IF;
  
  -- Determinar fecha de inicio (si no existe, usar hoy)
  IF v_contract_start_date IS NULL THEN
    v_contract_start_date := CURRENT_DATE;
  END IF;
  
  -- Determinar fecha de fin
  IF v_contract_end_date IS NULL THEN
    IF v_contract_months IS NULL THEN
      v_contract_months := 12; -- Por defecto 12 meses
    END IF;
    v_contract_end_date := (v_contract_start_date + (v_contract_months || ' months')::INTERVAL)::DATE;
  END IF;
  
  -- Asegurar que la fecha de fin sea válida
  IF v_contract_end_date < v_contract_start_date THEN
    RAISE WARNING 'La fecha de fin del contrato es anterior a la de inicio';
    RETURN 0;
  END IF;
  
  -- Iniciar desde el primer día del mes de inicio
  v_month_start := date_trunc('month', v_contract_start_date)::DATE;
  
  -- Iterar por cada mes del contrato
  WHILE v_month_start <= v_contract_end_date LOOP
    -- Solo crear ingresos para meses futuros o del mes actual (no pasados)
    IF v_month_start >= date_trunc('month', CURRENT_DATE)::DATE THEN
      -- Verificar si ya existe un ingreso para este mes y habitación
      IF NOT EXISTS (
        SELECT 1 
        FROM income 
        WHERE room_id = p_room_id 
          AND month = v_month_start
      ) THEN
        -- Insertar ingreso mensual
        INSERT INTO income (
          property_id,
          room_id,
          amount,
          month,
          paid,
          notes
        ) VALUES (
          v_property_id,
          p_room_id,
          v_monthly_rent,
          v_month_start,
          false,
          'Generado automáticamente al asignar inquilino'
        );
        
        v_income_count := v_income_count + 1;
      END IF;
    END IF;
    
    -- Avanzar al siguiente mes
    v_month_start := (v_month_start + '1 month'::INTERVAL)::DATE;
  END LOOP;
  
  RETURN v_income_count;
END;
$$ LANGUAGE plpgsql;

-- Modificar la función assign_tenant_to_room
-- El trigger se encargará de generar los ingresos automáticamente
CREATE OR REPLACE FUNCTION assign_tenant_to_room(
  p_tenant_id UUID,
  p_room_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_property_id UUID;
  v_tenant_property_id UUID;
BEGIN
  -- Verificar que la habitación y el inquilino son de la misma propiedad
  SELECT property_id INTO v_property_id FROM rooms WHERE id = p_room_id;
  SELECT property_id INTO v_tenant_property_id FROM tenants WHERE id = p_tenant_id;
  
  IF v_property_id != v_tenant_property_id THEN
    RAISE EXCEPTION 'El inquilino y la habitación deben ser de la misma propiedad';
  END IF;
  
  -- Verificar que la habitación no es sala común
  IF EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id AND room_type = 'common') THEN
    RAISE EXCEPTION 'No se puede asignar inquilinos a salas comunes';
  END IF;
  
  -- Asignar inquilino a habitación
  -- El trigger generate_income_on_tenant_assignment se ejecutará automáticamente
  -- y generará los ingresos mensuales
  UPDATE rooms 
  SET tenant_id = p_tenant_id, 
      occupied = true
  WHERE id = p_room_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar ingresos automáticamente cuando se asigna un inquilino
CREATE OR REPLACE FUNCTION trigger_generate_income_on_tenant_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_generated_incomes INTEGER;
BEGIN
  -- Solo generar ingresos si:
  -- 1. Se está asignando un inquilino (NEW.tenant_id IS NOT NULL)
  -- 2. Es un cambio de NULL a un valor (OLD.tenant_id IS NULL O OLD.tenant_id != NEW.tenant_id)
  -- 3. No estaba ocupada antes o se está cambiando de inquilino
  IF NEW.tenant_id IS NOT NULL 
     AND (OLD.tenant_id IS NULL OR OLD.tenant_id != NEW.tenant_id)
     AND NEW.occupied = true THEN
    
    -- Generar ingresos mensuales automáticamente
    BEGIN
      v_generated_incomes := generate_monthly_income_for_contract(NEW.tenant_id, NEW.id);
      
      -- Log opcional
      IF v_generated_incomes > 0 THEN
        RAISE NOTICE 'Se generaron % ingresos mensuales para la habitación %', v_generated_incomes, NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- No fallar la actualización si la generación de ingresos falla
      -- Solo registrar el error
      RAISE WARNING 'Error al generar ingresos automáticos para habitación %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger AFTER UPDATE en la tabla rooms
DROP TRIGGER IF EXISTS generate_income_on_tenant_assignment ON rooms;
CREATE TRIGGER generate_income_on_tenant_assignment
  AFTER UPDATE OF tenant_id, occupied ON rooms
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NOT NULL AND (OLD.tenant_id IS NULL OR OLD.tenant_id != NEW.tenant_id))
  EXECUTE FUNCTION trigger_generate_income_on_tenant_assignment();

-- Comentarios
COMMENT ON FUNCTION generate_monthly_income_for_contract IS 'Genera automáticamente ingresos mensuales para un contrato de inquilino';
COMMENT ON FUNCTION assign_tenant_to_room IS 'Asigna un inquilino a una habitación y genera automáticamente los ingresos mensuales del contrato';
COMMENT ON FUNCTION trigger_generate_income_on_tenant_assignment IS 'Trigger que genera ingresos automáticamente cuando se asigna un inquilino a una habitación';

