import { supabase } from './supabase';

export async function diagnosticSupabase() {
  console.log('🔍 Diagnóstico de Supabase...\n');
  
  try {
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('1️⃣ Usuario autenticado:', user ? `✅ ${user.email}` : '❌ No autenticado', authError);
    
    if (!user) return;
    
    // 2. Verificar tabla properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    console.log('2️⃣ Tabla properties:', propError ? `❌ ${propError.message}` : '✅ Accesible');
    
    // 3. Verificar tabla property_access
    const { data: access, error: accessError } = await supabase
      .from('property_access')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('3️⃣ Property access:', accessError ? `❌ ${accessError.message}` : `✅ ${access?.length || 0} accesos`);
    if (access && access.length > 0) {
      console.log('   Accesos:', access);
    }
    
    // 4. Intentar crear una propiedad de prueba
    console.log('\n4️⃣ Intentando crear propiedad de prueba...');
    const { data: testProp, error: createError } = await supabase
      .from('properties')
      .insert({
        name: 'TEST - Borrar',
        address: 'Test 123',
        owner_id: user.id
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error al crear propiedad:', createError.message);
    } else {
      console.log('✅ Propiedad creada:', testProp.id);
      
      // 5. Intentar crear acceso
      console.log('\n5️⃣ Intentando crear acceso...');
      const { error: accessInsertError } = await supabase
        .from('property_access')
        .insert({
          property_id: testProp.id,
          user_id: user.id,
          role: 'owner'
        });
      
      if (accessInsertError) {
        console.log('❌ Error al crear acceso:', accessInsertError.message);
      } else {
        console.log('✅ Acceso creado correctamente');
      }
      
      // Borrar la propiedad de prueba
      await supabase.from('properties').delete().eq('id', testProp.id);
      console.log('🗑️ Propiedad de prueba eliminada');
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
  }
}

