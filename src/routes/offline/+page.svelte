<script>
  import { onMount } from "svelte";
  import { WifiOff, RefreshCw, Home } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import GlassCard from "$lib/components/ui/GlassCard.svelte";

  let retrying = false;
  let online = true;

  onMount(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    online = navigator.onLine;

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  function handleOnline() {
    online = true;
    setTimeout(() => window.location.reload(), 500);
  }

  function handleOffline() {
    online = false;
  }

  async function retry() {
    retrying = true;

    try {
      const response = await fetch("/", { cache: "no-store" });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.log("Still offline");
    } finally {
      setTimeout(() => (retrying = false), 1000);
    }
  }

  function goOfflineHome() {
    window.location.href = "/";
  }
</script>

<svelte:head>
  <title>Sin Conexión - Rental Manager</title>
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-pink-50"
>
  <div class="max-w-md w-full text-center">
    <!-- Icon -->
    <div class="mb-8 relative inline-block">
      <div
        class="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse"
      ></div>
      <GlassCard padding="lg" className="relative rounded-3xl">
        <WifiOff size={64} class="text-orange-500 mx-auto" />
      </GlassCard>
    </div>

    <!-- Title -->
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Sin Conexión</h1>

    <!-- Message -->
    <p class="text-gray-600 mb-8">
      {#if online}
        Parece que recuperaste la conexión. Reintentando...
      {:else}
        No pudimos conectarnos a internet. Verifica tu conexión y vuelve a
        intentarlo.
      {/if}
    </p>

    <!-- Status -->
    <GlassCard className="mb-8">
      <div class="flex items-center justify-center gap-3">
        <div
          class="w-3 h-3 rounded-full"
          class:bg-green-500={online}
          class:animate-pulse={online}
          class:bg-red-500={!online}
        ></div>
        <span class="text-sm font-medium text-gray-700">
          {online ? "Conectado" : "Desconectado"}
        </span>
      </div>
    </GlassCard>

    <!-- Actions -->
    <div class="space-y-3">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={retrying}
        icon={RefreshCw}
        on:click={retry}
      >
        {retrying ? "Reintentando..." : "Reintentar"}
      </Button>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        icon={Home}
        on:click={goOfflineHome}
      >
        Ver Contenido en Caché
      </Button>
    </div>

    <!-- Additional Info -->
    <GlassCard className="mt-8 text-left bg-blue-50/50">
      <p class="text-sm text-blue-900 font-medium mb-2">
        💡 Funciones disponibles sin conexión:
      </p>
      <ul class="text-xs text-blue-800 space-y-1">
        <li>• Ver propiedades y habitaciones en caché</li>
        <li>• Ver inquilinos guardados</li>
        <li>• Consultar datos financieros recientes</li>
        <li>• Ver fotos descargadas previamente</li>
      </ul>
    </GlassCard>
  </div>
</div>
