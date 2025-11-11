<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/user';
  import { propertiesStore } from '$lib/stores/properties';
  import { authService } from '$lib/services/auth';
  import { Home, LayoutDashboard, LogOut, Menu, X, Moon, Sun, BarChart3, Search } from 'lucide-svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
  import SearchModal from '$lib/components/search/SearchModal.svelte';
  import { theme } from '$lib/stores/theme';
  import { permissionsService } from '$lib/services/permissions';
  import { showToast } from '$lib/stores/toast';
  import { registerServiceWorker } from '$lib/utils/pwa';
  
  // No necesitamos exportar data/params en el layout
  
  let mobileMenuOpen = false;
  let loading = true;
  let propertiesLoaded = false;
  let searchModalOpen = false;

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

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  // Cerrar menú móvil cuando cambia la ruta
  $: if ($page.url.pathname) {
    mobileMenuOpen = false;
  }

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname.startsWith('/accept-invitation');
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando...</p>
    </div>
  </div>
{:else if !$userStore && !isAuthPage}
  <!-- Redirigiendo al login -->
{:else}
  <div class="min-h-screen">
    {#if $userStore && !isAuthPage}
      <!-- Navbar -->
      <nav class="glass-card m-2 sm:m-4 mb-0 relative z-50">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo -->
          <a href="/" class="flex items-center gap-2 flex-shrink-0">
            <span class="text-2xl">🏠</span>
            <span class="text-lg sm:text-xl font-bold gradient-text hidden lg:inline">Rental Manager</span>
          </a>
          
          <!-- Search Button -->
          <button
            on:click={() => searchModalOpen = true}
            class="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-100/50 hover:bg-gray-100 transition-all duration-300 text-left text-sm text-gray-500 whitespace-nowrap"
          >
            <Search size={16} />
            <span class="hidden xl:inline">Buscar...</span>
            <kbd class="hidden xl:inline px-2 py-0.5 bg-white rounded text-xs ml-2">⌘K</kbd>
          </button>

          <!-- Desktop Menu -->
          <div class="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
            <a 
              href="/" 
              class="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-2xl transition-all duration-300 font-medium
                {$page.url.pathname === '/' 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 shadow-sm' 
                  : 'hover:bg-white/60 text-gray-700 hover:text-gray-900'}"
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
              <span class="text-sm hidden lg:inline">Dashboard</span>
            </a>
            
            <a 
              href="/properties" 
              class="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-2xl transition-all duration-300 font-medium
                {$page.url.pathname.startsWith('/properties') 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 shadow-sm' 
                  : 'hover:bg-white/60 text-gray-700 hover:text-gray-900'}"
              title="Propiedades"
            >
              <Home size={18} />
              <span class="text-sm hidden lg:inline">Propiedades</span>
            </a>
            
            <a 
              href="/analytics" 
              class="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-2xl transition-all duration-300 font-medium
                {$page.url.pathname === '/analytics' 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 shadow-sm' 
                  : 'hover:bg-white/60 text-gray-700 hover:text-gray-900'}"
              title="Analytics"
            >
              <BarChart3 size={18} />
              <span class="text-sm hidden lg:inline">Analytics</span>
            </a>

            <div class="h-6 w-px bg-gray-200 mx-1"></div>
            
            <NotificationBell />
            
            <button
              on:click={() => theme.toggle()}
              class="p-2 lg:p-2.5 rounded-2xl hover:bg-white/60 transition-all duration-300"
              title="Cambiar tema"
            >
              {#if $theme === 'dark'}
                <Sun size={16} class="text-gray-200 lg:w-[18px] lg:h-[18px]" />
              {:else}
                <Moon size={16} class="text-gray-700 lg:w-[18px] lg:h-[18px]" />
              {/if}
            </button>

            <button
              on:click={handleLogout}
              class="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-2xl hover:bg-red-50 text-red-600 transition-all duration-300 font-medium"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span class="text-sm hidden lg:inline">Salir</span>
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <div class="md:hidden flex items-center gap-2">
            <button
              on:click={() => searchModalOpen = true}
              class="p-2.5 hover:bg-white/60 rounded-2xl transition-all duration-300"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>
            
            <button 
              on:click={toggleMobileMenu}
              class="p-2.5 hover:bg-white/60 rounded-2xl transition-all duration-300 flex-shrink-0"
              aria-label="Menú"
              aria-expanded={mobileMenuOpen}
            >
              {#if mobileMenuOpen}
                <X size={20} />
              {:else}
                <Menu size={20} />
              {/if}
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        {#if mobileMenuOpen}
          <div class="md:hidden mt-4 pt-4 border-t border-gray-200/50 space-y-2 animate-fade-in">
            <a 
              href="/" 
              class="flex items-center gap-2 px-4 py-3 rounded-2xl transition-all touch-manipulation font-medium
                {$page.url.pathname === '/' 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700' 
                  : 'hover:bg-white/60 active:bg-white/80 text-gray-700'}"
            >
              <LayoutDashboard size={18} />
              <span class="text-sm">Dashboard</span>
            </a>
            
            <a 
              href="/properties" 
              class="flex items-center gap-2 px-4 py-3 rounded-2xl transition-all touch-manipulation font-medium
                {$page.url.pathname.startsWith('/properties') 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700' 
                  : 'hover:bg-white/60 active:bg-white/80 text-gray-700'}"
            >
              <Home size={18} />
              <span class="text-sm">Propiedades</span>
            </a>
            
            <a 
              href="/analytics" 
              class="flex items-center gap-2 px-4 py-3 rounded-2xl transition-all touch-manipulation font-medium
                {$page.url.pathname === '/analytics' 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700' 
                  : 'hover:bg-white/60 active:bg-white/80 text-gray-700'}"
            >
              <BarChart3 size={18} />
              <span class="text-sm">Analytics</span>
            </a>

            <div class="h-px bg-gray-200/50 my-2"></div>
            
            <div class="flex items-center gap-2 px-4">
              <NotificationBell />
              <button
                on:click={() => theme.toggle()}
                class="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-white/60 active:bg-white/80 text-gray-700 transition-all touch-manipulation font-medium"
              >
                {#if $theme === 'dark'}
                  <Sun size={18} />
                  <span class="text-sm">Modo claro</span>
                {:else}
                  <Moon size={18} />
                  <span class="text-sm">Modo oscuro</span>
                {/if}
              </button>
            </div>
            
            <button
              on:click={handleLogout}
              class="w-full flex items-center gap-2 px-4 py-3 rounded-2xl hover:bg-red-50 active:bg-red-100 text-red-600 transition-all touch-manipulation font-medium"
            >
              <LogOut size={18} />
              <span class="text-sm">Salir</span>
            </button>
          </div>
        {/if}
      </nav>
    {/if}

    <!-- Main Content -->
    <main class="p-2 sm:p-4">
      <slot />
    </main>
  </div>
{/if}

<!-- Search Modal -->
<SearchModal bind:open={searchModalOpen} />

<!-- Toast Notifications -->
<Toast />
