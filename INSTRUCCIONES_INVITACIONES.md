# Instrucciones para Corregir el Sistema de Invitaciones

## Problema
El sistema de invitaciones no funciona correctamente debido a problemas con las políticas RLS y la función `grant_property_access`.

## Solución

### Paso 1: Ejecutar las migraciones SQL

Ejecuta estas dos migraciones en el SQL Editor de Supabase (en este orden):

1. **`supabase/migrations/fix_invitations_policies.sql`**
   - Corrige las políticas RLS de la tabla `invitations`
   - Permite que los owners vean y creen invitaciones
   - Permite que los usuarios vean sus propias invitaciones

2. **`supabase/migrations/fix_grant_property_access.sql`**
   - Corrige la función `grant_property_access`
   - Permite que los owners den acceso a otros usuarios
   - Permite que los usuarios acepten sus propias invitaciones
   - Verifica correctamente si el usuario es owner (tanto en `properties.owner_id` como en `property_access`)

### Paso 2: Verificar que las funciones RPC existen

Asegúrate de que estas funciones RPC existen en tu base de datos:

- `get_user_by_email(TEXT)` - Para buscar usuarios por email
- `grant_property_access(UUID, UUID, TEXT)` - Para dar acceso a propiedades
- `revoke_property_access(UUID, UUID)` - Para revocar acceso
- `get_property_users(UUID)` - Para obtener usuarios con acceso

Si no existen, ejecuta también `supabase/migrations/final_setup.sql`.

### Paso 3: Verificar permisos

Asegúrate de que:
- El usuario que intenta invitar es **owner** de la propiedad (verificado en `properties.owner_id` o `property_access.role = 'owner'`)
- Las políticas RLS están habilitadas en la tabla `invitations`

### Paso 4: Probar la funcionalidad

1. Abre una propiedad donde seas owner
2. Ve a la sección "Usuarios con Acceso"
3. Haz clic en "Invitar Usuario"
4. Ingresa un email y selecciona un rol
5. Haz clic en "Enviar Invitación"

### Errores Comunes

- **"No tienes permisos para invitar usuarios"**: El usuario no es owner de la propiedad
- **"Ya existe una invitación pendiente"**: Ya hay una invitación activa para ese email
- **"Error al crear invitación"**: Revisa la consola del navegador para más detalles

## Notas

- Las invitaciones expiran después de 30 días
- Si el usuario ya tiene cuenta, se le da acceso directo
- Si el usuario no tiene cuenta, se crea una invitación pendiente que se procesará cuando se registre







