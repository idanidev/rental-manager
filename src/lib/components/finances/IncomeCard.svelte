<script>
  import { Euro, Calendar, DoorOpen, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-svelte';
  import GlassCard from '../ui/GlassCard.svelte';
  
  export let income;
  export let onEdit = null;
  export let onDelete = null;
  export let onTogglePaid = null;
  
  $: formattedMonth = new Date(income.month + '-01').toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });
  
  $: formattedPaymentDate = income.payment_date 
    ? new Date(income.payment_date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : null;
</script>

<GlassCard className="relative">
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-2">
        <div class="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
          <Euro size={18} class="text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-gray-800 dark:text-gray-200">
            {income.amount}€
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {income.paid 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}">
              {#if income.paid}
                <CheckCircle size={12} />
                Pagado
              {:else}
                <XCircle size={12} />
                Pendiente
              {/if}
            </span>
          </div>
        </div>
      </div>
      
      <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
        <div class="flex items-center gap-1">
          <DoorOpen size={14} />
          <span>{income.room?.name || 'Habitación'}</span>
        </div>
        <div class="flex items-center gap-1">
          <Calendar size={14} />
          <span>{formattedMonth}</span>
        </div>
        {#if income.paid && formattedPaymentDate}
          <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle size={14} />
            <span>Pagado el {formattedPaymentDate}</span>
          </div>
        {/if}
      </div>
      
      {#if income.notes}
        <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {income.notes}
        </div>
      {/if}
    </div>
    
    {#if onEdit || onDelete || onTogglePaid}
      <div class="flex flex-col gap-2">
        {#if onTogglePaid}
          <button
            on:click={() => onTogglePaid(income)}
            class="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 {income.paid 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-yellow-600 dark:text-yellow-400'} rounded-lg transition-colors"
            title={income.paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
          >
            {#if income.paid}
              <XCircle size={18} />
            {:else}
              <CheckCircle size={18} />
            {/if}
          </button>
        {/if}
        {#if onEdit}
          <button
            on:click={() => onEdit(income)}
            class="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
        {/if}
        {#if onDelete}
          <button
            on:click={() => onDelete(income)}
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


