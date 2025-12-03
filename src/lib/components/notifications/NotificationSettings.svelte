<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { userStore } from '$lib/stores/user';
  import { notificationsService } from '$lib/services/notifications';
  import { showToast } from '$lib/stores/toast';
  import GlassCard from '../ui/GlassCard.svelte';
  import Button from '../ui/Button.svelte';
  import { Bell, Calendar, FileText, UserPlus, DollarSign, TrendingUp, Home, Save, AlertCircle, CheckCircle, Zap } from 'lucide-svelte';
  import { requestNotificationPermission, getNotificationPermission, hasNotificationPermission, showBrowserNotification } from '$lib/services/browserNotifications';
  import { notificationsStore } from '$lib/stores/notifications';
  
  let loading = true;
  let saving = false;
  let requestingPermission = false;
  let testingNotification = false;
  let browserPermission = 'default';
  let settings = {
    contract_alert_days: [7, 15, 30],
    enable_contract_alerts: true,
    enable_weekly_report: true,
    enable_invitation_alerts: true,
    enable_expense_alerts: true,
    enable_income_alerts: false,
    enable_room_alerts: false
  };
  
  // Días disponibles para alertas
  const availableDays = [7, 15, 30, 60];
  
  onMount(async () => {
    await loadSettings();
    if (browser) {
      browserPermission = getNotificationPermission();
    }
  });
  
  async function requestBrowserPermission() {
    if (!browser) return;
    
    requestingPermission = true;
    try {
      const permission = await requestNotificationPermission();
      browserPermission = permission;
      
      if (permission === 'granted') {
        showToast('Permisos de notificación activados', 'success');
      } else if (permission === 'denied') {
        showToast('Permisos denegados. Puedes activarlos en la configuración del navegador.', 'warning');
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      showToast('Error al solicitar permisos', 'error');
    } finally {
      requestingPermission = false;
    }
  }
  
  async function loadSettings() {
    if (!$userStore?.id) return;
    
    loading = true;
    try {
      const userSettings = await notificationsService.getSettings($userStore.id);
      if (userSettings) {
        settings = { ...settings, ...userSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Error al cargar configuración', 'error');
    } finally {
      loading = false;
    }
  }
  
  function toggleDay(day) {
    if (settings.contract_alert_days.includes(day)) {
      settings.contract_alert_days = settings.contract_alert_days.filter(d => d !== day);
    } else {
      settings.contract_alert_days = [...settings.contract_alert_days, day].sort((a, b) => a - b);
    }
  }
  
  async function saveSettings() {
    if (!$userStore?.id) return;
    
    saving = true;
    try {
      await notificationsService.updateSettings($userStore.id, settings);
      showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error al guardar configuración', 'error');
    } finally {
      saving = false;
    }
  }
  
  async function createTestNotification() {
    if (!$userStore?.id) return;
    
    testingNotification = true;
    try {
      // Crear notificación en la base de datos
      await notificationsService.createTestNotification($userStore.id);
      
      // Recargar notificaciones
      await notificationsStore.load();
      
      // Si tiene permisos, mostrar también notificación del navegador
      if (hasNotificationPermission()) {
        showBrowserNotification('🔔 Notificación de Prueba', {
          body: '¡Esta es una notificación de prueba! Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.',
          tag: 'test-notification',
          icon: '/favicon.png'
        });
      }
      
      showToast('Notificación de prueba creada. Revisa el panel de notificaciones.', 'success');
    } catch (error) {
      console.error('Error creating test notification:', error);
      showToast('Error al crear notificación de prueba: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      testingNotification = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 animate-fade-in px-4">
  <div>
    <h1 class="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
      <Bell size={32} />
      Configuración de Notificaciones
    </h1>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Personaliza cómo y cuándo recibes notificaciones
    </p>
  </div>
  
  {#if loading}
    <GlassCard>
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    </GlassCard>
  {:else}
    <form on:submit|preventDefault={saveSettings}>
      <!-- Permisos del Navegador -->
      {#if browser}
        <GlassCard className="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-orange-500/10 rounded-lg">
              <Bell size={24} class="text-orange-500" />
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Notificaciones del Navegador</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">Activa las notificaciones push para recibir alertas incluso cuando la app esté cerrada</p>
            </div>
          </div>
          
          <div class="space-y-3">
            {#if browserPermission === 'granted'}
              <div class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircle size={20} class="text-green-500 flex-shrink-0" />
                <div>
                  <p class="font-semibold text-green-800 dark:text-green-200">Permisos activados</p>
                  <p class="text-xs text-green-600 dark:text-green-300">Recibirás notificaciones del navegador</p>
                </div>
              </div>
            {:else if browserPermission === 'denied'}
              <div class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <AlertCircle size={20} class="text-red-500 flex-shrink-0" />
                <div class="flex-1">
                  <p class="font-semibold text-red-800 dark:text-red-200">Permisos denegados</p>
                  <p class="text-xs text-red-600 dark:text-red-300">
                    Ve a la configuración de tu navegador para activar las notificaciones
                  </p>
                </div>
              </div>
            {:else if browserPermission === 'unsupported'}
              <div class="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <AlertCircle size={20} class="text-yellow-500 flex-shrink-0" />
                <div>
                  <p class="font-semibold text-yellow-800 dark:text-yellow-200">No soportado</p>
                  <p class="text-xs text-yellow-600 dark:text-yellow-300">Tu navegador no soporta notificaciones</p>
                </div>
              </div>
            {:else}
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Las notificaciones del navegador te permiten recibir alertas incluso cuando la aplicación está cerrada.
                </p>
                <button
                  type="button"
                  on:click={requestBrowserPermission}
                  disabled={requestingPermission}
                  class="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {#if requestingPermission}
                    <span class="flex items-center justify-center gap-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Solicitando permisos...
                    </span>
                  {:else}
                    Activar Notificaciones del Navegador
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        </GlassCard>
      {/if}
      
      <!-- Alertas de Contratos -->
      <GlassCard className="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-purple-500/10 rounded-lg">
            <Calendar size={24} class="text-purple-500" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Alertas de Contratos</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Recibe notificaciones cuando los contratos estén próximos a vencer</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <!-- Toggle principal -->
          <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <div>
              <span class="font-semibold text-gray-900 dark:text-gray-100">Activar alertas de contratos</span>
              <p class="text-xs text-gray-600 dark:text-gray-400">Recibir notificaciones automáticas</p>
            </div>
            <input
              type="checkbox"
              bind:checked={settings.enable_contract_alerts}
              class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
            />
          </label>
          
          {#if settings.enable_contract_alerts}
            <!-- Días de anticipación -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Días de anticipación
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {#each availableDays as day}
                  <button
                    type="button"
                    on:click={() => toggleDay(day)}
                    class="px-4 py-2 rounded-xl font-semibold text-sm transition-all
                      {settings.contract_alert_days.includes(day)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/50'}"
                  >
                    {day} días
                  </button>
                {/each}
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Recibirás alertas cuando falten estos días para el vencimiento
              </p>
            </div>
          {/if}
        </div>
      </GlassCard>
      
      <!-- Resumen Semanal -->
      <GlassCard className="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-blue-500/10 rounded-lg">
            <FileText size={24} class="text-blue-500" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Resumen Semanal</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Recibe un resumen cada lunes de contratos próximos a vencer</p>
          </div>
        </div>
        
        <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
          <div>
            <span class="font-semibold text-gray-900 dark:text-gray-100">Activar resumen semanal</span>
            <p class="text-xs text-gray-600 dark:text-gray-400">Recibir cada lunes a las 9:00 AM</p>
          </div>
          <input
            type="checkbox"
            bind:checked={settings.enable_weekly_report}
            class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
          />
        </label>
      </GlassCard>
      
      <!-- Otras Notificaciones -->
      <GlassCard className="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-green-500/10 rounded-lg">
            <Bell size={24} class="text-green-500" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Otras Notificaciones</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Configura notificaciones adicionales</p>
          </div>
        </div>
        
        <div class="space-y-3">
          <!-- Invitaciones -->
          <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <div class="flex items-center gap-2">
              <UserPlus size={18} class="text-green-500" />
              <span class="font-semibold text-gray-900 dark:text-gray-100">Invitaciones a propiedades</span>
            </div>
            <input
              type="checkbox"
              bind:checked={settings.enable_invitation_alerts}
              class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
            />
          </label>
          
          <!-- Gastos -->
          <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <div class="flex items-center gap-2">
              <DollarSign size={18} class="text-orange-500" />
              <span class="font-semibold text-gray-900 dark:text-gray-100">Nuevos gastos registrados</span>
            </div>
            <input
              type="checkbox"
              bind:checked={settings.enable_expense_alerts}
              class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
            />
          </label>
          
          <!-- Ingresos -->
          <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <div class="flex items-center gap-2">
              <TrendingUp size={18} class="text-green-500" />
              <span class="font-semibold text-gray-900 dark:text-gray-100">Nuevos ingresos registrados</span>
            </div>
            <input
              type="checkbox"
              bind:checked={settings.enable_income_alerts}
              class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
            />
          </label>
          
          <!-- Cambios en habitaciones -->
          <label class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
            <div class="flex items-center gap-2">
              <Home size={18} class="text-blue-500" />
              <span class="font-semibold text-gray-900 dark:text-gray-100">Cambios en habitaciones</span>
            </div>
            <input
              type="checkbox"
              bind:checked={settings.enable_room_alerts}
              class="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
            />
          </label>
        </div>
      </GlassCard>
      
      <!-- Botón de Prueba -->
      <GlassCard className="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-yellow-500/10 rounded-lg">
            <Zap size={24} class="text-yellow-500" />
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Probar Notificaciones</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Crea una notificación de prueba para verificar que todo funciona correctamente</p>
          </div>
        </div>
        
        <button
          type="button"
          on:click={createTestNotification}
          disabled={testingNotification}
          class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 shadow-lg"
        >
          {#if testingNotification}
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span>Creando notificación...</span>
          {:else}
            <Zap size={20} />
            <span>Crear Notificación de Prueba</span>
          {/if}
        </button>
      </GlassCard>
      
      <!-- Botón Guardar -->
      <div class="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="min-h-[48px] px-6"
        >
          <Save size={18} class="inline mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </form>
  {/if}
</div>

