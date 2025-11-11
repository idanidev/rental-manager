<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  export let data = [];
  export let labelKey = 'name';
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
      type: 'doughnut',
      data: {
        labels: data.map(d => d[labelKey]),
        datasets: [{
          data: data.map(d => d[valueKey]),
          backgroundColor: colors.slice(0, data.length),
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#cbd5e1' : '#475569',
              font: {
                size: 12,
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f1f5f9' : '#1e293b',
            bodyColor: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? '#475569' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toFixed(2)}€ (${percentage}%)`;
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

<div class="w-full h-full flex items-center justify-center">
  <canvas bind:this={canvas}></canvas>
</div>

