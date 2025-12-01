-- =====================================================
-- FIX: EVITAR GENERACIÓN DUPLICADA DE INGRESOS
-- =====================================================
-- El problema: El trigger se ejecuta múltiples veces generando ingresos duplicados
-- Solución: Mejorar la lógica del trigger para evitar ejecuciones innecesarias
-- =====================================================

-- Desactivar el trigger actual temporalmente
DROP TRIGGER IF EXISTS generate_income_on_tenant_assignment ON rooms;

-- Mejorar la función del trigger para ser más estricta
CREATE OR REPLACE FUNCTION trigger_generate_income_on_tenant_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_generated_incomes INTEGER;
  v_existing_incomes INTEGER;
BEGIN
  -- Solo generar ingresos si:
  -- 1. Se está asignando un inquilino (NEW.tenant_id IS NOT NULL)
  -- 2. Es un cambio de NULL a un valor (OLD.tenant_id IS NULL)
  -- 3. La habitación está ocupada
  -- 4. NO hay ingresos ya generados para esta habitación (evitar duplicados)
  IF NEW.tenant_id IS NOT NULL 
     AND OLD.tenant_id IS NULL  -- Solo cuando se asigna por primera vez
     AND NEW.occupied = true THEN
    
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
        -- No fallar la actualización si la generación de ingresos falla
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

-- Recrear el trigger con la lógica mejorada
CREATE TRIGGER generate_income_on_tenant_assignment
  AFTER UPDATE OF tenant_id, occupied ON rooms
  FOR EACH ROW
  WHEN (
    -- Solo ejecutar cuando:
    -- 1. Se asigna un inquilino (de NULL a un valor)
    -- 2. La habitación está ocupada
    NEW.tenant_id IS NOT NULL 
    AND OLD.tenant_id IS NULL
    AND NEW.occupied = true
  )
  EXECUTE FUNCTION trigger_generate_income_on_tenant_assignment();

-- También mejorar la función de generación para ser más robusta
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
      v_contract_months := 6; -- Cambiado a 6 meses (nuevo default)
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
      -- Usar una verificación más estricta
      IF NOT EXISTS (
        SELECT 1 
        FROM income 
        WHERE room_id = p_room_id 
          AND month = v_month_start
          AND property_id = v_property_id
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

-- Comentarios actualizados
COMMENT ON FUNCTION trigger_generate_income_on_tenant_assignment IS 'Trigger mejorado que genera ingresos automáticamente solo cuando se asigna un inquilino por primera vez, evitando duplicados';
COMMENT ON FUNCTION generate_monthly_income_for_contract IS 'Genera automáticamente ingresos mensuales para un contrato de inquilino, evitando duplicados';


