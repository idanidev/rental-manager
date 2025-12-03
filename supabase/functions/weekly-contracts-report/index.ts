// Edge Function: weekly-contracts-report
// Cron: Cada lunes a las 9:00 AM
// Propósito: Crear resumen semanal de contratos próximos a vencer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // 1. Obtener usuarios con resumen semanal activo
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('notification_settings')
      .select('user_id, enable_weekly_report')
      .eq('enable_weekly_report', true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with weekly report enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    
    let reportsCreated = 0;

    // 2. Para cada usuario
    for (const setting of settings) {
      const userId = setting.user_id;

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

      // 3. Buscar contratos que vencen en los próximos 30 días
      const contractsExpiring = [];
      
      for (const property of properties || []) {
        if (!property.rooms) continue;

        const propertyContracts = [];

        for (const room of property.rooms) {
          const tenant = Array.isArray(room.tenants) ? room.tenants[0] : room.tenants;
          
          if (!tenant?.contract_end_date || !tenant.active) continue;

          const endDate = new Date(tenant.contract_end_date);
          endDate.setHours(0, 0, 0, 0);
          
          const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            propertyContracts.push({
              room_name: room.name,
              tenant_name: tenant.full_name,
              days_remaining: daysUntilExpiry,
              end_date: tenant.contract_end_date
            });
          }
        }

        if (propertyContracts.length > 0) {
          contractsExpiring.push({
            property_id: property.id,
            property_name: property.name,
            contracts: propertyContracts
          });
        }
      }

      // 4. Si hay contratos próximos a vencer, crear notificación de resumen
      if (contractsExpiring.length > 0) {
        const totalContracts = contractsExpiring.reduce((sum, p) => sum + p.contracts.length, 0);
        
        const title = `📊 Resumen Semanal: ${totalContracts} contrato${totalContracts === 1 ? '' : 's'} próximos a vencer`;
        
        let message = `Contratos que vencen en los próximos 30 días:\n\n`;
        contractsExpiring.forEach(prop => {
          message += `🏠 ${prop.property_name}:\n`;
          prop.contracts.forEach(contract => {
            message += `  • ${contract.tenant_name} (${contract.room_name}) - ${contract.days_remaining} días restantes\n`;
          });
          message += `\n`;
        });

        // Verificar si ya existe un resumen de esta semana
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Lunes de esta semana
        
        const { data: existing, error: checkError } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'weekly_report')
          .gte('created_at', weekStart.toISOString())
          .limit(1);

        if (checkError) {
          console.error('Error checking existing weekly report:', checkError);
          continue;
        }

        // Solo crear si no existe ya un resumen de esta semana
        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabaseAdmin
            .rpc('create_notification', {
              p_user_id: userId,
              p_type: 'weekly_report',
              p_title: title,
              p_message: message.trim(),
              p_property_id: null,
              p_metadata: {
                properties: contractsExpiring,
                total_contracts: totalContracts,
                week_start: weekStart.toISOString()
              }
            });

          if (insertError) {
            console.error('Error creating weekly report:', insertError);
          } else {
            reportsCreated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportsCreated,
        message: `Created ${reportsCreated} weekly reports` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in weekly-contracts-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

