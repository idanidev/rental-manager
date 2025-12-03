// Edge Function: check-expiring-contracts
// Cron: Diario a las 9:00 AM
// Propósito: Crear notificaciones para contratos próximos a vencer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Obtener todos los usuarios con alertas de contratos activas
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('user_id, contract_alert_days, enable_contract_alerts')
      .eq('enable_contract_alerts', true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with contract alerts enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let notificationsCreated = 0;

    // 2. Para cada usuario
    for (const setting of settings) {
      const userId = setting.user_id;
      const alertDays = setting.contract_alert_days || [7, 15, 30];

      // Obtener propiedades donde el usuario tiene acceso
      const { data: accessList, error: accessError } = await supabaseAdmin
        .from('property_access')
        .select('property_id')
        .eq('user_id', userId);

      if (accessError) {
        console.error(`Error getting access for user ${userId}:`, accessError);
        continue;
      }

      const propertyIds = accessList.map(a => a.property_id);
      if (propertyIds.length === 0) continue;

      // Obtener propiedades con habitaciones e inquilinos
      const { data: properties, error: propertiesError } = await supabaseAdmin
        .from('properties')
        .select(`
          id,
          name,
          rooms (
            id,
            name,
            tenant_id,
            tenants:tenant_id (
              id,
              full_name,
              contract_end_date,
              active
            )
          )
        `)
        .in('id', propertyIds);

      if (propertiesError) {
        console.error(`Error getting properties for user ${userId}:`, propertiesError);
        continue;
      }

      // 3. Para cada propiedad
      for (const property of properties || []) {
        if (!property.rooms) continue;

        for (const room of property.rooms) {
          const tenant = Array.isArray(room.tenants) ? room.tenants[0] : room.tenants;
          
          if (!tenant?.contract_end_date || !tenant.active) continue;

          const endDate = new Date(tenant.contract_end_date);
          endDate.setHours(0, 0, 0, 0);
          
          const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // 4. Si los días coinciden con algún valor en contract_alert_days
          if (daysUntilExpiry >= 0 && alertDays.includes(daysUntilExpiry)) {
            // Verificar si ya existe una notificación para este contrato en este día
            const { data: existing, error: checkError } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('property_id', property.id)
              .eq('type', 'contract_expiring')
              .eq('read', false)
              .gte('created_at', new Date(today).toISOString())
              .limit(1);

            if (checkError) {
              console.error('Error checking existing notification:', checkError);
              continue;
            }

            // Solo crear si no existe ya una notificación para hoy
            if (!existing || existing.length === 0) {
              const urgency = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low';
              
              const title = daysUntilExpiry === 0
                ? `⚠️ Contrato vence HOY: ${tenant.full_name}`
                : daysUntilExpiry === 1
                  ? `⏰ Contrato vence mañana: ${tenant.full_name}`
                  : `📅 Contrato vence en ${daysUntilExpiry} días: ${tenant.full_name}`;

              const message = `El contrato de ${tenant.full_name} en ${room.name} (${property.name}) vence ${daysUntilExpiry === 0 ? 'hoy' : daysUntilExpiry === 1 ? 'mañana' : `en ${daysUntilExpiry} días`}.`;

              const { error: insertError } = await supabaseAdmin
                .rpc('create_notification', {
                  p_user_id: userId,
                  p_type: 'contract_expiring',
                  p_title: title,
                  p_message: message,
                  p_property_id: property.id,
                  p_metadata: {
                    room_id: room.id,
                    room_name: room.name,
                    tenant_id: tenant.id,
                    tenant_name: tenant.full_name,
                    property_name: property.name,
                    days_remaining: daysUntilExpiry,
                    end_date: tenant.contract_end_date,
                    urgency
                  }
                });

              if (insertError) {
                console.error('Error creating notification:', insertError);
              } else {
                notificationsCreated++;
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsCreated,
        message: `Created ${notificationsCreated} notifications` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in check-expiring-contracts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

