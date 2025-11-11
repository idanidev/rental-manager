<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  export let data = [];
  export let title = 'Gráfico';
  export let labelKey = 'label';
  export let valueKey = 'value';
  export let colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  let canvas;
  let chart;
  
  Chart.register(...registerables);
  
  onMount(() => {
    createChart();
  });
  
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
  
  $: if (chart && data) {
    updateChart();
  }
  
  function createChart() {
    if (!canvas || typeof window === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const isDark = typeof document !== 'undefined' 
      ? document.documentElement.getAttribute('data-theme') === 'dark'
      : false;
    
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d[labelKey]),
        datasets: [{
          label: title,
          data: data.map(d => d[valueKey]),
          backgroundColor: data.map((_, i) => `${colors[i % colors.length]}80`),
          borderColor: data.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f1f5f9' : '#1e293b',
            bodyColor: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? '#475569' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `${context.parsed.y.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(203, 213, 225, 0.3)',
              drawBorder: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: {
                size: 11
              },
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  }
  
  function updateChart() {
    chart.data.labels = data.map(d => d[labelKey]);
    chart.data.datasets[0].data = data.map(d => d[valueKey]);
    chart.update();
  }
</script>

<div class="w-full h-full">
  <canvas bind:this={canvas}></canvas>
</div>

