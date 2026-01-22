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
          {#if active}
            <div class="active-indicator"></div>
          {/if}

          <div class="icon-wrapper" class:gradient-icon={item.id === "select"}>
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
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
  }

  .bottom-nav-container {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
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
    padding: 10px 6px 8px;
    min-height: 60px;
    position: relative;
    transition: all 200ms ease-out;
    -webkit-tap-highlight-color: transparent;
    color: #9ca3af;
  }

  .nav-item:active {
    transform: scale(0.92);
  }

  .nav-item.active {
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
    border-radius: 12px;
  }

  .nav-item.action-btn {
    color: #f97316;
  }

  .active-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 4px;
    background: linear-gradient(90deg, #f97316, #ec4899);
    border-radius: 0 0 4px 4px;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
  }

  .icon-wrapper.gradient-icon {
    background: linear-gradient(135deg, #f97316, #ec4899);
    border-radius: 10px;
    color: white;
    width: 36px;
    height: 36px;
    margin-bottom: -2px;
  }

  .label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .nav-item.active .label {
    font-weight: 700;
  }

  .nav-item.long-press {
    position: relative;
  }

  .nav-item.long-press::after {
    content: "⋯";
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 10px;
    opacity: 0.4;
  }

  /* Hide on desktop */
  @media (min-width: 1024px) {
    .bottom-nav {
      display: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    .bottom-nav-container {
      background: rgba(17, 24, 39, 0.95);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .nav-item {
      color: #6b7280;
    }

    .nav-item.active {
      color: #f97316;
      background: rgba(249, 115, 22, 0.15);
    }

    .nav-item.action-btn {
      color: #f97316;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-item {
      transition: none;
    }
    .nav-item:active {
      transform: none;
    }
  }
</style>
