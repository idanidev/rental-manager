<script>
  import { Plus, Trash2, Package } from "lucide-svelte";
  import Button from "../ui/Button.svelte";

  export let inventory = [];

  // Items predefinidos comunes
  const commonItems = [
    "Cama",
    "Colchón",
    "Almohada",
    "Armario",
    "Escritorio",
    "Silla",
    "Mesita de noche",
    "Lámpara",
    "Televisión",
    "Regleta",
    "Perchas",
    "Espejo",
    "Cortinas",
    "Ropa de cama",
    "Aire acondicionado",
    "Calefacción",
    "Ventilador",
    "Papelera",
    "Cerradura con llave",
    "Wi-Fi",
  ];

  function addItem(itemName = "") {
    inventory = [
      ...inventory,
      {
        id: Date.now(),
        name: itemName,
        quantity: 1,
        condition: "bueno",
        notes: "",
      },
    ];
  }

  function removeItem(id) {
    inventory = inventory.filter((item) => item.id !== id);
  }

  function addCommonItem(itemName) {
    const exists = inventory.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    );
    if (!exists) {
      addItem(itemName);
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3
      class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"
    >
      <Package size={20} class="text-orange-600" />
      Inventario de la Habitación
    </h3>
    <Button variant="secondary" on:click={() => addItem()} className="text-sm">
      <Plus size={16} class="inline mr-1" />
      Añadir Item
    </Button>
  </div>

  <!-- Items comunes para añadir rápidamente -->
  <div
    class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
  >
    <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
      Items comunes (click para añadir):
    </p>
    <div class="flex flex-wrap gap-2">
      {#each commonItems as item}
        <button
          type="button"
          on:click={() => addCommonItem(item)}
          class="px-3 py-1 bg-white dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
        >
          + {item}
        </button>
      {/each}
    </div>
  </div>

  <!-- Lista de items del inventario -->
  {#if inventory.length > 0}
    <div class="space-y-3">
      {#each inventory as item, index (item.id)}
        <div class="glass-card p-4">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <!-- Nombre -->
            <div class="md:col-span-4">
              <label
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Item *
              </label>
              <input
                type="text"
                bind:value={item.name}
                placeholder="Nombre del item"
                class="input-glass text-sm"
                required
              />
            </div>

            <!-- Cantidad -->
            <div class="md:col-span-2">
              <label
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Cantidad
              </label>
              <input
                type="number"
                bind:value={item.quantity}
                min="1"
                class="input-glass text-sm"
              />
            </div>

            <!-- Estado -->
            <div class="md:col-span-2">
              <label
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Estado
              </label>
              <select bind:value={item.condition} class="input-glass text-sm">
                <option value="nuevo">Nuevo</option>
                <option value="bueno">Bueno</option>
                <option value="usado">Usado</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
              </select>
            </div>

            <!-- Notas -->
            <div class="md:col-span-3">
              <label
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Notas
              </label>
              <input
                type="text"
                bind:value={item.notes}
                placeholder="Ej: Color negro, marca Samsung..."
                class="input-glass text-sm"
              />
            </div>

            <!-- Eliminar -->
            <div class="md:col-span-1 flex items-end">
              <Button
                variant="ghost"
                className="p-2 text-red-600 hover:bg-red-50 w-full md:w-auto"
                on:click={() => removeItem(item.id)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 glass-card">
      <Package size={40} class="mx-auto text-gray-400 mb-2" />
      <p class="text-gray-600 text-sm">
        No hay items en el inventario. Añade items para documentar lo que se
        entrega con la habitación.
      </p>
    </div>
  {/if}

  <!-- Resumen -->
  {#if inventory.length > 0}
    <div
      class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4"
    >
      <p class="text-sm font-medium text-orange-800 dark:text-orange-300">
        📦 Total items: <strong>{inventory.length}</strong>
        ({inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)} unidades)
      </p>
    </div>
  {/if}
</div>
