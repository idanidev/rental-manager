<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Home, UserPlus, CheckCircle, XCircle, AlertCircle } from 'lucide-svelte';
  import { permissionsService } from '$lib/services/permissions';
  import { userStore } from '$lib/stores/user';
  import { authService } from '$lib/services/auth';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  let loading = true;
  let invitation = null;
  let error = '';
  let success = false;
  let processing = false;
  
  $: token = $page.url.searchParams.get('token');
  
  onMount(async () => {
    if (!token) {
      error = 'Token de invitación no válido';
      loading = false;
      return;
    }
    
    await loadInvitation();
  });
  
  async function loadInvitation() {
    loading = true;
    error = '';
    
    try {
      invitation = await permissionsService.getInvitation(token);
    } catch (err) {
      error = err.message || 'Invitación no encontrada o expirada';
    } finally {
      loading = false;
    }
  }
  
  async function handleAccept() {
    if (!$userStore) {
      // Usuario no autenticado, redirigir al login
      goto(`/login?redirect=/accept-invitation?token=${token}`);
      return;
    }
    
    processing = true;
    error = '';
    
    try {
      await permissionsService.acceptInvitation(token, $userStore.id);
      success = true;
      setTimeout(() => {
        goto('/');
      }, 2000);
    } catch (err) {
      error = err.message || 'Error al aceptar la invitación';
    } finally {
      processing = false;
    }
  }
  
  async function handleDecline() {
    goto('/');
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4">
  <GlassCard className="max-w-lg w-full">
    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Verificando invitación...</p>
      </div>
    {:else if error}
      <div class="text-center py-12 space-y-4">
        <div class="p-4 bg-red-100 rounded-full inline-block">
          <XCircle size={48} class="text-red-600" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800">Invitación Inválida</h2>
        <p class="text-gray-600">{error}</p>
        <div class="pt-4">
          <Button on:click={() => goto('/')}>
            Ir al Dashboard
          </Button>
        </div>
      </div>
    {:else if success}
      <div class="text-center py-12 space-y-4">
        <div class="p-4 bg-green-100 rounded-full inline-block">
          <CheckCircle size={48} class="text-green-600" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800">¡Invitación Aceptada!</h2>
        <p class="text-gray-600">
          Ahora tienes acceso a la propiedad <strong>{invitation.property.name}</strong>
        </p>
        <p class="text-sm text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    {:else if invitation}
      <div class="space-y-6">
        <!-- Header -->
        <div class="text-center">
          <div class="p-4 gradient-primary rounded-full inline-block mb-4">
            <UserPlus size={48} class="text-white" />
          </div>
          <h1 class="text-3xl font-bold gradient-text mb-2">
            Invitación a Propiedad
          </h1>
          <p class="text-gray-600">
            Has sido invitado a colaborar en una propiedad
          </p>
        </div>

        <!-- Información de la invitación -->
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
          <div>
            <p class="text-sm text-gray-600 mb-1">Propiedad</p>
            <div class="flex items-center gap-2">
              <Home size={20} class="text-orange-600" />
              <div>
                <p class="font-bold text-gray-800">{invitation.property.name}</p>
                <p class="text-sm text-gray-600">{invitation.property.address}</p>
              </div>
            </div>
          </div>

          <div class="border-t border-orange-200 pt-4">
            <p class="text-sm text-gray-600 mb-2">Tu rol de acceso</p>
            <span class="inline-block px-4 py-2 rounded-lg font-semibold
              {invitation.role === 'owner' ? 'bg-orange-600 text-white' : 
               invitation.role === 'editor' ? 'bg-blue-600 text-white' : 
               'bg-gray-600 text-white'}">
              {invitation.role === 'owner' ? '👑 Propietario - Control Total' : 
               invitation.role === 'editor' ? '✏️ Editor - Ver y Editar' : 
               '👁️ Visor - Solo Ver'}
            </span>
          </div>

          <div class="border-t border-orange-200 pt-4">
            <p class="text-sm text-gray-600 mb-1">Invitado por</p>
            <p class="font-medium text-gray-800">{invitation.inviter?.email || 'Usuario'}</p>
          </div>
        </div>

        <!-- Información del usuario actual -->
        {#if !$userStore}
          <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={20} class="flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <strong>Inicia sesión para continuar</strong><br/>
              Necesitas iniciar sesión o crear una cuenta para aceptar esta invitación.
            </div>
          </div>
        {:else}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl flex items-start gap-2">
            <CheckCircle size={20} class="flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <strong>Sesión iniciada como:</strong><br/>
              {$userStore.email}
            </div>
          </div>
        {/if}

        <!-- Botones de acción -->
        <div class="flex gap-3 pt-4">
          <Button 
            variant="secondary" 
            className="flex-1"
            on:click={handleDecline}
            disabled={processing}
          >
            Rechazar
          </Button>
          <Button 
            className="flex-1"
            on:click={handleAccept}
            disabled={processing}
          >
            {processing ? 'Procesando...' : $userStore ? 'Aceptar Invitación' : 'Ir a Iniciar Sesión'}
          </Button>
        </div>

        <!-- Permisos según rol -->
        <div class="border-t border-gray-200 pt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Con este rol podrás:</p>
          <ul class="text-sm text-gray-600 space-y-1">
            {#if invitation.role === 'owner'}
              <li>✓ Ver toda la información de la propiedad</li>
              <li>✓ Editar propiedad y habitaciones</li>
              <li>✓ Gestionar gastos e ingresos</li>
              <li>✓ Invitar y gestionar usuarios</li>
              <li>✓ Eliminar la propiedad</li>
            {:else if invitation.role === 'editor'}
              <li>✓ Ver toda la información de la propiedad</li>
              <li>✓ Editar propiedad y habitaciones</li>
              <li>✓ Gestionar gastos e ingresos</li>
              <li>✗ No puedes invitar usuarios ni eliminar</li>
            {:else}
              <li>✓ Ver toda la información de la propiedad</li>
              <li>✗ No puedes editar ni gestionar datos</li>
            {/if}
          </ul>
        </div>
      </div>
    {/if}
  </GlassCard>
</div>

