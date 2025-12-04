<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/user';
  import { propertiesStore } from '$lib/stores/properties';
  import { authService } from '$lib/services/auth';
  import { supabase } from '$lib/services/supabase';
  import { LogOut, Menu, Moon, Sun, User, Settings, Bell } from 'lucide-svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { theme } from '$lib/stores/theme';
  import { permissionsService } from '$lib/services/permissions';
  import { showToast } from '$lib/stores/toast';
  import { registerServiceWorker } from '$lib/utils/pwa';
  import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
  import { notificationsStore } from '$lib/stores/notifications';
  
  // No necesitamos exportar data/params en el layout
  
  let userMenuOpen = false;
  let loading = true;
  let propertiesLoaded = false;
  let isInitialized = false;

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
  
  // Reaccionar a cambios en userStore (solo si no estamos en proceso de logout)
  let isLoggingOut = false;
  
  // Cargar datos del usuario solo en el cliente (SSR-safe)
  async function loadUserData() {
    if (!browser || !$userStore || propertiesLoaded || isLoggingOut || isInitialized) return;
    
    isInitialized = true;
    
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
      
      // Inicializar store de notificaciones (no bloquear si falla)
      try {
        await notificationsStore.init($userStore.id);
      } catch (err) {
        // No romper la aplicación si las notificaciones fallan (tablas pueden no existir aún)
        console.warn('Could not initialize notifications store:', err);
      }
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      isInitialized = false; // Permitir reintentar
    }
  }
  
  // Solo ejecutar en el cliente
  $: if (browser && $userStore && !propertiesLoaded && !isLoggingOut && !isInitialized) {
    loadUserData();
  }

  onMount(async () => {
    if (!browser) return;
    
    try {
      // Registrar Service Worker para PWA
      registerServiceWorker();
      
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
    window.addEventListener('user-auth-changed', handleAuthChange);
  });
  
  onDestroy(() => {
    if (!browser) return;
    
    // Limpiar listener
    window.removeEventListener('user-auth-changed', handleAuthChange);
    // Limpiar store de notificaciones
    notificationsStore.clear();
  });

  // Función eliminada - ahora se hace directamente en el botón

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }
  
  function closeUserMenu() {
    userMenuOpen = false;
  }
  
  // Función de logout
  async function handleLogout(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    
    // Marcar que estamos cerrando sesión
    isLoggingOut = true;
    userMenuOpen = false;
    
    try {
      // Limpiar stores de forma segura
      try {
        if (userStore && typeof userStore.clear === 'function') {
          userStore.clear();
        }
      } catch (err) {
        console.warn('Error al limpiar userStore:', err);
      }
      
      try {
        if (propertiesStore && typeof propertiesStore.clear === 'function') {
          propertiesStore.clear();
        }
      } catch (err) {
        console.warn('Error al limpiar propertiesStore:', err);
      }
      
      propertiesLoaded = true;
      
      // Cerrar sesión en Supabase
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error al cerrar sesión en Supabase:', err);
      }
    } catch (err) {
      console.error('Error durante el logout:', err);
    }
    
    // Redirigir inmediatamente
    if (browser) {
      window.location.replace('/login');
    } else {
      goto('/login');
    }
  }
  
  // Cerrar menú cuando cambia la ruta
  $: if ($page.url.pathname) {
    userMenuOpen = false;
  }
  
  // Cerrar menú al hacer click fuera
  let menuContainer;
  let menuDropdown;
  let cleanupClickListener = null;
  
  $: if (browser && userMenuOpen) {
    // Limpiar listener anterior si existe
    if (cleanupClickListener) {
      cleanupClickListener();
      cleanupClickListener = null;
    }
    
    // Agregar nuevo listener - usar capture phase para capturar todos los clics
    const handleClickOutside = (e) => {
      const target = e.target;
      if (!target) return;
      
      // Verificar si el clic está dentro del contenedor del menú o del dropdown
      const clickedInsideButton = menuContainer?.contains(target);
      const clickedInsideDropdown = menuDropdown?.contains(target);
      
      if (!clickedInsideButton && !clickedInsideDropdown) {
        closeUserMenu();
      }
    };
    
    // Usar setTimeout para que el click actual termine primero
    setTimeout(() => {
      // Usar capture phase para capturar clics antes de que lleguen a otros elementos
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      cleanupClickListener = () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('touchstart', handleClickOutside, true);
      };
    }, 10);
  } else if (cleanupClickListener) {
    cleanupClickListener();
    cleanupClickListener = null;
  }
  
  onDestroy(() => {
    if (cleanupClickListener) {
      cleanupClickListener();
    }
  });
  
  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname.startsWith('/accept-invitation');
  
  // Estilo del menú dropdown - completamente opaco
  $: menuBackgroundColor = $theme === 'dark' ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)';
  $: menuStyle = `z-index: 99999; background-color: ${menuBackgroundColor} !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; opacity: 1 !important;`;
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
      <nav class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl m-2 sm:m-4 mb-2 p-2 sm:p-3 relative z-50 shadow-xl">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo - siempre vuelve al dashboard -->
          <a href="/" class="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <span class="text-2xl">🏠</span>
            <span class="text-lg sm:text-xl font-bold gradient-text">Rental Manager</span>
          </a>
          
          <!-- Notificaciones y User Menu -->
          <div class="flex items-center gap-3">
            <!-- Notificaciones -->
            <NotificationBell />
            
            <!-- User Menu -->
            <div class="relative user-menu" bind:this={menuContainer} style="z-index: 10000;">
            <button
              type="button"
              on:click|stopPropagation={toggleUserMenu}
              class="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 relative z-[101] focus:outline-none"
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {$userStore?.user_metadata?.name?.[0]?.toUpperCase() || $userStore?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <Menu 
                size={16} 
                class="text-gray-600 dark:text-gray-400 transition-transform {userMenuOpen ? 'rotate-90' : ''}" 
              />
            </button>
            
            <!-- Overlay invisible para cerrar el menú al hacer clic fuera -->
            {#if userMenuOpen}
              <div 
                class="fixed inset-0 z-[99998]"
                on:click={closeUserMenu}
                on:touchstart={closeUserMenu}
                role="presentation"
                aria-hidden="true"
              ></div>
            {/if}
            
            <!-- Dropdown Menu -->
            {#if userMenuOpen}
              <div 
                bind:this={menuDropdown}
                class="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl p-2 border border-gray-200 dark:border-gray-700 animate-fade-in z-[99999]"
                style={menuStyle}
                role="menu"
                aria-label="Menú de usuario"
                data-menu-opaque="true"
              >
                <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                  <p class="text-sm font-semibold" style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;">
                    {$userStore?.user_metadata?.name || 'Usuario'}
                  </p>
                  <p class="text-xs truncate" style="color: {$theme === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'} !important;">
                    {$userStore?.email}
                  </p>
                </div>
                
                <button
                  on:click={() => { theme.toggle(); closeUserMenu(); }}
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;"
                >
                  {#if $theme === 'dark'}
                    <Sun size={16} style="color: rgb(243, 244, 246) !important;" />
                    <span>Modo claro</span>
                  {:else}
                    <Moon size={16} style="color: rgb(17, 24, 39) !important;" />
                    <span>Modo oscuro</span>
                  {/if}
                </button>
                
                <button
                  on:click={() => { goto('/notifications/settings'); closeUserMenu(); }}
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;"
                >
                  <Bell size={16} style="color: {$theme === 'dark' ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'} !important;" />
                  <span>Notificaciones</span>
                </button>
                
                <div class="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                
                <button
                  type="button"
                  on:click|stopPropagation={handleLogout}
                  on:mousedown|stopPropagation
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm cursor-pointer"
                  style="position: relative; z-index: 999999; color: {$theme === 'dark' ? 'rgb(248, 113, 113)' : 'rgb(220, 38, 38)'} !important;"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            {/if}
            </div>
          </div>
        </div>
      </nav>
    {/if}

    <!-- Main Content -->
    <main class="p-2 sm:p-4">
      <slot />
    </main>
  </div>
{/if}

<!-- Toast Notifications -->
<Toast />
