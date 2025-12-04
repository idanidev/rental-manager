# 📝 Cómo Aplicar la Migración de Notificaciones

## ❌ Error Corregido

**Error original**: `ERROR: 42P13: input parameters after one with a default value must also have defaults`

**Solución**: Reordenados los parámetros de la función `create_notification` para que los opcionales vayan al final.

## ✅ Aplicar Migración (Sin CLI de Supabase)

Si no tienes la CLI de Supabase instalada, puedes aplicar la migración manualmente:

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Abre Supabase Dashboard**: https://app.supabase.com
2. Ve a tu proyecto
3. **Database** → **SQL Editor**
4. Abre el archivo `supabase/migrations/create_notifications_system.sql`
5. Copia TODO el contenido
6. Pégalo en el SQL Editor
7. Haz click en **Run** (o presiona `Cmd/Ctrl + Enter`)

### Opción 2: Instalar CLI de Supabase (Opcional)

Si quieres usar la CLI para futuras migraciones:

```bash
# macOS (usando Homebrew)
brew install supabase/tap/supabase

# O usando npm
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular proyecto local
supabase link --project-ref YOUR_PROJECT_REF

# Aplicar migración
supabase db push
```

## 🔍 Verificar que Funcionó

Después de aplicar la migración, verifica:

1. **Tablas creadas**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('notifications', 'notification_settings');
   ```

2. **Funciones creadas**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name IN ('create_notification', 'get_unread_notifications_count');
   ```

3. **Índices creados**:
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename IN ('notifications', 'notification_settings');
   ```

## ⚠️ Si el Error Persiste

Si aún ves el error después de aplicar la migración:

1. **Verifica que no exista la función anterior**:
   ```sql
   DROP FUNCTION IF EXISTS create_notification(UUID, UUID, TEXT, TEXT, TEXT, JSONB);
   ```

2. **Aplica la migración nuevamente**

3. **O crea la función manualmente** con el orden correcto:
   ```sql
   CREATE OR REPLACE FUNCTION create_notification(
     p_user_id UUID,
     p_type TEXT,
     p_title TEXT,
     p_message TEXT,
     p_property_id UUID DEFAULT NULL,
     p_metadata JSONB DEFAULT '{}'::jsonb
   )
   RETURNS UUID AS $$
   DECLARE
     v_notification_id UUID;
   BEGIN
     INSERT INTO notifications (
       user_id,
       property_id,
       type,
       title,
       message,
       metadata
     )
     VALUES (
       p_user_id,
       p_property_id,
       p_type,
       p_title,
       p_message,
       p_metadata
     )
     RETURNING id INTO v_notification_id;
     
     RETURN v_notification_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

## ✅ Migración Aplicada Correctamente

Una vez aplicada la migración, deberías ver:
- ✅ Tabla `notifications` creada
- ✅ Tabla `notification_settings` creada
- ✅ Función `create_notification()` funcionando
- ✅ Función `get_unread_notifications_count()` funcionando
- ✅ Índices creados
- ✅ RLS Policies activas

¡Listo! El sistema de notificaciones está completamente funcional. 🎉


