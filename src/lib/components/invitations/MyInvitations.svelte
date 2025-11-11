<script>
  import { onMount } from 'svelte';
  import { Mail, MapPin, Check, X } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { permissionsService } from '$lib/services/permissions';
  import { showToast } from '$lib/stores/toast';
  import GlassCard from '../ui/GlassCard.svelte';
  import Button from '../ui/Button.svelte';
  
  let invitations = [];
  let loading = true;
  
  onMount(async () => {
    await loadInvitations();
  });
  
  async function loadInvitations() {
    if (!$userStore?.email) return;
    
    loading = true;
    try {
      console.log('🔍 Cargando invitaciones para:', $userStore.email);
      invitations = await permissionsService.getMyInvitations($userStore.email);
      console.log('📨 Invitaciones encontradas:', invitations);
    } catch (err) {
      console.error('❌ Error loading invitations:', err);
      console.error('Detalles:', err.message, err.details, err.hint);
    } finally {
      loading = false;
    }
  }
  
  async function acceptInvitation(invitation) {
    try {
      await permissionsService.acceptInvitation(invitation.token, $userStore.id);
      showToast(`Acceso aceptado a ${invitation.property?.name}`, 'success');
      await loadInvitations();
      
      // Recargar la página para actualizar propiedades
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast(err.message || 'Error al aceptar la invitación', 'error');
    }
  }
  
  async function rejectInvitation(invitation) {
    try {
      await permissionsService.cancelInvitation(invitation.id);
      showToast('Invitación rechazada', 'info');
      await loadInvitations();
    } catch (err) {
      showToast('Error al rechazar la invitación', 'error');
    }
  }
  
  function getRoleLabel(role) {
    const labels = {
      owner: 'Propietario',
      editor: 'Editor',
      viewer: 'Visor'
    };
    return labels[role] || role;
  }
</script>

{#if !loading && invitations.length > 0}
  <div class="space-y-3">
    <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
      <Mail size={20} class="text-purple-600" />
      Invitaciones Pendientes ({invitations.length})
    </h2>
    
    {#each invitations as invitation (invitation.id)}
      <GlassCard hover={false}>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex-1">
            <h3 class="font-bold text-gray-800">{invitation.property?.name}</h3>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
              <span class="flex items-center gap-1">
                <MapPin size={14} />
                {invitation.property?.address}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                Rol: {getRoleLabel(invitation.role)}
              </span>
            </div>
          </div>
          
          <div class="flex gap-2 flex-shrink-0">
            <Button 
              variant="secondary" 
              on:click={() => rejectInvitation(invitation)}
              className="text-red-600 hover:bg-red-50"
            >
              <X size={18} class="mr-1" />
              Rechazar
            </Button>
            <Button on:click={() => acceptInvitation(invitation)}>
              <Check size={18} class="mr-1" />
              Aceptar
            </Button>
          </div>
        </div>
      </GlassCard>
    {/each}
  </div>
{/if}

