# 🔔 Sistema de Notificaciones - Rental Manager

## 📋 Resumen

Sistema completo de notificaciones in-app con:
- ✅ Notificaciones en tiempo real (Supabase Realtime)
- ✅ Alertas de contratos próximos a vencer (configurable)
- ✅ Resumen semanal de contratos
- ✅ Configuración personalizada por usuario
- ✅ UI moderna con estilo Liquid Glass

---

## 🗄️ Base de Datos

### Migración Creada

**Archivo**: `supabase/migrations/create_notifications_system.sql`

**Tablas creadas**:
1. `notifications` - Almacena todas las notificaciones
2. `notification_settings` - Configuración por usuario

**Funciones SQL**:
- `create_notification()` - Helper para crear notificaciones
- `get_unread_notifications_count()` - Contador de no leídas
- `create_default_notification_settings()` - Trigger para crear settings automáticamente

### Aplicar Migración

```bash
# Opción 1: Desde Supabase Dashboard
# Ve a Database > Migrations y ejecuta create_notifications_system.sql

# Opción 2: Desde CLI
supabase db push
```

---

## ⚡ Edge Functions (Crons)

### 1. check-expiring-contracts

**Propósito**: Crear notificaciones diarias para contratos próximos a vencer

**Ubicación**: `supabase/functions/check-expiring-contracts/index.ts`

**Configurar Cron en Supabase**:

1. Ve a **Database > Cron Jobs** en Supabase Dashboard
2. Crea un nuevo cron job:
   - **Name**: `check-expiring-contracts`
   - **Schedule**: `0 9 * * *` (cada día a las 9:00 AM)
   - **Function**: `check-expiring-contracts`
   - **Method**: `POST`

**O desde SQL**:

```sql
SELECT cron.schedule(
  'check-expiring-contracts',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-expiring-contracts',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### 2. weekly-contracts-report

**Propósito**: Crear resumen semanal cada lunes

**Ubicación**: `supabase/functions/weekly-contracts-report/index.ts`

**Configurar Cron**:

- **Schedule**: `0 9 * * 1` (cada lunes a las 9:00 AM)

**SQL**:

```sql
SELECT cron.schedule(
  'weekly-contracts-report',
  '0 9 * * 1',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/weekly-contracts-report',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### Desplegar Edge Functions

```bash
# Desde el directorio del proyecto
supabase functions deploy check-expiring-contracts
supabase functions deploy weekly-contracts-report
```

---

## 🎨 Componentes UI

### 1. NotificationBell.svelte
- Badge con contador de no leídas
- Indicador de urgencia (rojo si hay urgentes)
- Abre NotificationPanel al hacer click

### 2. NotificationPanel.svelte
- Panel desplegable estilo glassmorphism
- Tabs: "Todas" | "No leídas"
- Botón "Marcar todas como leídas"
- Link a historial y configuración

### 3. NotificationItem.svelte
- Icono según tipo de notificación
- Colores según urgencia
- Timestamp relativo ("hace 2 horas")
- Acciones: marcar leída, eliminar
- Click navega a la propiedad

### 4. NotificationSettings.svelte
- Configuración de días de anticipación (7, 15, 30, 60)
- Toggles para cada tipo de notificación
- Guardado automático

---

## 🔄 Flujo de Notificaciones

### 1. Generación Automática

```
Edge Function (Cron) 
  ↓
Crea notificación en DB
  ↓
Supabase Realtime detecta INSERT
  ↓
Cliente recibe evento
  ↓
Store actualiza automáticamente
  ↓
UI actualiza badge y lista
```

### 2. Realtime Subscription

El store `notificationsStore` se suscribe automáticamente a:
- `INSERT` - Nueva notificación
- `UPDATE` - Notificación actualizada (marcada como leída)
- `DELETE` - Notificación eliminada

---

## 📱 Rutas

- `/notifications` - Historial completo de notificaciones
- `/notifications/settings` - Configuración de notificaciones

---

## 🎯 Tipos de Notificaciones

| Tipo | Descripción | Cuándo se crea |
|------|-------------|----------------|
| `contract_expiring` | Contrato próximo a vencer | Diario (según días configurados) |
| `contract_expired` | Contrato vencido | Manual o automático |
| `weekly_report` | Resumen semanal | Cada lunes a las 9:00 AM |
| `invitation` | Invitación a propiedad | Al crear invitación |
| `expense` | Nuevo gasto | Al crear gasto (si está activo) |
| `income` | Nuevo ingreso | Al crear ingreso (si está activo) |
| `room_change` | Cambio en habitación | Al cambiar estado (si está activo) |

---

## 🔧 Configuración por Usuario

Cada usuario puede configurar:

1. **Días de anticipación**: 7, 15, 30, 60 días
2. **Activar/desactivar** cada tipo de notificación
3. **Resumen semanal**: Sí/No

**Valores por defecto**:
- Alertas de contratos: ✅ Activado (7, 15, 30 días)
- Resumen semanal: ✅ Activado
- Invitaciones: ✅ Activado
- Gastos: ✅ Activado
- Ingresos: ❌ Desactivado
- Cambios en habitaciones: ❌ Desactivado

---

## 🚀 Próximos Pasos

### Fase 2 (Opcional)

1. **Notificaciones de invitaciones** (Trigger)
   - Crear trigger en `property_invitations` para crear notificación automáticamente

2. **Notificaciones de gastos/ingresos**
   - Crear triggers en `expenses` e `income`

3. **Web Push API** (Android/Desktop)
   - Implementar notificaciones push cuando la app está cerrada

4. **Notificaciones de cambios en habitaciones**
   - Trigger en `rooms` cuando cambia `occupied` o `tenant_id`

---

## 📝 Notas Importantes

1. **RLS Policies**: Las notificaciones solo son visibles para el usuario propietario
2. **Service Role**: Las Edge Functions usan service role para crear notificaciones
3. **Realtime**: Requiere que Supabase Realtime esté habilitado
4. **Crons**: Requieren extensión `pg_cron` en Supabase

---

## ✅ Checklist de Implementación

- [x] Migración de base de datos
- [x] Store de notificaciones con Realtime
- [x] Servicio de notificaciones
- [x] NotificationBell mejorado
- [x] NotificationPanel
- [x] NotificationItem
- [x] NotificationSettings
- [x] Edge Functions (check-expiring-contracts, weekly-report)
- [ ] Configurar crons en Supabase Dashboard
- [ ] Desplegar Edge Functions
- [ ] Probar notificaciones en tiempo real
- [ ] Crear triggers para invitaciones (opcional)

---

## 🐛 Troubleshooting

### "No se reciben notificaciones en tiempo real"
- Verificar que Realtime esté habilitado en Supabase
- Verificar que el store se inicialice correctamente en `+layout.svelte`

### "Las Edge Functions no se ejecutan"
- Verificar que los crons estén configurados correctamente
- Verificar logs en Supabase Dashboard > Edge Functions > Logs

### "Error al crear notificación desde Edge Function"
- Verificar que la función `create_notification` exista en la base de datos
- Verificar que se use `SUPABASE_SERVICE_ROLE_KEY` (no anon key)

---

**¡Sistema de notificaciones listo para usar! 🎉**


