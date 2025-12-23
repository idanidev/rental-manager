<script>
  import { Mail, Lock, LogIn, X, ChevronDown } from 'lucide-svelte';
  import { authService } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
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

  // Generar posiciones de partículas de forma estática
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.1,
    duration: 15 + (i % 10),
    x: Math.random() * 100,
    y: Math.random() * 100
  }));

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
        
        // Intentar iniciar sesión automáticamente después del registro
        try {
          await authService.signIn(email, password);
          
          // Esperar a que el userStore se actualice
          await userStore.refresh();
          
          // Navegar al dashboard - el layout cargará las propiedades reactivamente
          goto('/');
        } catch (signInError) {
          // Si no puede iniciar sesión automáticamente (p. ej., requiere confirmación de email)
          const errorMsg = signInError?.message || String(signInError || '');
          
          if (errorMsg.includes('Email not confirmed') || errorMsg.includes('email not confirmed')) {
            success = '¡Cuenta creada! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.';
            setTimeout(() => {
              mode = 'login';
              success = '';
            }, 5000);
          } else {
            // Si hay otro error, mostrar mensaje pero permitir intentar iniciar sesión manualmente
            success = '¡Cuenta creada! Puedes iniciar sesión ahora.';
            setTimeout(() => {
              mode = 'login';
              success = '';
              password = ''; // Limpiar contraseña para seguridad
            }, 3000);
          }
        }
      }
    } catch (err) {
      const errorMessage = err?.message || err?.error_description || String(err || 'Error al autenticar');
      
      // Mejorar mensajes de error comunes
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        error = 'Error en el servidor al crear la cuenta. Por favor, inténtalo de nuevo o contacta con soporte.';
      } else if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
        error = 'Este email ya está registrado. Por favor, inicia sesión.';
      } else if (errorMessage.includes('Password')) {
        error = 'La contraseña no cumple los requisitos. Debe tener al menos 6 caracteres.';
      } else if (errorMessage.includes('Email')) {
        error = 'El formato del email no es válido.';
      } else {
        error = errorMessage;
      }
      
      console.error('Error en autenticación:', err);
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

<div class="login-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
  <!-- Fondo animado con gradientes -->
  <div class="animated-background absolute inset-0 -z-10">
    <div class="gradient-blob blob-1"></div>
    <div class="gradient-blob blob-2"></div>
    <div class="gradient-blob blob-3"></div>
  </div>
  
  <!-- Partículas flotantes -->
  <div class="floating-particles absolute inset-0 -z-10">
    {#each particles as particle (particle.id)}
      <div class="particle" style="--delay: {particle.delay}s; --duration: {particle.duration}s; --x: {particle.x}%; --y: {particle.y}%;"></div>
    {/each}
  </div>
  
  <div class="glass-card-enhanced max-w-md w-full space-y-6 animate-slide-up relative z-10">
    <!-- Logo/Título con animación -->
    <div class="text-center animate-fade-in-delayed">
      <div class="inline-block mb-3 animate-bounce-gentle">
        <div class="logo-wrapper p-4 rounded-3xl gradient-primary shadow-2xl shadow-orange-500/30">
          <span class="text-4xl">🏠</span>
        </div>
      </div>
      <h1 class="text-4xl font-bold gradient-text mb-2 animate-text-shimmer">
        Rental Manager
      </h1>
      <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">
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
            class="input-glass-enhanced"
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
            class="input-glass-enhanced pr-10"
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
            class="input-glass-enhanced"
            required
            minlength={mode === 'register' ? 6 : undefined}
            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
      </div>

      {#if error}
        <div 
          transition:slide={{ duration: 300 }}
          class="error-message-modern bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg shadow-red-500/10 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      {#if success}
        <div 
          transition:slide={{ duration: 300 }}
          class="success-message-modern bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg shadow-green-500/10 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
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
    <div class="text-center pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
      <button
        type="button"
        on:click={toggleMode}
        class="toggle-mode-btn text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
      >
        <span>{mode === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}</span>
        <span class="text-lg transition-transform duration-300 {mode === 'login' ? 'rotate-0' : 'rotate-180'}">✨</span>
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
