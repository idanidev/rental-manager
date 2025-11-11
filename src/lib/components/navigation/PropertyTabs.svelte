<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DoorOpen, Users, Receipt, BarChart3, Home } from 'lucide-svelte';
  
  export let propertyId = '';
  export let propertyName = '';
  
  const tabs = [
    {
      key: 'overview',
      label: 'Resumen',
      icon: Home,
      path: (id) => `/properties/${id}`
    },
    {
      key: 'rooms',
      label: 'Habitaciones',
      icon: DoorOpen,
      path: (id) => `/properties/${id}/rooms`
    },
    {
      key: 'tenants',
      label: 'Inquilinos',
      icon: Users,
      path: (id) => `/properties/${id}/tenants`
    },
    {
      key: 'expenses',
      label: 'Gastos',
      icon: Receipt,
      path: (id) => `/properties/${id}/expenses`
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: (id) => `/properties/${id}/analytics`
    }
  ];
  
  $: currentPath = $page.url.pathname;
  $: activeTab = getActiveTab(currentPath);
  
  function getActiveTab(path) {
    if (path.endsWith('/rooms')) return 'rooms';
    if (path.endsWith('/tenants')) return 'tenants';
    if (path.endsWith('/expenses')) return 'expenses';
    if (path.endsWith('/analytics')) return 'analytics';
    return 'overview';
  }
  
  function handleTabClick(tab, e) {
    e.preventDefault();
    const path = tab.path(propertyId);
    if (currentPath !== path) {
      goto(path);
    }
  }
</script>

<div class="glass-card p-1 mb-6">
  <nav class="flex gap-1 overflow-x-auto" role="tablist">
    {#each tabs as tab (tab.key)}
      {@const Icon = tab.icon}
      {@const isActive = activeTab === tab.key}
      <a
        href={tab.path(propertyId)}
        on:click={(e) => handleTabClick(tab, e)}
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap touch-manipulation
          {isActive 
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-400 font-semibold shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}"
        role="tab"
        aria-selected={isActive}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={18} stroke-width={isActive ? 2.5 : 2} />
        <span class="text-sm font-medium">{tab.label}</span>
      </a>
    {/each}
  </nav>
</div>

<style>
  nav {
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
  }
  
  nav::-webkit-scrollbar {
    height: 4px;
  }
  
  nav::-webkit-scrollbar-track {
    background: transparent;
  }
  
  nav::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
  }
  
  nav::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
  }
</style>

