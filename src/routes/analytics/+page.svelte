<script>
  import { onMount } from 'svelte';
  import { TrendingUp, TrendingDown, Euro, Home, AlertCircle, BarChart3 } from 'lucide-svelte';
  import { userStore } from '$lib/stores/user';
  import { analyticsService } from '$lib/services/analytics';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import LineChart from '$lib/components/analytics/LineChart.svelte';
  import BarChart from '$lib/components/analytics/BarChart.svelte';
  import DoughnutChart from '$lib/components/analytics/DoughnutChart.svelte';
  
  let loading = true;
  let error = '';
  let summary = null;
  let monthlyRevenue = [];
  let propertyStats = [];
  let revenueDistribution = [];
  
  onMount(async () => {
    await loadAnalytics();
  });
  
  async function loadAnalytics() {
    if (!$userStore) return;
    
    loading = true;
    error = '';
    
    try {
      const [summaryData, monthlyData, propertyData, distributionData] = await Promise.all([
        analyticsService.getFinancialSummary($userStore.id),
        analyticsService.getMonthlyRevenue($userStore.id, 6),
        analyticsService.getPropertyStats($userStore.id),
        analyticsService.getRevenueDistribution($userStore.id)
      ]);
      
      summary = summaryData;
      monthlyRevenue = monthlyData;
      propertyStats = propertyData.map(p => ({
        label: p.name,
        value: p.occupancyRate
      }));
      revenueDistribution = distributionData.filter(d => d.value > 0);
    } catch (err) {
      console.error('Error loading analytics:', err);
      error = 'Error al cargar las estadísticas';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Analytics - Rental Manager</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-3">
      <BarChart3 size={32} />
      Analytics & Finanzas
    </h1>
    <p class="text-sm text-gray-500 mt-1">
      Análisis detallado de tus ingresos y ocupación
    </p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando estadísticas...</p>
      </div>
    </div>
  {:else if error}
    <GlassCard>
      <div class="text-center py-10">
        <AlertCircle size={48} class="text-red-500 mx-auto mb-4" />
        <p class="text-red-600">{error}</p>
      </div>
    </GlassCard>
  {:else if summary}
    <!-- KPIs Principales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Ingresos Totales -->
      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Ingresos Mensuales</p>
            <p class="text-2xl font-bold gradient-text">{summary.totalRevenue.toFixed(2)}€</p>
            {#if summary.growth !== 0}
              <div class="flex items-center gap-1 mt-1">
                {#if summary.growth > 0}
                  <TrendingUp size={14} class="text-green-600" />
                  <span class="text-xs text-green-600 font-semibold">+{summary.growth}%</span>
                {:else}
                  <TrendingDown size={14} class="text-red-600" />
                  <span class="text-xs text-red-600 font-semibold">{summary.growth}%</span>
                {/if}
                <span class="text-xs text-gray-500">vs mes anterior</span>
              </div>
            {/if}
          </div>
          <div class="p-3 gradient-primary rounded-2xl">
            <Euro size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>

      <!-- Tasa de Ocupación -->
      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Ocupación Promedio</p>
            <p class="text-2xl font-bold gradient-text">{summary.avgOccupancyRate}%</p>
            <p class="text-xs text-gray-500 mt-1">
              {summary.occupiedRooms} de {summary.totalRooms} habitaciones
            </p>
          </div>
          <div class="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
            <Home size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>

      <!-- Ingresos Potenciales -->
      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Ingresos Potenciales</p>
            <p class="text-2xl font-bold gradient-text">{summary.potentialRevenue.toFixed(2)}€</p>
            <p class="text-xs text-gray-500 mt-1">
              Si todas las habitaciones estuvieran ocupadas
            </p>
          </div>
          <div class="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
            <TrendingUp size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>

      <!-- Ingresos Perdidos -->
      <GlassCard hover={false}>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-medium mb-1">Ingresos No Generados</p>
            <p class="text-2xl font-bold text-red-600">{summary.lostRevenue.toFixed(2)}€</p>
            <p class="text-xs text-gray-500 mt-1">
              Por habitaciones vacías
            </p>
          </div>
          <div class="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl">
            <AlertCircle size={24} class="text-white" />
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ingresos Mensuales -->
      <GlassCard hover={false}>
        <div class="mb-4">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} class="text-purple-600" />
            Evolución de Ingresos
          </h3>
          <p class="text-xs text-gray-500 mt-1">Últimos 6 meses</p>
        </div>
        <div class="h-64">
          <LineChart 
            data={monthlyRevenue}
            title="Ingresos"
            labelKey="month"
            valueKey="revenue"
            color="#8b5cf6"
          />
        </div>
      </GlassCard>

      <!-- Ocupación por Propiedad -->
      <GlassCard hover={false}>
        <div class="mb-4">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Home size={20} class="text-purple-600" />
            Ocupación por Propiedad
          </h3>
          <p class="text-xs text-gray-500 mt-1">Tasa de ocupación actual</p>
        </div>
        <div class="h-64">
          {#if propertyStats.length > 0}
            <BarChart 
              data={propertyStats}
              title="Ocupación"
              labelKey="label"
              valueKey="value"
            />
          {:else}
            <div class="h-full flex items-center justify-center text-gray-500 text-sm">
              No hay datos disponibles
            </div>
          {/if}
        </div>
      </GlassCard>
    </div>

    <!-- Distribución de Ingresos -->
    {#if revenueDistribution.length > 0}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <GlassCard hover={false}>
            <div class="mb-4">
              <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Euro size={20} class="text-purple-600" />
                Distribución de Ingresos
              </h3>
              <p class="text-xs text-gray-500 mt-1">Por propiedad</p>
            </div>
            <div class="h-80">
              <DoughnutChart 
                data={revenueDistribution}
                labelKey="name"
                valueKey="value"
              />
            </div>
          </GlassCard>
        </div>

        <!-- Detalles por Propiedad -->
        <div class="lg:col-span-2">
          <GlassCard hover={false}>
            <div class="mb-4">
              <h3 class="text-lg font-bold text-gray-800">Detalles por Propiedad</h3>
              <p class="text-xs text-gray-500 mt-1">Estadísticas detalladas</p>
            </div>
            <div class="space-y-3">
              {#each propertyStats as property, i}
                {@const fullProperty = revenueDistribution[i]}
                <div class="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent border border-gray-200/50">
                  <div class="flex-1">
                    <h4 class="font-bold text-gray-800">{property.label}</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      Ocupación: {property.value}% • 
                      Ingresos: {fullProperty?.value?.toFixed(2) || 0}€/mes
                    </p>
                  </div>
                  <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full gradient-primary transition-all duration-500"
                      style="width: {property.value}%"
                    ></div>
                  </div>
                </div>
              {/each}
            </div>
          </GlassCard>
        </div>
      </div>
    {/if}
  {/if}
</div>

