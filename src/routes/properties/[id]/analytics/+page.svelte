<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    ArrowLeft, TrendingUp, TrendingDown, Euro, Percent, 
    Calendar, BarChart3 
  } from 'lucide-svelte';
  import { Chart } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement
  } from 'chart.js';
  import { financesService } from '$lib/services/finances';
  import { propertiesService } from '$lib/services/properties';
  import { userStore } from '$lib/stores/user';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Registrar componentes de Chart.js
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement
  );
  
  let property = null;
  let loading = true;
  let error = '';
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth() + 1;
  
  // Datos financieros
  let monthlyData = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  let netProfit = 0;
  let profitMargin = 0;
  let occupancyRate = 0;
  
  $: propertyId = $page.params.id;
  
  // Configuración de gráficos
  let lineChartData = {
    labels: [],
    datasets: []
  };
  
  let barChartData = {
    labels: [],
    datasets: []
  };
  
  let pieChartData = {
    labels: [],
    datasets: []
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = '';
    
    try {
      property = await propertiesService.getProperty(propertyId);
      await loadFinancialData();
      
      if (property) {
        const totalRooms = property.rooms?.length || 0;
        const occupiedRooms = property.rooms?.filter(r => r.occupied).length || 0;
        occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100) : 0;
      }
    } catch (err) {
      error = err.message || 'Error al cargar análisis';
    } finally {
      loading = false;
    }
  }
  
  function generateDemoData() {
    const months = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const incomeValues = [950, 950, 950, 950, 950, 950];
    const expenseValues = [205, 120, 85, 150, 95, 180];
    
    totalIncome = incomeValues.reduce((a, b) => a + b, 0);
    totalExpenses = expenseValues.reduce((a, b) => a + b, 0);
    netProfit = totalIncome - totalExpenses;
    profitMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;
    
    // Gráfico de línea: Evolución
    lineChartData = {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeValues,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Gastos',
          data: expenseValues,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Beneficio',
          data: incomeValues.map((inc, i) => inc - expenseValues[i]),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    // Gráfico de barras: Comparación mensual
    barChartData = {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeValues,
          backgroundColor: 'rgba(34, 197, 94, 0.7)'
        },
        {
          label: 'Gastos',
          data: expenseValues,
          backgroundColor: 'rgba(239, 68, 68, 0.7)'
        }
      ]
    };
    
    // Gráfico circular: Gastos por categoría
    pieChartData = {
      labels: ['Mantenimiento', 'Limpieza', 'Servicios', 'Otros'],
      datasets: [{
        data: [320, 285, 150, 80],
        backgroundColor: [
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(251, 146, 60, 0.7)'
        ]
      }]
    };
  }
  
  async function loadFinancialData() {
    // Cargar datos de los últimos 6 meses
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      months.push(date.toLocaleDateString('es-ES', { month: 'short' }));
      
      try {
        const summary = await financesService.getFinancialSummary(propertyId, year, month);
        incomeData.push(summary.totalIncome);
        expenseData.push(summary.totalExpenses);
        
        if (i === 0) {
          totalIncome = summary.totalIncome;
          totalExpenses = summary.totalExpenses;
          netProfit = summary.netProfit;
          profitMargin = summary.profitMargin;
        }
      } catch (err) {
        incomeData.push(0);
        expenseData.push(0);
      }
    }
    
    // Configurar gráficos
    lineChartData = {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Gastos',
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Beneficio',
          data: incomeData.map((inc, i) => inc - expenseData[i]),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    barChartData = {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          backgroundColor: 'rgba(34, 197, 94, 0.7)'
        },
        {
          label: 'Gastos',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)'
        }
      ]
    };
    
    // Cargar gastos por categoría
    const startDate = new Date(selectedYear, 0, 1).toISOString();
    const endDate = new Date(selectedYear, 11, 31).toISOString();
    const expensesByCategory = await financesService.getExpensesByCategory(propertyId, startDate, endDate);
    
    pieChartData = {
      labels: expensesByCategory.map(e => e.category),
      datasets: [{
        data: expensesByCategory.map(e => e.amount),
        backgroundColor: [
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(156, 163, 175, 0.7)'
        ]
      }]
    };
  }
</script>

