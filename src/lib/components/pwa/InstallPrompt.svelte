<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { Download, X, Smartphone } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import GlassCard from "../ui/GlassCard.svelte";
  import Button from "../ui/Button.svelte";

  let showPrompt = false;
  /** @type {any} */
  let deferredPrompt = null;
  let isIOS = false;
  let showIOSInstructions = false;

  onMount(() => {
    if (!browser) return;

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Detect iOS
    isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

    // Check if dismissed recently
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const daysSince =
        (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Show prompt after 30 seconds
    setTimeout(() => (showPrompt = true), 30000);

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showPrompt = true;
    });

    // Listen for appinstalled event
    window.addEventListener("appinstalled", () => {
      console.log("✅ PWA instalada");
      showPrompt = false;
      deferredPrompt = null;
    });
  });

  async function install() {
    if (!deferredPrompt) {
      if (isIOS) {
        showIOSInstructions = true;
        return;
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Install outcome:", outcome);

    showPrompt = false;
    deferredPrompt = null;
  }

  function dismiss() {
    showPrompt = false;
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  }
</script>

{#if showPrompt}
  <div
    class="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[9999]"
    transition:slide={{ duration: 300 }}
  >
    <GlassCard padding="default" className="shadow-2xl">
      <div class="flex items-start gap-3">
        <div class="p-3 rounded-2xl flex-shrink-0 bg-gradient-primary">
          <Smartphone size={24} class="text-white" />
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-900 mb-1">Instalar Rental Manager</h3>
          <p class="text-sm text-gray-600 mb-3">
            Accede más rápido y trabaja sin conexión
          </p>

          <div class="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              on:click={install}
            >
              Instalar
            </Button>
            <Button variant="ghost" size="sm" on:click={dismiss}>
              Ahora no
            </Button>
          </div>
        </div>

        <button
          on:click={dismiss}
          class="p-2 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"
        >
          <X size={18} class="text-gray-600" />
        </button>
      </div>
    </GlassCard>
  </div>
{/if}

<!-- iOS Instructions Modal -->
{#if showIOSInstructions}
  <div
    class="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4"
    on:click={() => (showIOSInstructions = false)}
    on:keydown={(e) => e.key === "Escape" && (showIOSInstructions = false)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:slide
  >
    <div on:click|stopPropagation on:keydown|stopPropagation role="dialog">
      <GlassCard padding="lg" className="max-w-sm w-full">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Instalar en iOS</h3>

        <div class="space-y-4 text-sm text-gray-700">
          <div class="flex items-start gap-3">
            <div
              class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold"
            >
              1
            </div>
            <p>
              Toca el botón de <strong>Compartir</strong> en Safari
              <span class="inline-block">📤</span>
            </p>
          </div>

          <div class="flex items-start gap-3">
            <div
              class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold"
            >
              2
            </div>
            <p>
              Selecciona <strong>"Añadir a pantalla de inicio"</strong>
              <span class="inline-block">➕</span>
            </p>
          </div>

          <div class="flex items-start gap-3">
            <div
              class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold"
            >
              3
            </div>
            <p>
              Confirma tocando <strong>"Añadir"</strong>
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          on:click={() => (showIOSInstructions = false)}
          className="mt-6"
        >
          Entendido
        </Button>
      </GlassCard>
    </div>
  </div>
{/if}

<style>
  .bg-gradient-primary {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
  }
</style>
