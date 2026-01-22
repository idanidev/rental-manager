<script>
  import {
    propertiesStore,
    selectedPropertyId,
    selectedProperty,
  } from "$lib/stores/properties";
  import { Plus, Check, X } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function selectProperty(propertyId) {
    selectedPropertyId.select(propertyId);
    close();

    // Si estamos en una página de propiedad, navegar a la nueva propiedad
    const currentPath = $page.url.pathname;
    const currentTab = $page.url.searchParams.get("tab");

    if (currentPath.includes("/properties/")) {
      // Navegar a la misma pestaña pero con la nueva propiedad
      const tabParam = currentTab ? `?tab=${currentTab}` : "";
      goto(`/properties/${propertyId}${tabParam}`);
    }
  }

  function close() {
    isOpen = false;
    dispatch("close");
  }

  function openNewPropertyModal() {
    close();
    window.dispatchEvent(new CustomEvent("open-new-property"));
  }

  function goToGlobalSummary() {
    vibrate([5]);
    selectedPropertyId.clear();
    close();
    goto("/", { replaceState: false });
  }

  // Vibración háptica si está disponible
  function vibrate(pattern = [10]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <button
    class="sheet-backdrop"
    on:click={close}
    transition:fade={{ duration: 200 }}
    aria-label="Cerrar selector"
  ></button>

  <!-- Bottom Sheet -->
  <div class="property-sheet" transition:fly={{ y: 500, duration: 300 }}>
    <!-- Handle bar -->
    <div class="sheet-handle-container">
      <div class="sheet-handle"></div>
    </div>

    <!-- Header -->
    <div class="sheet-header">
      <h2 class="sheet-title">Tus Propiedades</h2>
      <div class="flex items-center gap-2">
        <button
          on:click={goToGlobalSummary}
          class="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg"
        >
          Ver Resumen
        </button>
        <button on:click={close} class="close-btn" aria-label="Cerrar">
          <X size={24} />
        </button>
      </div>
    </div>

    <!-- Properties List -->
    <div class="properties-list">
      {#if $propertiesStore.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🏠</div>
          <p class="empty-text">No tienes propiedades aún</p>
          <button on:click={openNewPropertyModal} class="create-btn">
            <Plus size={20} />
            <span>Crear primera propiedad</span>
          </button>
        </div>
      {:else}
        {#each $propertiesStore as property (property.id)}
          {@const isSelected = $selectedPropertyId === property.id}
          <button
            on:click={() => {
              vibrate([5]);
              selectProperty(property.id);
            }}
            class="property-item"
            class:selected={isSelected}
          >
            <div class="property-icon">🏠</div>
            <div class="property-content">
              <h3 class="property-name">{property.name}</h3>
              <p class="property-meta">
                {property.rooms?.length || 0} habitaciones
                {#if property.address}
                  • {property.address.split(",")[0]}
                {/if}
              </p>
            </div>
            {#if isSelected}
              <div class="selected-check">
                <Check size={20} />
              </div>
            {/if}
          </button>
        {/each}

        <!-- New Property Button -->
        <button
          on:click={openNewPropertyModal}
          class="property-item new-property"
        >
          <div class="property-icon new">
            <Plus size={24} />
          </div>
          <div class="property-content">
            <h3 class="property-name">Nueva Propiedad</h3>
            <p class="property-meta">Añadir una nueva propiedad</p>
          </div>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9998;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .property-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 24px 24px 0 0;
    z-index: 9999;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  }

  /* Desktop: centrar y limitar ancho */
  @media (min-width: 640px) {
    .property-sheet {
      left: 50%;
      transform: translateX(-50%);
      max-width: 500px;
      border-radius: 24px;
      bottom: 20px;
    }
  }

  .sheet-handle-container {
    padding: 12px 0 8px;
    display: flex;
    justify-content: center;
  }

  .sheet-handle {
    width: 40px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .sheet-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:active {
    transform: scale(0.9);
    background: #e5e7eb;
  }

  .properties-list {
    overflow-y: auto;
    flex: 1;
    padding: 16px 20px 32px;
    -webkit-overflow-scrolling: touch;
  }

  .property-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px;
    background: #f9fafb;
    border: 2px solid transparent;
    border-radius: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .property-item:active {
    transform: scale(0.97);
  }

  .property-item.selected {
    background: rgba(249, 115, 22, 0.1);
    border-color: #f97316;
  }

  .property-item.new-property {
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: white;
  }

  .property-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
  }

  .property-icon.new {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .property-content {
    flex: 1;
    min-width: 0;
  }

  .property-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .new-property .property-name,
  .new-property .property-meta {
    color: white;
  }

  .property-meta {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .selected-check {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f97316;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 16px;
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .create-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .create-btn:active {
    transform: scale(0.95);
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .property-sheet {
      background: #111827;
      border-top: 1px solid #374151;
    }

    .sheet-handle {
      background: #6b7280;
    }

    .sheet-header {
      border-bottom-color: #374151;
    }

    .sheet-title {
      color: #f9fafb;
    }

    .close-btn {
      background: #1f2937;
      color: #d1d5db;
    }

    .close-btn:active {
      background: #374151;
    }

    .property-item {
      background: #1f2937;
      border-color: #374151;
    }

    .property-item:hover {
      background: #374151;
    }

    .property-item.selected {
      background: rgba(249, 115, 22, 0.2);
      border-color: #f97316;
    }

    .property-icon {
      background: #111827;
    }

    .property-name {
      color: #f9fafb;
    }

    .property-meta {
      color: #d1d5db;
    }

    .empty-text {
      color: #d1d5db;
    }
  }
</style>
