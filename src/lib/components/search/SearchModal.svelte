<script>
  import { onMount, onDestroy } from 'svelte';
  import { Search, Home, DoorOpen, User, Building2, X } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { searchService } from '$lib/services/search';
  import { goto } from '$app/navigation';
  
  export let open = false;
  
  let query = '';
  let results = { properties: [], rooms: [], tenants: [] };
  let loading = false;
  let selectedIndex = -1;
  let searchTimeout;
  
  $: allResults = [
    ...results.properties.map(p => ({ type: 'property', data: p })),
    ...results.rooms.map(r => ({ type: 'room', data: r })),
    ...results.tenants.map(t => ({ type: 'tenant', data: t }))
  ];
  
  $: totalResults = allResults.length;
  
  // Keyboard shortcut: Cmd+K / Ctrl+K
  function handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
    }
    
    if (e.key === 'Escape' && open) {
      close();
    }
  }
  
  // Keyboard navigation dentro del modal
  function handleKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, totalResults - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectResult(allResults[selectedIndex]);
    }
  }
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeydown);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleGlobalKeydown);
      }
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  });
  
  async function performSearch() {
    if (!$userStore || query.trim().length < 2) {
      results = { properties: [], rooms: [], tenants: [] };
      return;
    }
    
    loading = true;
    try {
      results = await searchService.globalSearch($userStore.id, query);
      selectedIndex = -1;
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      loading = false;
    }
  }
  
  function onInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  }
  
  function selectResult(result) {
    const { type, data } = result;
    
    switch (type) {
      case 'property':
        goto(`/properties/${data.id}`);
        break;
      case 'room':
        goto(`/properties/${data.propertyId}`);
        break;
      case 'tenant':
        goto(`/properties/${data.propertyId}/tenants`);
        break;
    }
    
    close();
  }
  
  function close() {
    open = false;
    query = '';
    results = { properties: [], rooms: [], tenants: [] };
    selectedIndex = -1;
  }
  
  function getIcon(type) {
    switch (type) {
      case 'property': return Building2;
      case 'room': return DoorOpen;
      case 'tenant': return User;
    }
  }
  
  function getLabel(result) {
    if (!result || !result.data) return '';
    const { type, data } = result;
    
    switch (type) {
      case 'property':
        return `${data?.name || 'Sin nombre'} • ${data?.city || 'Sin ciudad'}`;
      case 'room':
        return `${data?.name || 'Sin nombre'} • ${data?.propertyName || 'Sin propiedad'}`;
      case 'tenant':
        return `${data?.full_name || 'Sin nombre'} • ${data?.propertyName || 'Sin propiedad'}`;
      default:
        return '';
    }
  }
  
  function getSubLabel(result) {
    if (!result || !result.data) return '';
    const { type, data } = result;
    
    switch (type) {
      case 'property':
        return data?.address || '';
      case 'room':
        return `${data?.monthly_rent || 0}€/mes ${data?.occupied ? '• Ocupada' : '• Disponible'}`;
      case 'tenant':
        return data?.email || data?.phone || '';
      default:
        return '';
    }
  }
</script>

{#if open}
  <div 
    class="modal-backdrop"
    on:click={close}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div 
      class="search-modal"
      on:click={(e) => e.stopPropagation()}
    >
      <!-- Search Input -->
      <div class="search-header">
        <Search size={20} class="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          bind:value={query}
          on:input={onInput}
          placeholder="Buscar propiedades, habitaciones o inquilinos..."
          class="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400"
          autofocus
        />
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
        {/if}
        <button
          on:click={close}
          class="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={18} class="text-gray-500" />
        </button>
      </div>

      <!-- Results -->
      <div class="search-results">
        {#if query.trim().length < 2}
          <div class="search-hint">
            <Search size={32} class="text-gray-300 mb-2" />
            <p class="text-sm text-gray-500">Escribe al menos 2 caracteres para buscar</p>
            <p class="text-xs text-gray-400 mt-2">
              <kbd>↑</kbd> <kbd>↓</kbd> para navegar • <kbd>Enter</kbd> para seleccionar • <kbd>Esc</kbd> para cerrar
            </p>
          </div>
        {:else if totalResults === 0 && !loading}
          <div class="search-hint">
            <Search size={32} class="text-gray-300 mb-2" />
            <p class="text-sm text-gray-500">No se encontraron resultados</p>
            <p class="text-xs text-gray-400 mt-1">Intenta con otros términos</p>
          </div>
        {:else}
          {#each allResults as result, i}
            {@const Icon = getIcon(result.type)}
            <button
              on:click={() => selectResult(result)}
              class="search-result-item {i === selectedIndex ? 'selected' : ''}"
              on:mouseenter={() => selectedIndex = i}
            >
              <div class="p-2 rounded-lg
                {result.type === 'property' ? 'bg-orange-100' :
                 result.type === 'room' ? 'bg-blue-100' : 'bg-green-100'}">
                <Icon size={18} class="
                  {result.type === 'property' ? 'text-orange-600' :
                   result.type === 'room' ? 'text-blue-600' : 'text-green-600'}" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 truncate">{getLabel(result)}</p>
                <p class="text-xs text-gray-500 truncate">{getSubLabel(result)}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full font-medium
                {result.type === 'property' ? 'bg-orange-50 text-orange-600' :
                 result.type === 'room' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}">
                {result.type === 'property' ? 'Propiedad' :
                 result.type === 'room' ? 'Habitación' : 'Inquilino'}
              </span>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="search-footer">
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1">
            <kbd>⌘</kbd><kbd>K</kbd> o <kbd>Ctrl</kbd><kbd>K</kbd> para abrir
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.search-modal) {
    width: 100%;
    max-width: 640px;
    max-height: 480px;
    margin: 10vh auto 0;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 24px;
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.05),
      0 10px 20px rgba(0, 0, 0, 0.1),
      0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  :root[data-theme="dark"] :global(.search-modal) {
    background: rgba(30, 41, 59, 0.98);
    border-color: rgba(100, 116, 139, 0.3);
  }
  
  .search-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  }
  
  :root[data-theme="dark"] .search-header {
    border-bottom-color: rgba(100, 116, 139, 0.3);
  }
  
  :root[data-theme="dark"] .search-header input {
    color: #f1f5f9;
  }
  
  .search-results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  
  .search-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }
  
  .search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    transition: all 0.15s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }
  
  .search-result-item:hover,
  .search-result-item.selected {
    background: rgba(139, 92, 246, 0.08);
  }
  
  :root[data-theme="dark"] .search-result-item:hover,
  :root[data-theme="dark"] .search-result-item.selected {
    background: rgba(139, 92, 246, 0.15);
  }
  
  .search-footer {
    padding: 12px 24px;
    border-top: 1px solid rgba(203, 213, 225, 0.3);
  }
  
  :root[data-theme="dark"] .search-footer {
    border-top-color: rgba(100, 116, 139, 0.3);
  }
  
  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-family: ui-monospace, monospace;
  }
  
  :root[data-theme="dark"] kbd {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #cbd5e1;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

