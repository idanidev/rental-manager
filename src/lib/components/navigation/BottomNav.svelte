<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    Home,
    Plus,
    Menu,
    DoorOpen,
    Users,
    TrendingUp,
    Building2,
  } from "lucide-svelte";
  import { selectedPropertyId, selectedProperty } from "$lib/stores/properties";
  import PropertySelectorSheet from "./PropertySelectorSheet.svelte";

  /** @type {'rooms' | 'tenants' | 'finances' | null} */
  export let activePropertyTab = null;

  let showPropertySheet = false;

  $: currentPath = $page.url.pathname;
  $: propertyMatch = currentPath.match(/\/properties\/([^\/]+)/);
  $: propertyId = propertyMatch ? propertyMatch[1] : null;
  $: isInProperty = !!propertyId;
  $: urlTab = $page.url.searchParams.get("tab");

  // Determinar tab activo dentro de propiedad
  $: currentPropertyTab = urlTab || activePropertyTab || "rooms";

  // Usar la propiedad seleccionada del store global
  $: hasSelectedProperty = !!$selectedPropertyId;

  // Vibración háptica
  function vibrate(pattern = [10]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  function handleHomeClick(e) {
    vibrate([5]);
    // Si ya estamos en el dashboard, abrir selector de propiedades
    // Si estamos en otra página, ir al dashboard
    if (currentPath === "/") {
      showPropertySheet = true;
    } else {
      goto("/");
    }
  }

  // Computed label for home button
  $: homeLabel = $selectedProperty
    ? $selectedProperty.name.substring(0, 8)
    : "Inicio";

  // Items para Dashboard (sin propiedad seleccionada) - declarar como reactivo
  $: dashboardItems = [
    {
      id: "home",
      label: homeLabel,
      icon: Home,
      action: handleHomeClick,
    },
    {
      id: "select",
      label: "Propied.",
      icon: Building2,
      action: () => {
        vibrate([5]);
        showPropertySheet = true;
      },
    },
    { id: "more", label: "Más", icon: Menu, action: () => goto("/more") },
  ];

  // Items para cuando hay propiedad seleccionada
  $: propertyItems = [
    {
      id: "home",
      label: homeLabel,
      icon: Home,
      action: handleHomeClick,
    },
    {
      id: "rooms",
      label: "Habit.",
      icon: DoorOpen,
      action: () =>
        goto(`/properties/${$selectedPropertyId}`, {
          replaceState: false,
          noScroll: false,
        }),
    },
    {
      id: "tenants",
      label: "Inquil.",
      icon: Users,
      action: () =>
        goto(`/properties/${$selectedPropertyId}?tab=tenants`, {
          replaceState: false,
          noScroll: false,
        }),
    },
    {
      id: "finances",
      label: "Finanzas",
      icon: TrendingUp,
      action: () =>
        goto(`/properties/${$selectedPropertyId}?tab=finances`, {
          replaceState: false,
          noScroll: false,
        }),
    },
    { id: "more", label: "Más", icon: Menu, action: () => goto("/more") },
  ];

  // Mostrar items de propiedad solo si hay una seleccionada
  $: navItems = hasSelectedProperty ? propertyItems : dashboardItems;

  /**
   * @param {{ id: string }} item
   */
  function isActive(item) {
    // Inicio y Más - simple path check
    if (item.id === "home" && currentPath === "/") return true;
    if (item.id === "more" && currentPath === "/more") return true;
    if (item.id === "select") return false; // Never active, it's an action

    // Si estamos dentro de una propiedad
    if (isInProperty) {
      // Usar currentPropertyTab que ya tiene la lógica de urlTab
      if (item.id === "rooms" && currentPropertyTab === "rooms") return true;
      if (item.id === "tenants" && currentPropertyTab === "tenants")
        return true;
      if (item.id === "finances" && currentPropertyTab === "finances")
        return true;
    }

    return false;
  }

  $: shouldHideNav =
    currentPath.includes("/login") ||
    currentPath.includes("/register") ||
    currentPath.includes("/onboarding");
</script>

{#if !shouldHideNav}
  <nav class="bottom-nav">
    <div class="bottom-nav-container">
      {#each navItems as item (item.id)}
        {@const Icon = item.icon}
        {@const active =
          (item.id === "home" && currentPath === "/") ||
          (item.id === "more" && currentPath === "/more") ||
          (isInProperty &&
            item.id === "rooms" &&
            (!urlTab || urlTab === "rooms")) ||
          (isInProperty && item.id === "tenants" && urlTab === "tenants") ||
          (isInProperty && item.id === "finances" && urlTab === "finances")}

        <button
          on:click={item.action}
          class="nav-item"
          class:active
          class:action-btn={item.id === "select"}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
        >
          <div class="icon-container" class:active>
            <div
              class="icon-wrapper"
              class:gradient-icon={item.id === "select"}
            >
              <Icon
                size={item.id === "select" ? 22 : 24}
                strokeWidth={active ? 2.5 : 2}
              />
            </div>
          </div>

          <span class="label">{item.label}</span>
        </button>
      {/each}
    </div>
  </nav>

  <!-- Property Selector Sheet -->
  <PropertySelectorSheet bind:isOpen={showPropertySheet} />
{/if}

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
    background: rgba(255, 255, 255, 0.85); /* Slightly more transparent base */
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.04);
  }

  .bottom-nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 64px;
    padding: 0 16px;
    max-width: 600px;
    margin: 0 auto;
  }

  .nav-item {
    appearance: none;
    border: none;
    background: none;
    cursor: pointer;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 100%;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    color: #94a3b8; /* Slate-400 */
    transition: color 0.2s ease;
  }

  .nav-item:active {
    transform: scale(0.96);
  }

  /* Icon Container (The Pill) */
  .icon-container {
    position: relative;
    padding: 4px 16px;
    border-radius: 20px;
    transition: all 0.3s cubic-bezier(0.2, 0, 0.2, 1);
  }

  .icon-container.active {
    background-color: rgba(
      249,
      115,
      22,
      0.15
    ); /* Orange-500 optimized opacity */
    color: #f97316; /* Orange-500 */
  }

  /* Active Label Color */
  .nav-item.active .label {
    color: #f97316;
    font-weight: 600;
  }

  /* Special Action Button (Select Property) */
  .nav-item.action-btn .icon-wrapper.gradient-icon {
    background: linear-gradient(135deg, #f97316, #ec4899);
    border-radius: 12px;
    color: white;
    width: 40px;
    height: 40px;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    transition: transform 0.2s;
  }

  .nav-item.action-btn:active .icon-wrapper.gradient-icon {
    transform: scale(0.95);
    box-shadow: 0 2px 6px rgba(249, 115, 22, 0.2);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .label {
    font-size: 0.7rem; /* 11px derived */
    font-weight: 500;
    letter-spacing: 0.01em;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    transition: color 0.2s ease;
  }

  /* Hide on desktop */
  @media (min-width: 1024px) {
    .bottom-nav {
      display: none;
    }
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .bottom-nav {
      background: rgba(15, 23, 42, 0.85); /* Slate-900 base */
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
    }

    .nav-item {
      color: #64748b; /* Slate-500 */
    }

    .icon-container.active {
      background-color: rgba(249, 115, 22, 0.2);
      color: #fb923c; /* Orange-400 */
    }

    .nav-item.active .label {
      color: #fb923c;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-item,
    .icon-container {
      transition: none;
    }
    .nav-item:active {
      transform: none;
    }
  }
</style>
