<script>
  import { Mail, UserPlus, Copy, Check } from "lucide-svelte";
  import Button from "../ui/Button.svelte";
  import Modal from "../ui/Modal.svelte";
  import { permissionsService, ROLES } from "$lib/services/permissions";
  import { userStore } from "$lib/stores/user";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let open = false;
  export let propertyId;

  let email = "";
  let role = ROLES.EDITOR;
  let loading = false;
  let error = "";
  let success = false;
  let result = null;

  async function handleInvite() {
    if (!email) {
      error = "Por favor ingresa un email";
      return;
    }

    loading = true;
    error = "";

    try {
      console.log("📧 Invitando usuario:", {
        propertyId,
        email,
        role,
        userId: $userStore.id,
      });
      result = await permissionsService.inviteUser(
        propertyId,
        email,
        role,
        $userStore.id
      );

      console.log("✅ Invitación exitosa:", result);
      success = true;
    } catch (err) {
      console.error("❌ Error al invitar:", err);
      error =
        err.message ||
        err.details ||
        err.hint ||
        "Error al enviar la invitación";
      if (err.code) {
        error += ` (Código: ${err.code})`;
      }
    } finally {
      loading = false;
    }
  }

  function reset() {
    email = "";
    role = ROLES.EDITOR;
    error = "";
    success = false;
    result = null;
  }

  $: if (!open && (success || email || error)) {
    // Reset cuando se cierra el modal
    reset();
  }

  function handleClose() {
    if (success) {
      dispatch("success", result);
    }
    open = false;
    reset();
  }

  function handleSuccessClose() {
    dispatch("success", result);
    open = false;
    reset();
  }
</script>

<Modal bind:open title="Invitar Usuario" size="md">
  {#if !success}
    <form on:submit|preventDefault={handleInvite} class="space-y-4">
      <!-- Email -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
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
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Rol de acceso
        </label>
        <select bind:value={role} class="input-glass">
          <option value={ROLES.VIEWER}>Visor - Solo puede ver</option>
          <option value={ROLES.EDITOR}>Editor - Puede ver y editar</option>
          <option value={ROLES.OWNER}>Propietario - Control total</option>
        </select>
      </div>

      {#if error}
        <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl"
        >
          {error}
        </div>
      {/if}

      <div class="flex gap-3">
        <Button type="button" variant="secondary" on:click={handleClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          <UserPlus size={20} class="inline mr-2" />
          {loading ? "Enviando..." : "Enviar Invitación"}
        </Button>
      </div>
    </form>
  {:else}
    <!-- Resultado de la invitación -->
    <div class="space-y-4">
      {#if result?.type === "direct"}
        <!-- Usuario añadido directamente -->
        <div
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl"
        >
          <p class="font-bold mb-1">✓ Usuario añadido exitosamente</p>
          <p class="text-sm">
            {email} ya tenía cuenta y se le ha dado acceso directo a la propiedad.
          </p>
        </div>
      {:else if result?.type === "pending"}
        <!-- Invitación pendiente -->
        <div
          class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl"
        >
          <p class="font-bold mb-1">📧 Invitación guardada</p>
          <p class="text-sm">
            {email} recibirá acceso automáticamente cuando se registre en la aplicación.
          </p>
        </div>

        <div
          class="bg-white/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
        >
          <p class="text-sm text-gray-700 dark:text-gray-300">
            <strong>💡 Consejo:</strong> Comparte este enlace con {email} para que
            pueda registrarse:
          </p>
          <code
            class="block mt-2 text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 break-all"
          >
            {window.location.origin}/login
          </code>
        </div>
      {/if}

      <Button fullWidth on:click={handleSuccessClose}>Cerrar</Button>
    </div>
  {/if}
</Modal>
