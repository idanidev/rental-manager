<script>
  import { Mail, Lock, LogIn, X, ChevronDown } from 'lucide-svelte';
  import { authService } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user';
  import { onMount } from 'svelte';
  import Button from '../ui/Button.svelte';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';
  let mode = 'login'; // 'login' o 'register'
  let name = '';
  let savedEmails = [];
  let showEmailDropdown = false;
  let emailInputElement;
  
  const STORAGE_KEY_LAST_EMAIL = 'rental_manager_last_email';
  const STORAGE_KEY_SAVED_EMAILS = 'rental_manager_saved_emails';
  const MAX_SAVED_EMAILS = 5;

  // Cargar emails guardados al montar
  onMount(() => {
    loadSavedEmails();
    
    // Cargar último email usado
    if (typeof window !== 'undefined') {
      const lastEmail = localStorage.getItem(STORAGE_KEY_LAST_EMAIL);
      if (lastEmail) {
        email = lastEmail;
      }
      
      // Listener para cerrar dropdown al hacer click fuera
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });

  function loadSavedEmails() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_EMAILS);
      if (saved) {
        savedEmails = JSON.parse(saved).filter(e => e && e.trim() !== '');
      }
    } catch (err) {
      console.error('Error loading saved emails:', err);
      savedEmails = [];
    }
  }

  function saveEmail(emailToSave) {
    if (!emailToSave || typeof window === 'undefined') return;
    
    // Guardar como último email usado
    localStorage.setItem(STORAGE_KEY_LAST_EMAIL, emailToSave);
    
    // Agregar a la lista de emails guardados (sin duplicados)
    const emailLower = emailToSave.toLowerCase().trim();
    if (!savedEmails.find(e => e.toLowerCase() === emailLower)) {
      savedEmails.unshift(emailToSave.trim());
      // Mantener solo los últimos N emails
      if (savedEmails.length > MAX_SAVED_EMAILS) {
        savedEmails = savedEmails.slice(0, MAX_SAVED_EMAILS);
      }
      
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_EMAILS, JSON.stringify(savedEmails));
      } catch (err) {
        console.error('Error saving emails:', err);
      }
    }
  }

  function removeSavedEmail(emailToRemove, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    savedEmails = savedEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase());
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_EMAILS, JSON.stringify(savedEmails));
      } catch (err) {
        console.error('Error saving emails:', err);
      }
    }
    
    // Si era el email actual, limpiarlo
    if (email.toLowerCase() === emailToRemove.toLowerCase()) {
      email = '';
    }
  }

  function selectEmail(selectedEmail) {
    email = selectedEmail;
    showEmailDropdown = false;
    // Dar foco al campo de contraseña
    if (typeof document !== 'undefined') {
      const passwordInput = document.getElementById('password-input');
      if (passwordInput && passwordInput.focus) {
        setTimeout(() => passwordInput.focus(), 100);
      }
    }
  }

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
        
        // Guardar email después de login exitoso
        saveEmail(email);
        
        // Esperar a que el userStore se actualice
        await userStore.refresh();
        
        // Navegar al dashboard - el layout cargará las propiedades reactivamente
        goto('/');
      } else {
        await authService.signUp(email, password, name);
        
        // Guardar email después de registro
        saveEmail(email);
        
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
    showEmailDropdown = false;
  }
  
  // Cerrar dropdown al hacer click fuera
  function handleClickOutside(event) {
    if (emailInputElement && !emailInputElement.contains(event.target)) {
      showEmailDropdown = false;
    }
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

      <div class="relative" bind:this={emailInputElement}>
        <label for="email-input" class="block text-sm font-medium text-gray-700 mb-2">
          <Mail size={16} class="inline mr-1" />
          Email
        </label>
        <div class="relative">
          <input
            id="email-input"
            type="email"
            bind:value={email}
            placeholder="tu@email.com"
            class="input-glass pr-10"
            required
            autocomplete="email"
            list="saved-emails-list"
            on:focus={() => {
              if (savedEmails.length > 0) {
                showEmailDropdown = true;
              }
            }}
            on:input={() => {
              if (email && savedEmails.length > 0) {
                showEmailDropdown = true;
              }
            }}
          />
          {#if savedEmails.length > 0}
            <button
              type="button"
              on:click={(e) => {
                e.stopPropagation();
                showEmailDropdown = !showEmailDropdown;
              }}
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabindex="-1"
            >
              <ChevronDown 
                size={18} 
                class="transition-transform {showEmailDropdown ? 'rotate-180' : ''}" 
              />
            </button>
          {/if}
        </div>
        
        <!-- Dropdown de emails guardados -->
        {#if showEmailDropdown && savedEmails.length > 0}
          <div class="absolute z-50 w-full mt-1 glass-card rounded-xl shadow-xl border border-gray-200/50 max-h-48 overflow-y-auto">
            <div class="p-2 space-y-1">
              {#each savedEmails.filter(e => !email || e.toLowerCase().includes(email.toLowerCase())) as savedEmail (savedEmail)}
                <div class="flex items-center justify-between group hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg px-3 py-2 transition-colors">
                  <button
                    type="button"
                    on:click={() => selectEmail(savedEmail)}
                    class="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    <Mail size={14} class="inline mr-2 text-gray-400" />
                    {savedEmail}
                  </button>
                  <button
                    type="button"
                    on:click={(e) => removeSavedEmail(savedEmail, e)}
                    class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                    title="Eliminar"
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Data list para autocompletado del navegador -->
      <datalist id="saved-emails-list">
        {#each savedEmails as savedEmail}
          <option value={savedEmail} />
        {/each}
      </datalist>

      <div>
          <label for="password-input" class="block text-sm font-medium text-gray-700 mb-2">
            <Lock size={16} class="inline mr-1" />
            Contraseña
            {#if mode === 'register'}
              <span class="text-xs text-gray-500 font-normal">(mínimo 6 caracteres)</span>
            {/if}
          </label>
          <input
            id="password-input"
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
