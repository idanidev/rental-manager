<script>
  import { Mail, UserPlus, Copy, Check } from 'lucide-svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { permissionsService, ROLES } from '$lib/services/permissions';
  import { userStore } from '$lib/stores/user';
  
  export let open = false;
  export let propertyId;
  
  let email = '';
  let role = ROLES.EDITOR;
  let loading = false;
  let error = '';
  let success = false;
  let invitationLink = '';
  let copied = false;

  async function handleInvite() {
    if (!email) {
      error = 'Por favor ingresa un email';
      return;
    }

    loading = true;
    error = '';

    try {
      const invitation = await permissionsService.inviteUser(
        propertyId,
        email,
        role,
        $userStore.id
      );
      
      invitationLink = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
      success = true;
    } catch (err) {
      error = err.message || 'Error al enviar la invitación';
    } finally {
      loading = false;
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(invitationLink);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function reset() {
    email = '';
    role = ROLES.EDITOR;
    error = '';
    success = false;
    invitationLink = '';
    open = false;
  }
</script>

<Modal bind:open title="Invitar Usuario" size="md">
  {#if !success}
    <form on:submit|preventDefault={handleInvite} class="space-y-4">
      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Mail size={16} class="inline mr-1" />
          Email del usuario
        </label>
        <input
          type="email"
          bind:value={email}
          placeholder="usuario@ejemplo.com"
          class="input-glass"
          required
        />
      </div>

      <!-- Rol -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Rol de acceso
        </label>
        <select bind:value={role} class="input-glass">
          <option value={ROLES.VIEWER}>Visor - Solo puede ver</option>
          <option value={ROLES.EDITOR}>Editor - Puede ver y editar</option>
          <option value={ROLES.OWNER}>Propietario - Control total</option>
        </select>
      </div>

      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      {/if}

      <div class="flex gap-3">
        <Button type="button" variant="secondary" on:click={reset}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          <UserPlus size={20} class="inline mr-2" />
          {loading ? 'Enviando...' : 'Enviar Invitación'}
        </Button>
      </div>
    </form>
  {:else}
    <!-- Invitación enviada exitosamente -->
    <div class="space-y-4">
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
        ✓ Invitación enviada correctamente a {email}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Link de invitación (válido 7 días)
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            value={invitationLink}
            readonly
            class="input-glass flex-1"
          />
          <Button variant="secondary" on:click={copyLink}>
            {#if copied}
              <Check size={20} />
            {:else}
              <Copy size={20} />
            {/if}
          </Button>
        </div>
      </div>

      <Button fullWidth on:click={reset}>
        Cerrar
      </Button>
    </div>
  {/if}
</Modal>
