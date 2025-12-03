# Sistema de Notificaciones por Email - Contratos por Vencer

## 📋 Resumen

Este sistema envía automáticamente emails a propietarios y editores cuando un contrato está por vencer (30 días antes por defecto).

## ✅ Cambios Implementados

### 1. Duración Predeterminada del Contrato
- **Cambiado de 12 a 6 meses** en:
  - `TenantForm.svelte` - Formulario de creación/edición de inquilinos
  - `GenerateContractModal.svelte` - Generación de contratos
  - Base de datos: valor por defecto en la tabla `tenants`

### 2. Sistema de Notificaciones
- **Tabla `contract_notifications`**: Registra las notificaciones enviadas para evitar duplicados
- **Función `get_contracts_needing_notification()`**: Obtiene contratos que necesitan notificación
- **Función `record_contract_notification()`**: Registra que se envió una notificación

## 🚀 Implementación del Envío de Emails

### Opción 1: Supabase Edge Function (Recomendado)

1. **Crear Edge Function en Supabase:**

```typescript
// supabase/functions/send-contract-notifications/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener contratos que necesitan notificación (30 días antes)
    const { data: contracts, error } = await supabase
      .rpc('get_contracts_needing_notification', { days_before: 30 })

    if (error) throw error

    const results = []

    for (const contract of contracts || []) {
      // Combinar emails de propietarios y editores
      const recipients = [...contract.owner_emails, ...contract.editor_emails]
      
      if (recipients.length === 0) continue

      // Enviar email usando Resend (o tu servicio de email preferido)
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Rental Manager <noreply@tudominio.com>',
          to: recipients,
          subject: `⚠️ Contrato por vencer: ${contract.tenant_name} - ${contract.property_name}`,
          html: `
            <h2>Contrato por Vencer</h2>
            <p>El contrato del inquilino <strong>${contract.tenant_name}</strong> está por vencer.</p>
            <ul>
              <li><strong>Propiedad:</strong> ${contract.property_name}</li>
              <li><strong>Dirección:</strong> ${contract.property_address}</li>
              <li><strong>Fecha de vencimiento:</strong> ${new Date(contract.contract_end_date).toLocaleDateString('es-ES')}</li>
              <li><strong>Días restantes:</strong> ${contract.days_until_expiry} días</li>
            </ul>
            <p>Por favor, contacta con el inquilino para renovar o finalizar el contrato.</p>
          `,
        }),
      })

      if (emailResponse.ok) {
        // Registrar que se envió la notificación
        await supabase.rpc('record_contract_notification', {
          p_tenant_id: contract.tenant_id,
          p_property_id: contract.property_id,
          p_days_until_expiry: contract.days_until_expiry,
          p_sent_to_emails: recipients,
        })

        results.push({ success: true, tenant: contract.tenant_name })
      } else {
        results.push({ success: false, tenant: contract.tenant_name, error: await emailResponse.text() })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notificaciones procesadas',
        results,
        total: contracts?.length || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

2. **Configurar variables de entorno en Supabase:**
   - `RESEND_API_KEY`: Tu API key de Resend (o el servicio que uses)
   - `SUPABASE_URL`: URL de tu proyecto
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (solo para Edge Functions)

3. **Configurar Cron Job en Supabase:**
   - Ve a Database → Cron Jobs
   - Crea un nuevo cron job que ejecute la función diariamente:
   ```sql
   SELECT net.http_post(
     url := 'https://TU_PROYECTO.supabase.co/functions/v1/send-contract-notifications',
     headers := '{"Authorization": "Bearer TU_ANON_KEY"}'::jsonb
   );
   ```
   - Configura para ejecutarse diariamente a las 9:00 AM

### Opción 2: Servicio Externo (Vercel Cron, GitHub Actions, etc.)

Puedes crear un endpoint en tu aplicación SvelteKit o usar un servicio externo que:

1. Llame a `get_contracts_needing_notification()` diariamente
2. Envíe los emails usando tu servicio preferido (SendGrid, Resend, AWS SES, etc.)
3. Registre las notificaciones con `record_contract_notification()`

## 📝 Migraciones a Ejecutar

Ejecuta estas migraciones en el SQL Editor de Supabase:

1. `change_default_contract_months_to_6.sql` - Cambia la duración predeterminada
2. `contract_expiry_email_notifications.sql` - Crea el sistema de notificaciones

## 🔧 Configuración

### Personalizar días de anticipación

Puedes cambiar cuántos días antes se envía la notificación modificando el parámetro en la función:

```sql
SELECT * FROM get_contracts_needing_notification(30); -- 30 días antes
SELECT * FROM get_contracts_needing_notification(7);  -- 7 días antes
```

### Notificaciones múltiples

El sistema está diseñado para enviar notificaciones en diferentes momentos:
- 30 días antes
- 7 días antes
- El día del vencimiento

Solo necesitas llamar a la función con diferentes valores de `days_before`.

## 📧 Servicios de Email Recomendados

- **Resend**: Fácil de usar, buen free tier
- **SendGrid**: Robusto, ampliamente usado
- **AWS SES**: Económico para grandes volúmenes
- **Postmark**: Excelente para transaccionales

## 🔒 Seguridad

- Las funciones usan `SECURITY DEFINER` para acceder a `auth.users`
- Las políticas RLS protegen los datos de notificaciones
- Solo se envían emails a usuarios con acceso a la propiedad

## 📊 Monitoreo

Puedes consultar las notificaciones enviadas:

```sql
SELECT 
  cn.*,
  t.full_name as tenant_name,
  p.name as property_name
FROM contract_notifications cn
JOIN tenants t ON t.id = cn.tenant_id
JOIN properties p ON p.id = cn.property_id
ORDER BY cn.created_at DESC;
```




