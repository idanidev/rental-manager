<script>
  import { createEventDispatcher } from 'svelte';
  import { X, Moon, Sun, Bell, Settings, User, LogOut, Search } from 'lucide-svelte';
  import { theme } from '$lib/stores/theme';
  import NotificationBell from '../notifications/NotificationBell.svelte';
  
  export let open = false;
  
  const dispatch = createEventDispatcher();
  
  function close() {
    open = false;
    dispatch('close');
  }
  
  function handleThemeToggle() {
    theme.toggle();
  }
  
  function handleLogout() {
    dispatch('logout');
    close();
  }
  
  function handleSearch() {
    dispatch('search');
    close();
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="dialog"
    aria-modal="true"
    aria-label="Menú"
  >
    <!-- Menu Panel -->
    <div 
      class="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl border-t border-gray-200/50 dark:border-gray-700/50 p-6 max-h-[85vh] overflow-y-auto safe-area-bottom animate-slide-up backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl"
      on:click|stopPropagation
    >
      <!-- Header con handle -->
      <div class="flex flex-col items-center mb-6">
        <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-4"></div>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Menú</h2>
          <button
            on:click={close}
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} class="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      <!-- Menu Items -->
      <div class="space-y-1">
        <!-- Buscar -->
        <button
          on:click={handleSearch}
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 active:bg-gray-200/80 dark:active:bg-gray-700/80 text-gray-700 dark:text-gray-300 transition-all touch-manipulation font-medium"
        >
          <div class="p-2 rounded-xl bg-purple-100/50 dark:bg-purple-900/30">
            <Search size={20} class="text-purple-600 dark:text-purple-400" />
          </div>
          <span>Buscar</span>
        </button>
        
        <!-- Notificaciones -->
        <div class="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 active:bg-gray-200/80 dark:active:bg-gray-700/80 transition-all touch-manipulation">
          <div class="p-2 rounded-xl bg-blue-100/50 dark:bg-blue-900/30">
            <Bell size={20} class="text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1">
            <span class="text-gray-700 dark:text-gray-300 font-medium">Notificaciones</span>
          </div>
          <NotificationBell />
        </div>
        
        <div class="h-px bg-gray-200/50 dark:bg-gray-700/50 my-3"></div>
        
        <!-- Tema -->
        <button
          on:click={handleThemeToggle}
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 active:bg-gray-200/80 dark:active:bg-gray-700/80 text-gray-700 dark:text-gray-300 transition-all touch-manipulation font-medium"
        >
          <div class="p-2 rounded-xl bg-yellow-100/50 dark:bg-yellow-900/30">
            {#if $theme === 'dark'}
              <Sun size={20} class="text-yellow-600 dark:text-yellow-400" />
            {:else}
              <Moon size={20} class="text-yellow-600 dark:text-yellow-400" />
            {/if}
          </div>
          <span>{$theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
        
        <div class="h-px bg-gray-200/50 dark:bg-gray-700/50 my-3"></div>
        
        <!-- Perfil (placeholder) -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-500"
          disabled
        >
          <div class="p-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/30">
            <User size={20} class="text-gray-400 dark:text-gray-600" />
          </div>
          <span>Perfil</span>
          <span class="ml-auto text-xs text-gray-400 dark:text-gray-600">Próximamente</span>
        </button>
        
        <!-- Configuración (placeholder) -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-500"
          disabled
        >
          <div class="p-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/30">
            <Settings size={20} class="text-gray-400 dark:text-gray-600" />
          </div>
          <span>Configuración</span>
          <span class="ml-auto text-xs text-gray-400 dark:text-gray-600">Próximamente</span>
        </button>
        
        <div class="h-px bg-gray-200/50 dark:bg-gray-700/50 my-3"></div>
        
        <!-- Cerrar sesión -->
        <button
          on:click={handleLogout}
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 text-red-600 dark:text-red-400 transition-all touch-manipulation font-medium"
        >
          <div class="p-2 rounded-xl bg-red-100/50 dark:bg-red-900/30">
            <LogOut size={20} class="text-red-600 dark:text-red-400" />
          </div>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  :global(.safe-area-bottom) {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
</style>

