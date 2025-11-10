<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/user';
  import { propertiesStore } from '$lib/stores/properties';
  import { authService } from '$lib/services/auth';
  import { Home, LayoutDashboard, LogOut, Menu, X } from 'lucide-svelte';
  
  // No necesitamos exportar data/params en el layout
  
  let mobileMenuOpen = false;
  let loading = true;
  let propertiesLoaded = false;

  onMount(async () => {
    await userStore.init();
    
    if ($userStore) {
      // Cargar propiedades cuando hay un usuario
      try {
        await propertiesStore.load($userStore.id);
        propertiesLoaded = true;
      } catch (err) {
        console.error('Error al cargar propiedades:', err);
      }
      
      // Si estamos en login y ya hay sesión, redirigir al dashboard
      if ($page.url.pathname === '/login') {
        goto('/');
      }
    } else {
      // Si no hay sesión y no estamos en login, redirigir
      if ($page.url.pathname !== '/login' && !$page.url.pathname.startsWith('/accept-invitation')) {
        goto('/login');
      }
    }
    
    loading = false;
  });

  async function handleLogout() {
    await authService.signOut();
    userStore.clear();
    goto('/login');
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
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <a href="/" class="flex items-center gap-2 flex-shrink-0">
            <span class="text-2xl">🏠</span>
            <span class="text-lg sm:text-xl font-bold gradient-text">Rental Manager</span>
          </a>

          <!-- Desktop Menu -->
          <div class="hidden md:flex items-center gap-6">
            <a 
              href="/" 
              class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                {$page.url.pathname === '/' ? 'bg-purple-100 text-purple-700' : 'hover:bg-white/50'}"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
            
            <a 
              href="/properties" 
              class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                {$page.url.pathname.startsWith('/properties') ? 'bg-purple-100 text-purple-700' : 'hover:bg-white/50'}"
            >
              <Home size={20} />
              <span>Propiedades</span>
            </a>

            <div class="h-6 w-px bg-gray-300"></div>

            <button
              on:click={handleLogout}
              class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-all"
            >
              <LogOut size={20} />
              <span>Salir</span>
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            on:click={toggleMobileMenu}
            class="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
            aria-label="Menú"
            aria-expanded={mobileMenuOpen}
          >
            {#if mobileMenuOpen}
              <X size={24} />
            {:else}
              <Menu size={24} />
            {/if}
          </button>
        </div>

        <!-- Mobile Menu -->
        {#if mobileMenuOpen}
          <div class="md:hidden mt-4 pt-4 border-t border-white/20 space-y-2 animate-fade-in">
            <a 
              href="/" 
              class="flex items-center gap-2 px-4 py-3 rounded-lg transition-all touch-manipulation
                {$page.url.pathname === '/' ? 'bg-purple-100 text-purple-700' : 'hover:bg-white/50 active:bg-white/80'}"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
            
            <a 
              href="/properties" 
              class="flex items-center gap-2 px-4 py-3 rounded-lg transition-all touch-manipulation
                {$page.url.pathname.startsWith('/properties') ? 'bg-purple-100 text-purple-700' : 'hover:bg-white/50 active:bg-white/80'}"
            >
              <Home size={20} />
              <span>Propiedades</span>
            </a>

            <button
              on:click={handleLogout}
              class="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 active:bg-red-100 text-red-600 transition-all touch-manipulation"
            >
              <LogOut size={20} />
              <span>Salir</span>
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
