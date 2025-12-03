<script>
  import { Euro, Calendar, Tag, FileText, Edit, Trash2 } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  
  export let expense;
  export let onEdit = null;
  export let onDelete = null;
  
  $: formattedDate = new Date(expense.date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const categoryColors = {
    'Mantenimiento': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Reparaciones': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Servicios': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Suministros': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Impuestos': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Seguros': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Comunidad': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Limpieza': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Otros': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };
  
  $: categoryColor = categoryColors[expense.category] || categoryColors['Otros'];
</script>

<GlassCard className="relative">
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-2">
        <div class="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
          <Euro size={18} class="text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-gray-800 dark:text-gray-200">
            {expense.amount}€
          </p>
          <span class="inline-block px-2 py-1 rounded-full text-xs font-medium {categoryColor}">
            {expense.category}
          </span>
        </div>
      </div>
      
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
        <div class="flex items-center gap-1">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>
      
      {#if expense.description}
        <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText size={14} class="inline mr-1" />
          {expense.description}
        </div>
      {/if}
    </div>
    
    {#if onEdit || onDelete}
      <div class="flex gap-2">
        {#if onEdit}
          <button
            on:click={() => onEdit(expense)}
            class="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
        {/if}
        {#if onDelete}
          <button
            on:click={() => onDelete(expense)}
            class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={18} />
          </button>
        {/if}
      </div>
    {/if}
  </div>
</GlassCard>





