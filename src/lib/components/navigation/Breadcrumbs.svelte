<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ChevronRight, Home } from 'lucide-svelte';
  
  export let propertyName = '';
  
  $: breadcrumbs = getBreadcrumbs($page.url.pathname, propertyName);
  
  function getBreadcrumbs(pathname, propName = '') {
    const parts = pathname.split('/').filter(p => p);
    const crumbs = [];
    
    // Solo mostrar breadcrumbs si no estamos en el dashboard
    if (parts.length === 0) {
      return [];
    }
    
    // Dashboard solo si estamos en otra página
    if (parts[0] !== '') {
      crumbs.push({ label: 'Dashboard', path: '/', icon: Home });
    }
    
    if (parts[0] === 'properties') {
      crumbs.push({ label: 'Propiedades', path: '/properties' });
      
      if (parts.length >= 2) {
        // Si tenemos el nombre de la propiedad, lo usamos, si no, mostramos "Propiedad"
        const name = propName || 'Propiedad';
        crumbs.push({ 
          label: name, 
          path: `/properties/${parts[1]}`,
          isProperty: true
        });
      }
      
      if (parts[2] === 'rooms') {
        crumbs.push({ label: 'Habitaciones', path: null });
      } else if (parts[2] === 'tenants') {
        crumbs.push({ label: 'Inquilinos', path: null });
      } else if (parts[2] === 'expenses') {
        crumbs.push({ label: 'Gastos e Ingresos', path: null });
      } else if (parts[2] === 'analytics') {
        crumbs.push({ label: 'Analytics', path: null });
      }
    } else if (parts[0] === 'analytics') {
      crumbs.push({ label: 'Analytics', path: '/analytics' });
    }
    
    return crumbs;
  }
  
  function handleClick(crumb, e) {
    if (crumb.path) {
      e.preventDefault();
      goto(crumb.path);
    }
  }
</script>

{#if breadcrumbs.length > 1}
  <nav class="flex items-center gap-2 text-sm mb-4 flex-wrap" aria-label="Breadcrumb">
    {#each breadcrumbs as crumb, index (index)}
      {#if index > 0}
        <ChevronRight size={16} class="text-gray-400 flex-shrink-0" />
      {/if}
      {#if crumb.path && index < breadcrumbs.length - 1}
        <a
          href={crumb.path}
          on:click={(e) => handleClick(crumb, e)}
          class="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
        >
          {#if crumb.icon}
            <crumb.icon size={16} />
          {/if}
          <span>{crumb.label}</span>
        </a>
      {:else}
        <span class="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
          {#if crumb.icon && index === 0}
            <crumb.icon size={16} />
          {/if}
          <span>{crumb.label}</span>
        </span>
      {/if}
    {/each}
  </nav>
{/if}

