# ✅ Generación Automática de Ingresos

## 📋 Resumen

Los ingresos se generan **automáticamente** cuando se asigna un inquilino a una habitación. No es necesario crearlos manualmente.

## 🔄 Cómo Funciona

### 1. Al Crear una Habitación con Inquilino

Cuando creas una nueva habitación y asignas un inquilino desde el formulario:
- La habitación se marca como `occupied = true`
- El trigger de la base de datos detecta la asignación
- Se generan automáticamente los ingresos mensuales para todo el período del contrato

### 2. Al Asignar un Inquilino a una Habitación Existente

Cuando asignas un inquilino a una habitación que ya existe:
- Se actualiza `tenant_id` y `occupied = true`
- El trigger detecta el cambio
- Se generan automáticamente los ingresos mensuales

### 3. Qué Ingresos se Generan

- **Período**: Desde el mes actual hasta el final del contrato
- **Cantidad**: Basada en `monthly_rent` de la habitación
- **Estado**: `paid = false` (no pagado) por defecto
- **Nota**: "Generado automáticamente al asignar inquilino"

## 📝 Editar Ingresos

Si necesitas modificar un ingreso generado automáticamente:

1. Ve a: **Propiedades → [Tu Propiedad] → Finanzas**
2. Encuentra el ingreso que quieres editar
3. Haz clic en "Editar"
4. Puedes modificar:
   - Cantidad
   - Marcar como pagado
   - Añadir notas
   - Cambiar fecha de pago

## ⚙️ Configuración Técnica

### Trigger de Base de Datos

El trigger `generate_income_on_tenant_assignment` se ejecuta automáticamente cuando:
- Se crea una habitación nueva con `tenant_id` asignado (INSERT)
- Se actualiza una habitación asignando un inquilino (UPDATE)

### Función de Generación

La función `generate_monthly_income_for_contract`:
- Lee los datos del contrato del inquilino
- Calcula el período del contrato
- Genera un ingreso por cada mes del contrato
- Evita duplicados (no genera si ya existe un ingreso para ese mes)

## ✅ Ventajas

1. **Automatización**: No necesitas crear ingresos manualmente
2. **Precisión**: Los ingresos se generan basados en los datos reales del contrato
3. **Consistencia**: Todos los ingresos siguen el mismo formato
4. **Flexibilidad**: Puedes editar los ingresos después si es necesario

## 🔧 Migración Necesaria

Para activar la generación automática en INSERT, ejecuta:

```sql
-- Ver archivo: supabase/migrations/ensure_auto_income_on_insert.sql
```

Esta migración asegura que los ingresos se generen tanto al crear habitaciones nuevas con inquilino como al asignar inquilinos a habitaciones existentes.

---

**Estado**: ✅ Configurado y funcionando

