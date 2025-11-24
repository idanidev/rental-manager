<script>
  import { Mail, Lock, LogIn } from 'lucide-svelte';
  import { authService } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user';
  import Button from '../ui/Button.svelte';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';
  let mode = 'login'; // 'login' o 'register'
  let name = '';

  async function handleSubmit() {
    if (!email || !password) {
      error = 'Por favor completa todos los campos';
      return;
    }

    if (mode === 'register' && !name) {
      error = 'Por favor ingresa tu nombre';
      return;
    }

    if (mode === 'register' && password.length < 6) {
      error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      if (mode === 'login') {
        await authService.signIn(email, password);
        
        // Esperar a que el userStore se actualice
        await userStore.refresh();
        
        // Navegar al dashboard - el layout cargará las propiedades reactivamente
        goto('/');
      } else {
        await authService.signUp(email, password, name);
        success = '¡Cuenta creada! Revisa tu email para confirmar tu cuenta.';
        setTimeout(() => {
          mode = 'login';
          success = '';
        }, 3000);
      }
    } catch (err) {
      error = err.message || 'Error al autenticar';
    } finally {
      loading = false;
    }
  }
  
  function toggleMode() {
    mode = mode === 'login' ? 'register' : 'login';
    error = '';
    success = '';
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-pink-50 to-blue-50">
  <div class="glass-card max-w-md w-full space-y-6 animate-fade-in">
    <!-- Logo/Título -->
    <div class="text-center">
      <h1 class="text-4xl font-bold gradient-text mb-2">
        🏠 Rental Manager
      </h1>
      <p class="text-gray-600">
        {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
      </p>
    </div>

    <!-- Formulario -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      {#if mode === 'register'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Nombre completo
          </label>
          <input
            type="text"
            bind:value={name}
            placeholder="Juan Pérez"
            class="input-glass"
            required={mode === 'register'}
          />
        </div>
      {/if}

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Mail size={16} class="inline mr-1" />
          Email
        </label>
        <input
          type="email"
          bind:value={email}
          placeholder="tu@email.com"
          class="input-glass"
          required
          autocomplete="email"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Lock size={16} class="inline mr-1" />
          Contraseña
          {#if mode === 'register'}
            <span class="text-xs text-gray-500 font-normal">(mínimo 6 caracteres)</span>
          {/if}
        </label>
        <input
          type="password"
          bind:value={password}
          placeholder="••••••••"
          class="input-glass"
          required
          minlength={mode === 'register' ? 6 : undefined}
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      {/if}

      {#if success}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      {/if}

      <Button type="submit" fullWidth disabled={loading}>
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block"></div>
          Procesando...
        {:else}
          <LogIn size={20} class="inline mr-2" />
          {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        {/if}
      </Button>
    </form>

    <!-- Toggle modo -->
    <div class="text-center pt-2 border-t border-gray-200/50">
      <button
        type="button"
        on:click={toggleMode}
        class="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
    
    <!-- Info adicional -->
    {#if mode === 'register'}
      <div class="text-center text-xs text-gray-500 px-4">
        Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
      </div>
    {/if}
  </div>
</div>
