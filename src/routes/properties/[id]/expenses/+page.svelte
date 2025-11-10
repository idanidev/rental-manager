<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    ArrowLeft, Plus, Receipt, TrendingUp, TrendingDown, Euro, 
    Edit, Trash2, Filter, Calendar, AlertCircle 
  } from 'lucide-svelte';
  import { financesService } from '$lib/services/finances';
  import { propertiesService } from '$lib/services/properties';
  import { userStore } from '$lib/stores/user';
  
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import ExpenseForm from '$lib/components/finances/ExpenseForm.svelte';
  import IncomeForm from '$lib/components/finances/IncomeForm.svelte';
  
  let property = null;
  let expenses = [];
  let income = [];
  let loading = true;
  let error = '';
  let userRole = 'viewer';
  let showExpenseModal = false;
  let showIncomeModal = false;
  let selectedExpense = null;
  let selectedIncome = null;
  let activeTab = 'expenses'; // 'expenses' | 'income'
  
  // Datos demo para modo DEMO
  const demoExpenses = [
    { id: '1', amount: 120, category: 'Mantenimiento', description: 'Reparación de grifo', date: '2024-01-15', property_id: null },
    { id: '2', amount: 85, category: 'Limpieza', description: 'Limpieza mensual', date: '2024-01-10', property_id: null }
  ];
  
  const demoIncome = [
    { id: '1', amount: 450, month: '2024-01', paid: true, payment_date: '2024-01-05', room: { name: 'Habitación 1' }, property_id: null },
    { id: '2', amount: 500, month: '2024-01', paid: true, payment_date: '2024-01-05', room: { name: 'Habitación 2' }, property_id: null }
  ];
  
  $: propertyId = $page.params.id;
  $: totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  $: totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  $: paidIncome = income.filter(i => i.paid).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  $: pendingIncome = totalIncome - paidIncome;
  $: netProfit = totalIncome - totalExpenses;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = '';
    
    try {
      property = await propertiesService.getProperty(propertyId);
      const [expensesData, incomeData] = await Promise.all([
        financesService.getExpenses(propertyId),
        financesService.getIncome(propertyId)
      ]);
      expenses = expensesData;
      income = incomeData;
      
      if (property) {
        userRole = property.property_access?.find(a => a.user_id === $userStore?.id)?.role || 'viewer';
      }
    } catch (err) {
      error = err.message || 'Error al cargar datos financieros';
    } finally {
      loading = false;
    }
  }
  
  function handleExpenseSuccess() {
    showExpenseModal = false;
    selectedExpense = null;
    loadData();
  }
  
  function handleIncomeSuccess() {
    showIncomeModal = false;
    selectedIncome = null;
    loadData();
  }
  
  function openEditExpense(expense) {
    selectedExpense = expense;
    showExpenseModal = true;
  }
  
  function openEditIncome(inc) {
    selectedIncome = inc;
    showIncomeModal = true;
  }
  
  async function deleteExpense(expense) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    
    try {
      await financesService.deleteExpense(expense.id);
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }
  
  async function deleteIncome(inc) {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;
    
    try {
      await financesService.deleteIncome(inc.id);
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }
  
  async function markAsPaid(inc) {
    try {
      await financesService.markAsPaid(inc.id);
      await loadData();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  }
  
  const canEdit = () => userRole === 'owner' || userRole === 'editor';
  
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  
  function formatMonth(monthStr) {
    if (!monthStr) return '-';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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
        Gastos e Ingresos
      </h1>
      <p class="text-gray-600 mt-1">
        {property?.name || 'Cargando...'}
      </p>
    </div>
    
    {#if canEdit()}
      <div class="flex gap-2">
        <Button variant="secondary" on:click={() => showExpenseModal = true}>
          <Plus size={20} class="inline mr-2" />
          Nuevo Gasto
        </Button>
        <Button on:click={() => showIncomeModal = true}>
          <Plus size={20} class="inline mr-2" />
          Nuevo Ingreso
        </Button>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando datos financieros...</p>
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
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp size={20} class="text-green-600" />
            <p class="stat-label">Ingresos Totales</p>
          </div>
          <p class="stat-value text-green-600">{totalIncome.toFixed(2)}€</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <TrendingDown size={20} class="text-red-600" />
            <p class="stat-label">Gastos Totales</p>
          </div>
          <p class="stat-value text-red-600">{totalExpenses.toFixed(2)}€</p>
        </div>
      </GlassCard>
      
      <GlassCard hover={false}>
        <div class="stat-card">
          <div class="flex items-center gap-2 mb-2">
            <Euro size={20} class="text-blue-600" />
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
            <AlertCircle size={20} class="text-orange-600" />
            <p class="stat-label">Ingresos Pendientes</p>
          </div>
          <p class="stat-value text-orange-600">{pendingIncome.toFixed(2)}€</p>
        </div>
      </GlassCard>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-gray-200">
      <button
        class="px-4 py-2 font-medium transition-all {activeTab === 'expenses' 
          ? 'border-b-2 border-purple-600 text-purple-600' 
          : 'text-gray-600 hover:text-gray-800'}"
        on:click={() => activeTab = 'expenses'}
      >
        <Receipt size={18} class="inline mr-2" />
        Gastos ({expenses.length})
      </button>
      <button
        class="px-4 py-2 font-medium transition-all {activeTab === 'income' 
          ? 'border-b-2 border-purple-600 text-purple-600' 
          : 'text-gray-600 hover:text-gray-800'}"
        on:click={() => activeTab = 'income'}
      >
        <TrendingUp size={18} class="inline mr-2" />
        Ingresos ({income.length})
      </button>
    </div>

    <!-- Content -->
    {#if activeTab === 'expenses'}
      {#if expenses.length > 0}
        <div class="space-y-3">
          {#each expenses as expense (expense.id)}
            <GlassCard>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 flex-1">
                  <div class="p-3 bg-red-100 rounded-xl">
                    <Receipt size={24} class="text-red-600" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-gray-800">{expense.category}</h4>
                      <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                    {#if expense.description}
                      <p class="text-sm text-gray-600 mt-1">{expense.description}</p>
                    {/if}
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-red-600">-{parseFloat(expense.amount).toFixed(2)}€</p>
                  </div>
                </div>
                
                {#if canEdit()}
                  <div class="flex gap-2 ml-4">
                    <Button variant="ghost" className="p-2" on:click={() => openEditExpense(expense)}>
                      <Edit size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="p-2 text-red-600 hover:bg-red-50"
                      on:click={() => deleteExpense(expense)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                {/if}
              </div>
            </GlassCard>
          {/each}
        </div>
      {:else}
        <GlassCard>
          <div class="text-center py-12">
            <Receipt size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-xl font-bold text-gray-700 mb-2">No hay gastos registrados</h3>
            <p class="text-gray-600 mb-6">Comienza registrando el primer gasto</p>
            {#if canEdit()}
              <Button on:click={() => showExpenseModal = true}>
                <Plus size={20} class="inline mr-2" />
                Registrar Gasto
              </Button>
            {/if}
          </div>
        </GlassCard>
      {/if}
    {:else}
      {#if income.length > 0}
        <div class="space-y-3">
          {#each income as inc (inc.id)}
            <GlassCard>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 flex-1">
                  <div class="p-3 {inc.paid ? 'bg-green-100' : 'bg-orange-100'} rounded-xl">
                    <TrendingUp size={24} class="{inc.paid ? 'text-green-600' : 'text-orange-600'}" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-gray-800">
                        {inc.room?.name || 'Habitación'}
                      </h4>
                      <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {formatMonth(inc.month)}
                      </span>
                      <span class="px-2 py-1 {inc.paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} text-xs rounded-full font-semibold">
                        {inc.paid ? '✓ Pagado' : 'Pendiente'}
                      </span>
                    </div>
                    {#if inc.notes}
                      <p class="text-sm text-gray-600 mt-1">{inc.notes}</p>
                    {/if}
                    {#if inc.payment_date}
                      <p class="text-xs text-gray-500 mt-1">Pagado: {formatDate(inc.payment_date)}</p>
                    {/if}
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-green-600">+{parseFloat(inc.amount).toFixed(2)}€</p>
                  </div>
                </div>
                
                {#if canEdit()}
                  <div class="flex gap-2 ml-4">
                    {#if !inc.paid}
                      <Button 
                        variant="secondary" 
                        className="text-sm"
                        on:click={() => markAsPaid(inc)}
                      >
                        Marcar Pagado
                      </Button>
                    {/if}
                    <Button variant="ghost" className="p-2" on:click={() => openEditIncome(inc)}>
                      <Edit size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="p-2 text-red-600 hover:bg-red-50"
                      on:click={() => deleteIncome(inc)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                {/if}
              </div>
            </GlassCard>
          {/each}
        </div>
      {:else}
        <GlassCard>
          <div class="text-center py-12">
            <TrendingUp size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-xl font-bold text-gray-700 mb-2">No hay ingresos registrados</h3>
            <p class="text-gray-600 mb-6">Comienza registrando el primer ingreso</p>
            {#if canEdit()}
              <Button on:click={() => showIncomeModal = true}>
                <Plus size={20} class="inline mr-2" />
                Registrar Ingreso
              </Button>
            {/if}
          </div>
        </GlassCard>
      {/if}
    {/if}
  {/if}
</div>

<!-- Modales -->
<Modal bind:open={showExpenseModal} title={selectedExpense ? 'Editar Gasto' : 'Nuevo Gasto'}>
  <ExpenseForm 
    {propertyId}
    expense={selectedExpense}
    on:success={handleExpenseSuccess}
    on:cancel={() => { showExpenseModal = false; selectedExpense = null; }}
  />
</Modal>

<Modal bind:open={showIncomeModal} title={selectedIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}>
  <IncomeForm 
    {propertyId}
    income={selectedIncome}
    on:success={handleIncomeSuccess}
    on:cancel={() => { showIncomeModal = false; selectedIncome = null; }}
  />
</Modal>

