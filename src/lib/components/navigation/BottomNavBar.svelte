<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { LayoutDashboard, Home, BarChart3, Bell, Menu } from 'lucide-svelte';
  
  export let showMenuButton = false;
  export let onMenuClick = () => {};
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      key: 'dashboard'
    },
    {
      label: 'Propiedades',
      icon: Home,
      path: '/properties',
      key: 'properties'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      key: 'analytics'
    }
  ];
  
  function isActive(path, key) {
    if (key === 'dashboard') {
      return $page.url.pathname === '/';
    }
    if (key === 'properties') {
      return $page.url.pathname.startsWith('/properties');
    }
    if (key === 'analytics') {
      return $page.url.pathname === '/analytics';
    }
    return $page.url.pathname === path;
  }
  
  function handleClick(item, e) {
    e.preventDefault();
    goto(item.path);
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden">
  <div class="glass-card border-t border-gray-200/50 dark:border-gray-700/50 m-0 rounded-none backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
    <div class="flex items-center justify-around px-1 py-1.5 safe-area-bottom">
      {#each navItems as item (item.key)}
        {@const Icon = item.icon}
        {@const active = isActive(item.path, item.key)}
        <a
          href={item.path}
          on:click={(e) => handleClick(item, e)}
          class="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 flex-1 min-w-0 rounded-xl transition-all duration-200 touch-manipulation relative
            {active 
              ? 'text-orange-600 dark:text-orange-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:scale-95'}"
          aria-label={item.label}
        >
          <div class="relative">
            <Icon size={22} stroke-width={active ? 2.5 : 2} />
            {#if active}
              <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
            {/if}
          </div>
          <span class="text-[10px] font-semibold leading-tight mt-0.5 truncate w-full text-center">{item.label}</span>
        </a>
      {/each}
      
      {#if showMenuButton}
        <button
          on:click={onMenuClick}
          class="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 flex-1 min-w-0 rounded-xl transition-all duration-200 touch-manipulation text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:scale-95"
          aria-label="Menú"
        >
          <Menu size={22} stroke-width={2} />
          <span class="text-[10px] font-semibold leading-tight mt-0.5">Más</span>
        </button>
      {/if}
    </div>
  </div>
</nav>

<style>
  :global(.safe-area-bottom) {
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0));
  }
  
  @media (min-width: 768px) {
    nav {
      display: none;
    }
  }
</style>

