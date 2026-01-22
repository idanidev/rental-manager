<script>
  import { goto } from "$app/navigation";
  import { userStore } from "$lib/stores/user";
  import GlassCard from "$lib/components/ui/GlassCard.svelte";
  import {
    Bell,
    Settings,
    HelpCircle,
    FileText,
    Shield,
    LogOut,
    ChevronRight,
    User,
    Share2,
  } from "lucide-svelte";
  import { supabase } from "$lib/services/supabase";

  const menuSections = [
    {
      title: "Alertas y Actividad",
      items: [
        {
          icon: Bell,
          label: "Notificaciones",
          path: "/notifications",
          color: "orange",
        },
      ],
    },
    {
      title: "Cuenta",
      items: [
        {
          icon: User,
          label: "Mi Perfil",
          path: "/profile",
          color: "blue",
        },
        {
          icon: Settings,
          label: "Configuración",
          path: "/settings",
          color: "gray",
        },
      ],
    },
    {
      title: "Información",
      items: [
        {
          icon: HelpCircle,
          label: "Ayuda y Soporte",
          path: "/help",
          color: "green",
        },
        {
          icon: FileText,
          label: "Términos y Condiciones",
          path: "/terms",
          color: "gray",
        },
        {
          icon: Shield,
          label: "Privacidad",
          path: "/privacy",
          color: "gray",
        },
      ],
    },
    {
      title: "Compartir",
      items: [
        {
          icon: Share2,
          label: "Recomendar App",
          action: "share",
          color: "pink",
        },
      ],
    },
  ];

  /**
   * @param {{ path?: string, action?: string }} item
   */
  function handleItemClick(item) {
    if (item.path) {
      goto(item.path);
    } else if (item.action === "share") {
      if (navigator.share) {
        navigator.share({
          title: "Rental Manager",
          text: "Gestiona tus propiedades de alquiler de forma profesional",
          url: window.location.origin,
        });
      }
    }
  }

  async function handleLogout() {
    if (confirm("¿Cerrar sesión?")) {
      await supabase.auth.signOut();
      goto("/login");
    }
  }

  /** @type {Record<string, string>} */
  const colorClasses = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
    gray: "bg-gray-100 text-gray-600",
  };
</script>

<svelte:head>
  <title>Más - Rental Manager</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-6 pb-24">
  <!-- Header -->
  <div class="mb-8">
    <h1
      class="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent"
    >
      Más Opciones
    </h1>
    <p class="text-gray-600">Configuración y ajustes de tu cuenta</p>
  </div>

  <!-- User Info Card -->
  {#if $userStore}
    <GlassCard className="mb-6" hover>
      <div class="flex items-center gap-4">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold bg-gradient-primary"
        >
          {$userStore.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-900">
            {$userStore.user_metadata?.name || "Usuario"}
          </h3>
          <p class="text-sm text-gray-600">
            {$userStore.email}
          </p>
        </div>
        <button
          on:click={() => goto("/profile")}
          class="p-2 hover:bg-white/60 rounded-lg transition-colors"
        >
          <ChevronRight size={20} class="text-gray-400" />
        </button>
      </div>
    </GlassCard>
  {/if}

  <!-- Menu Sections -->
  <div class="space-y-6">
    {#each menuSections as section}
      <div>
        <h2
          class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2"
        >
          {section.title}
        </h2>

        <GlassCard
          padding="none"
          className="divide-y divide-gray-200/50 overflow-hidden"
        >
          {#each section.items as item}
            {@const Icon = item.icon}
            <button
              on:click={() => handleItemClick(item)}
              class="w-full flex items-center gap-4 p-4 hover:bg-white/60 transition-colors text-left"
            >
              <div class="p-2.5 rounded-xl {colorClasses[item.color]}">
                <Icon size={20} />
              </div>

              <div class="flex-1">
                <p class="font-semibold text-gray-900">
                  {item.label}
                </p>
              </div>

              <ChevronRight size={20} class="text-gray-400" />
            </button>
          {/each}
        </GlassCard>
      </div>
    {/each}
  </div>

  <!-- Logout Button -->
  <GlassCard className="mt-6" padding="none">
    <button
      on:click={handleLogout}
      class="w-full flex items-center justify-center gap-2 p-4 text-red-600 hover:bg-red-50 transition-colors font-semibold"
    >
      <LogOut size={20} />
      Cerrar Sesión
    </button>
  </GlassCard>

  <!-- App Version -->
  <div class="mt-8 text-center">
    <p class="text-xs text-gray-500">Rental Manager v2.0.0</p>
  </div>
</div>

<style>
  .bg-gradient-primary {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
  }
</style>
