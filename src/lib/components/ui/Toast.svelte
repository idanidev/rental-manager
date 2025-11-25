<script>
  import { toast } from '$lib/stores/toast';
  import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };
  
  const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-rose-500',
    info: 'from-blue-500 to-cyan-500',
    warning: 'from-yellow-500 to-orange-500'
  };
  
  function removeToast(id) {
    toast.update(toasts => toasts.filter(t => t.id !== id));
  }
</script>

<div class="fixed top-4 right-4 z-[100000] space-y-2 pointer-events-none">
  {#each $toast as item (item.id)}
    <div
      in:fly={{ x: 300, duration: 300 }}
      out:fly={{ x: 300, duration: 200 }}
      class="pointer-events-auto"
    >
      <div class="glass-card flex items-center gap-3 pr-3 min-w-[300px] max-w-md shadow-2xl">
        <div class="p-3 bg-gradient-to-br {colors[item.type]} rounded-2xl">
          <svelte:component this={icons[item.type]} size={20} class="text-white" />
        </div>
        <p class="text-sm font-medium text-gray-800 flex-1">{item.message}</p>
        <button
          on:click={() => removeToast(item.id)}
          class="p-1 hover:bg-white/80 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X size={16} class="text-gray-500" />
        </button>
      </div>
    </div>
  {/each}
</div>

