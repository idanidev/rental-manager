<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/user';
  import { propertiesStore } from '$lib/stores/properties';
  import { authService } from '$lib/services/auth';
  import { LogOut, Menu, X, Moon, Sun, User, Settings } from 'lucide-svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { theme } from '$lib/stores/theme';
  import { permissionsService } from '$lib/services/permissions';
  import { showToast } from '$lib/stores/toast';
  import { registerServiceWorker } from '$lib/utils/pwa';
  
  // No necesitamos exportar data/params en el layout
  
  let userMenuOpen = false;
  let loading = true;
  let propertiesLoaded = false;

  // Handler para cambios de autenticación
  async function handleAuthChange(e) {
    if (e.detail.user && !propertiesLoaded) {
      try {
        await propertiesStore.load(e.detail.user.id);
        propertiesLoaded = true;
      } catch (err) {
        console.error('Error al cargar propiedades después del login:', err);
      }
    }
  }
  
  // Reaccionar a cambios en userStore
  $: if ($userStore && !propertiesLoaded && typeof window !== 'undefined') {
    (async () => {
      try {
        // Procesar invitaciones pendientes primero
        const processedInvitations = await permissionsService.processPendingInvitations(
          $userStore.id,
          $userStore.email
        );
        
        // Mostrar notificación si se procesaron invitaciones
        if (processedInvitations.length > 0) {
          const propertyNames = processedInvitations.map(p => p.name).join(', ');
          showToast(`¡Bienvenido! Se te ha dado acceso a: ${propertyNames}`, 'success');
        }
        
        // Cargar propiedades
        await propertiesStore.load($userStore.id);
        propertiesLoaded = true;
      } catch (err) {
        console.error('Error al cargar propiedades:', err);
      }
    })();
  }

  onMount(async () => {
    try {
      // Registrar Service Worker para PWA
      if (typeof window !== 'undefined') {
        registerServiceWorker();
      }
      
      await userStore.init();
      
      // Las propiedades se cargarán reactivamente con $: cuando $userStore cambie
      
      // Redireccionamientos
      if ($userStore && $page.url.pathname === '/login') {
        goto('/');
      } else if (!$userStore && $page.url.pathname !== '/login' && !$page.url.pathname.startsWith('/accept-invitation')) {
        goto('/login');
      }
    } catch (err) {
      console.error('Error al inicializar:', err);
    } finally {
      loading = false;
    }
    
    // Escuchar cambios de autenticación
    if (typeof window !== 'undefined') {
      window.addEventListener('user-auth-changed', handleAuthChange);
    }
  });
  
  onDestroy(() => {
    // Limpiar listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('user-auth-changed', handleAuthChange);
    }
  });

  async function handleLogout() {
    try {
      await authService.signOut();
      userStore.clear();
      propertiesStore.clear();
      propertiesLoaded = false;
      goto('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }
  
  function closeUserMenu() {
    userMenuOpen = false;
  }
  
  // Cerrar menú cuando cambia la ruta
  $: if ($page.url.pathname) {
    userMenuOpen = false;
  }
  
  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname.startsWith('/accept-invitation');
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando...</p>
    </div>
  </div>
{:else if !$userStore && !isAuthPage}
  <!-- Redirigiendo al login -->
{:else}
  <div class="min-h-screen">
    {#if $userStore && !isAuthPage}
      <!-- Navbar Simple -->
      <nav class="glass-card m-2 sm:m-4 mb-2 relative z-50">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo - siempre vuelve al dashboard -->
          <a href="/" class="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <span class="text-2xl">🏠</span>
            <span class="text-lg sm:text-xl font-bold gradient-text">Rental Manager</span>
          </a>
          
          <!-- User Menu -->
          <div class="relative user-menu">
            <button
              on:click|stopPropagation={toggleUserMenu}
              class="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300"
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                {$userStore?.user_metadata?.name?.[0]?.toUpperCase() || $userStore?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              {#if userMenuOpen}
                <X size={16} class="text-gray-600 dark:text-gray-400" />
              {:else}
                <Menu size={16} class="text-gray-600 dark:text-gray-400" />
              {/if}
            </button>
            
            <!-- Dropdown Menu -->
            {#if userMenuOpen}
              <div 
                class="absolute right-0 top-full mt-2 w-48 glass-card rounded-2xl shadow-xl p-2 z-[60] backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 animate-fade-in"
                on:click|stopPropagation
              >
                <div class="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50 mb-2">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {$userStore?.user_metadata?.name || 'Usuario'}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {$userStore?.email}
                  </p>
                </div>
                
                <button
                  on:click={() => { theme.toggle(); closeUserMenu(); }}
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors text-gray-700 dark:text-gray-300 text-sm"
                >
                  {#if $theme === 'dark'}
                    <Sun size={16} />
                    <span>Modo claro</span>
                  {:else}
                    <Moon size={16} />
                    <span>Modo oscuro</span>
                  {/if}
                </button>
                
                <button
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors text-gray-700 dark:text-gray-300 text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>
                
                <div class="h-px bg-gray-200/50 dark:bg-gray-700/50 my-2"></div>
                
                <button
                  on:click={() => { handleLogout(); closeUserMenu(); }}
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 text-sm"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            {/if}
          </div>
        </div>
      </nav>
      
      <!-- Backdrop para cerrar menú (solo cuando está abierto) -->
      {#if userMenuOpen}
        <div 
          class="fixed inset-0 z-[55]"
          on:click={closeUserMenu}
          role="button"
          tabindex="-1"
          aria-label="Cerrar menú"
        ></div>
      {/if}
    {/if}

    <!-- Main Content -->
    <main class="p-2 sm:p-4">
      <slot />
    </main>
  </div>
{/if}

<!-- Toast Notifications -->
<Toast />
