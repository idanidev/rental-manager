<script>
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';
  import { permissionsService } from '$lib/services/permissions';
  import { showToast } from '$lib/stores/toast';
  import { UserPlus, UserMinus, Shield, Eye, Edit3, X, Mail, AlertCircle } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import InviteModal from './InviteModal.svelte';

  export let propertyId;
  export let currentUserRole = null; // 'owner', 'editor', 'viewer'

  let users = [];
  let loading = true;
  let showInviteModal = false;
  let showConfirmDialog = false;
  let userToRemove = null;
  let removing = false;

  $: isOwner = currentUserRole === 'owner';
  $: currentUserId = $userStore?.id;

  onMount(() => {
    loadUsers();
  });

  async function loadUsers() {
    loading = true;
    try {
      users = await permissionsService.getPropertyAccess(propertyId);
      // Determinar el rol actual del usuario si no se proporcionó
      if (!currentUserRole && currentUserId) {
        const currentUserAccess = users.find(u => u.user_id === currentUserId);
        if (currentUserAccess) {
          currentUserRole = currentUserAccess.role;
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      loading = false;
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

  function getRoleIcon(role) {
    if (role === 'owner') return Shield;
    if (role === 'editor') return Edit3;
    return Eye;
  }

  function getRoleColor(role) {
    if (role === 'owner') return 'bg-purple-100 text-purple-700';
    if (role === 'editor') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  }

  function handleInviteSuccess() {
    showInviteModal = false;
    loadUsers();
    showToast('Usuario invitado exitosamente', 'success');
  }

  function confirmRemove(user) {
    if (user.role === 'owner') {
      showToast('No puedes eliminar al propietario', 'error');
      return;
    }
    userToRemove = user;
    showConfirmDialog = true;
  }

  async function removeUser() {
    if (!userToRemove) return;
    
    removing = true;
    try {
      await permissionsService.revokeAccess(propertyId, userToRemove.user_id);
      showToast('Usuario eliminado exitosamente', 'success');
      await loadUsers();
      showConfirmDialog = false;
      userToRemove = null;
    } catch (err) {
      console.error('Error removing user:', err);
      showToast(err.message || 'Error al eliminar usuario', 'error');
    } finally {
      removing = false;
    }
  }

  function cancelRemove() {
    showConfirmDialog = false;
    userToRemove = null;
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Shield size={20} class="text-purple-600" />
        Usuarios con Acceso
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Gestiona quién puede ver y editar esta propiedad
      </p>
    </div>
    
    {#if isOwner}
      <Button on:click={() => showInviteModal = true} className="text-sm">
        <UserPlus size={18} class="mr-1" />
        Invitar Usuario
      </Button>
    {/if}
  </div>

  <!-- Lista de usuarios -->
  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  {:else if users.length === 0}
    <GlassCard hover={false}>
      <div class="text-center py-8">
        <AlertCircle size={48} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">No hay usuarios con acceso</p>
      </div>
    </GlassCard>
  {:else}
    <div class="space-y-2">
      {#each users as user (user.access_id || user.user_id)}
        {@const RoleIcon = getRoleIcon(user.role)}
        {@const isCurrentUser = user.user_id === currentUserId}
        <GlassCard hover={false}>
          <div class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3 flex-1">
              <div class="p-2 rounded-lg {getRoleColor(user.role)}">
                <RoleIcon size={20} />
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-gray-800 truncate">
                    {user.user_email || `Usuario ${user.user_id.slice(0, 8)}`}
                  </p>
                  {#if isCurrentUser}
                    <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      Tú
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs px-2 py-0.5 {getRoleColor(user.role)} rounded-full font-medium">
                    {getRoleLabel(user.role)}
                  </span>
                  {#if user.created_at}
                    <span class="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  {/if}
                </div>
              </div>
            </div>

            {#if isOwner && !isCurrentUser && user.role !== 'owner'}
              <Button
                variant="secondary"
                on:click={() => confirmRemove(user)}
                className="text-red-600 hover:bg-red-50"
              >
                <UserMinus size={18} />
                <span class="hidden sm:inline ml-1">Eliminar</span>
              </Button>
            {/if}
          </div>
        </GlassCard>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal de Invitación -->
{#if showInviteModal}
  <InviteModal
    {propertyId}
    on:close={() => showInviteModal = false}
    on:success={handleInviteSuccess}
  />
{/if}

<!-- Confirmación de eliminación -->
<ConfirmDialog
  open={showConfirmDialog}
  title="Eliminar Usuario"
  message="¿Estás seguro de que quieres eliminar el acceso de este usuario? No podrá ver ni editar esta propiedad."
  confirmText="Eliminar"
  cancelText="Cancelar"
  variant="danger"
  on:confirm={removeUser}
  on:cancel={cancelRemove}
  {removing}
/>