<div class="max-w-7xl mx-auto space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <button 
        on:click={() => goto(`/properties/${propertyId}`)}
        class="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-2 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver a la propiedad</span>
      </button>
      <h1 class="text-3xl font-bold gradient-text">
        Análisis y Reportes
      </h1>
      <p class="text-gray-600 mt-1">
        {property?.name || 'Cargando...'}
      </p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando análisis...</p>
      </div>
    </div>
  {:else if error}
    <GlassCard>
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">❌</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">{error}</h3>
        <Button on:click={loadData}>Reintentar</Button>
      </div>
    </GlassCard>
  {:else}
    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp size={20} class="text-green-600" />
            <p class="stat-label">Ingresos (6 meses)</p>
          </div>
          <p class="stat-value text-green-600">{totalIncome.toFixed(2)}€</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <TrendingDown size={20} class="text-red-600" />
            <p class="stat-label">Gastos (6 meses)</p>
          </div>
          <p class="stat-value text-red-600">{totalExpenses.toFixed(2)}€</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <Euro size={20} class="text-purple-600" />
            <p class="stat-label">Beneficio Neto</p>
          </div>
          <p class="stat-value {netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
            {netProfit.toFixed(2)}€
          </p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <Percent size={20} class="text-blue-600" />
            <p class="stat-label">Margen de Beneficio</p>
          </div>
          <p class="stat-value text-blue-600">{profitMargin.toFixed(1)}%</p>
        </div>
      </GlassCard>
    </div>

    <!-- Gráfico de Evolución -->
    <GlassCard>
      <div class="mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={24} class="text-purple-600" />
          Evolución Financiera (últimos 6 meses)
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          Comparación de ingresos, gastos y beneficio mensual
        </p>
      </div>
      <div class="h-[300px]">
        <Chart type="line" data={lineChartData} options={chartOptions} />
      </div>
    </GlassCard>

    <!-- Grid de 2 gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Gráfico de Barras -->
      <GlassCard>
        <div class="mb-4">
          <h2 class="text-xl font-bold text-gray-800">
            Comparación Mensual
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            Ingresos vs Gastos
          </p>
        </div>
        <div class="h-[250px]">
          <Chart type="bar" data={barChartData} options={chartOptions} />
        </div>
      </GlassCard>
      
      <!-- Gráfico Circular -->
      <GlassCard>
        <div class="mb-4">
          <h2 class="text-xl font-bold text-gray-800">
            Gastos por Categoría
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            Distribución anual
          </p>
        </div>
        <div class="h-[250px] flex items-center justify-center">
          <Chart type="pie" data={pieChartData} options={chartOptions} />
        </div>
      </GlassCard>
    </div>

    <!-- Métricas adicionales -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GlassCard>
        <div class="text-center py-6">
          <div class="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl inline-block mb-3">
            <TrendingUp size={32} class="text-white" />
          </div>
          <p class="text-sm text-gray-600 font-medium mb-2">Tasa de Ocupación</p>
          <p class="text-3xl font-bold gradient-text">{occupancyRate.toFixed(0)}%</p>
        </div>
      </GlassCard>
      
      <GlassCard>
        <div class="text-center py-6">
          <div class="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl inline-block mb-3">
            <Euro size={32} class="text-white" />
          </div>
          <p class="text-sm text-gray-600 font-medium mb-2">Ingreso Medio Mensual</p>
          <p class="text-3xl font-bold gradient-text">{(totalIncome / 6).toFixed(2)}€</p>
        </div>
      </GlassCard>
      
      <GlassCard>
        <div class="text-center py-6">
          <div class="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl inline-block mb-3">
            <Calendar size={32} class="text-white" />
          </div>
          <p class="text-sm text-gray-600 font-medium mb-2">Gasto Medio Mensual</p>
          <p class="text-3xl font-bold gradient-text">{(totalExpenses / 6).toFixed(2)}€</p>
        </div>
      </GlassCard>
    </div>

    <!-- Insights -->
    <GlassCard>
      <h2 class="text-xl font-bold text-gray-800 mb-4">💡 Insights y Recomendaciones</h2>
      <div class="space-y-3">
        {#if profitMargin > 50}
          <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p class="text-green-800">
              <strong>✓ Excelente rentabilidad:</strong> Tu margen de beneficio es del {profitMargin.toFixed(1)}%, 
              lo cual es muy saludable. Mantén el buen trabajo.
            </p>
          </div>
        {:else if profitMargin > 30}
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p class="text-blue-800">
              <strong>📊 Rentabilidad aceptable:</strong> Con un margen del {profitMargin.toFixed(1)}%, 
              hay espacio para mejorar. Considera optimizar gastos o aumentar rentas.
            </p>
          </div>
        {:else}
          <div class="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p class="text-orange-800">
              <strong>⚠️ Margen ajustado:</strong> Tu margen de beneficio es del {profitMargin.toFixed(1)}%. 
              Revisa tus gastos y considera ajustar las rentas.
            </p>
          </div>
        {/if}
        
        {#if occupancyRate < 80}
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p class="text-yellow-800">
              <strong>🏠 Oportunidad de mejora:</strong> Tu tasa de ocupación es del {occupancyRate.toFixed(0)}%. 
              Considera estrategias de marketing para llenar las habitaciones disponibles.
            </p>
          </div>
        {/if}
        
        <div class="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p class="text-purple-800">
            <strong>📈 Promedio mensual:</strong> Estás generando {(totalIncome / 6).toFixed(2)}€ de ingresos 
            y gastando {(totalExpenses / 6).toFixed(2)}€ al mes. 
            Beneficio neto promedio: {(netProfit / 6).toFixed(2)}€/mes.
          </p>
        </div>
      </div>
    </GlassCard>
  {/if}
</div>

