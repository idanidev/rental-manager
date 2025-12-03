<script>
  import { 
    DoorOpen, Euro, Maximize, FileText, User, Mail, Phone, 
    CreditCard, Calendar, Clock, Shield, ChevronDown, ChevronUp, Camera 
  } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import Button from '../ui/Button.svelte';
  import InventoryManager from './InventoryManager.svelte';
  import PhotoGallery from './PhotoGallery.svelte';
  import { roomsService } from '$lib/services/rooms';
  import { tenantsService } from '$lib/services/tenants';
  import { createEventDispatcher } from 'svelte';
  
  /** @typedef {import('$lib/types').Room} Room */
  /** @typedef {import('$lib/types').Tenant} Tenant */
  /** @typedef {import('$lib/types').RoomFormData} RoomFormData */
  
  /** @type {Room | null} */
  export let room = null; // Si existe, estamos editando
  /** @type {string} */
  export let propertyId;
  
  const dispatch = createEventDispatcher();
  
  /** @type {RoomFormData} */
  let formData = {
    property_id: propertyId,
    name: room?.name || '',
    room_type: room?.room_type || 'private',
    monthly_rent: room?.monthly_rent || '',
    size_sqm: room?.size_sqm || '',
    occupied: room?.occupied || false,
    tenant_id: room?.tenant_id || '',
    inventory: room?.inventory || [],
    photos: room?.photos || [],
    notes: room?.notes || ''
  };
  
  let loading = false;
  let error = '';
  let showInventory = false;
  let showPhotos = false;
  /** @type {Tenant[]} */
  let availableTenants = [];
  /** @type {Tenant | null} */
  let selectedTenant = null;
  let currentRoomId = room?.id || 'new'; // ID actual de la habitación para PhotoGallery
  
  // Wizard state
  let currentStep = 1;
  const totalSteps = 2;
  
  // Cargar inquilinos disponibles
  onMount(async () => {
    try {
      availableTenants = await tenantsService.getActiveTenants(propertyId);
      if (formData.tenant_id) {
        selectedTenant = availableTenants.find((/** @type {Tenant} */ t) => t.id === formData.tenant_id) || null;
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
    }
  });

  // Si es sala común, no puede estar ocupada
  $: if (formData.room_type === 'common') {
    formData.occupied = false;
    formData.tenant_id = '';
    formData.monthly_rent = 0;
  }
  
  // Si no está ocupada, limpiar el inquilino
  $: if (!formData.occupied) {
    formData.tenant_id = '';
  }
  
  // Actualizar inquilino seleccionado cuando cambia el ID
  $: if (formData.tenant_id) {
    selectedTenant = availableTenants.find((/** @type {Tenant} */ t) => t.id === formData.tenant_id) || null;
  } else {
    selectedTenant = null;
  }
  
  // Wizard navigation
  function nextStep() {
    // Validar paso 1 antes de continuar
    if (currentStep === 1) {
      if (!formData.name || formData.name.trim() === '') {
        error = 'Por favor ingresa el nombre del espacio';
        return;
      }
      if (formData.room_type === 'private') {
        if (!formData.monthly_rent || formData.monthly_rent === '' || parseFloat(formData.monthly_rent) <= 0) {
          error = 'Por favor ingresa la renta mensual para habitaciones privadas';
          return;
        }
      }
    }
    error = '';
    if (currentStep < totalSteps) {
      currentStep++;
    }
  }
  
  function previousStep() {
    error = '';
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  $: progressPercentage = (currentStep / totalSteps) * 100;

  async function handleSubmit() {
    // Validar nombre (obligatorio siempre)
    if (!formData.name || formData.name.trim() === '') {
      error = 'Por favor ingresa el nombre del espacio';
      return;
    }
    
    // Validar renta mensual solo para habitaciones privadas
    if (formData.room_type === 'private') {
      if (!formData.monthly_rent || formData.monthly_rent === '' || parseFloat(formData.monthly_rent) <= 0) {
        error = 'Por favor ingresa la renta mensual para habitaciones privadas';
        return;
      }
    }
    
    // Validar datos del inquilino si está ocupada (esto ya no se usa, pero por si acaso)
    if (formData.occupied && formData.room_type === 'private' && !formData.tenant_id) {
      // Esto ya no es necesario porque el tenant_id es opcional
      // Solo validamos que si está ocupada y es privada, tenga tenant_id o no esté ocupada
    }

    loading = true;
    error = '';

    try {
      // Preparar datos para enviar (sin inventory porque no está en la BD)
      const { inventory, ...dataToSend } = formData;
      
      // Limpiar campos UUID vacíos (convertir "" a null)
      if (dataToSend.tenant_id === '') {
        dataToSend.tenant_id = null;
        dataToSend.occupied = false;
      } else if (dataToSend.tenant_id) {
        // Si hay tenant_id, marcar como ocupada automáticamente
        dataToSend.occupied = true;
      }
      
      // Para salas comunes, asegurar que monthly_rent sea 0 o null
      if (dataToSend.room_type === 'common') {
        dataToSend.monthly_rent = 0;
        dataToSend.occupied = false;
        dataToSend.tenant_id = null;
      }
      
      // Convertir monthly_rent a número si es string
      if (dataToSend.monthly_rent && typeof dataToSend.monthly_rent === 'string') {
        dataToSend.monthly_rent = parseFloat(dataToSend.monthly_rent);
      }
      
      // Convertir size_sqm a número si es string
      if (dataToSend.size_sqm && typeof dataToSend.size_sqm === 'string') {
        dataToSend.size_sqm = parseFloat(dataToSend.size_sqm);
      }
      
      let createdRoom;
      if (room) {
        createdRoom = await roomsService.updateRoom(room.id, dataToSend);
        currentRoomId = createdRoom.id; // Actualizar el ID por si cambió
      } else {
        createdRoom = await roomsService.createRoom(dataToSend);
        // Actualizar roomId para que PhotoGallery pueda subir las fotos pendientes
        currentRoomId = createdRoom.id;
        // Actualizar el objeto room para que el resto del formulario funcione
        room = createdRoom;
      }
      
      // Actualizar formData con las fotos que pudieran haberse subido después de crear
      // Las fotos se guardarán automáticamente cuando PhotoGallery las suba
      // Esperar un momento para que PhotoGallery procese las fotos pendientes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar la habitación con las fotos finales
      if (formData.photos && formData.photos.length > 0) {
        // Filtrar solo las fotos que no son URLs temporales (blob:)
        const finalPhotos = formData.photos.filter((/** @type {string} */ p) => !(typeof p === 'string' && p.startsWith('blob:')));
        await roomsService.updateRoom(createdRoom.id, { photos: finalPhotos });
      }
      
      dispatch('success');
    } catch (err) {
      error = err.message || 'Error al guardar la habitación';
    } finally {
      loading = false;
    }
  }
  
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Progress Indicator -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Paso {currentStep} de {totalSteps}
      </span>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {Math.round(progressPercentage)}%
      </span>
    </div>
    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        class="h-full gradient-primary rounded-full transition-all duration-300"
        style="width: {progressPercentage}%"
      ></div>
    </div>
  </div>
  
  <!-- Paso 1: Datos Básicos -->
  {#if currentStep === 1}
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Datos Básicos</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Completa la información esencial de la habitación</p>
      </div>
      
      <!-- Tipo de habitación -->
      <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <DoorOpen size={16} class="inline mr-1" />
      Tipo de espacio *
    </label>
    <select bind:value={formData.room_type} class="input-glass">
      <option value="private">Habitación Privada (alquilable)</option>
      <option value="common">Sala Común (no alquilable)</option>
    </select>
    <p class="text-xs text-gray-500 mt-1">
      {formData.room_type === 'private' 
        ? 'Habitación que puede ser alquilada a inquilinos' 
        : 'Espacio común: cocina, salón, baños, etc. No se puede alquilar'}
    </p>
  </div>

  <!-- Nombre -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <DoorOpen size={16} class="inline mr-1" />
      Nombre {formData.room_type === 'common' ? 'del espacio' : 'de la habitación'} *
    </label>
    <input
      type="text"
      bind:value={formData.name}
      placeholder={formData.room_type === 'common' ? 'Ej: Cocina, Salón, Baño 1, Baño 2...' : 'Ej: Habitación 1'}
      class="input-glass"
      required
    />
  </div>

  <!-- Renta mensual (solo para habitaciones privadas) -->
  {#if formData.room_type === 'private'}
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <Euro size={16} class="inline mr-1" />
        Renta mensual (€) *
      </label>
      <input
        type="number"
        bind:value={formData.monthly_rent}
        placeholder="450"
        class="input-glass"
        min="0"
        step="0.01"
        required
      />
    </div>
  {/if}

    </div>
    <!-- Fin Paso 1 -->
  {/if}
  
  <!-- Paso 2: Opciones Avanzadas -->
  {#if currentStep === 2}
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Opciones Avanzadas</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Información adicional opcional</p>
      </div>
      
      <!-- Tamaño -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <Maximize size={16} class="inline mr-1" />
          Tamaño (m²)
        </label>
        <input
          type="number"
          bind:value={formData.size_sqm}
          placeholder="15"
          class="input-glass"
          min="0"
          step="0.1"
        />
      </div>

      <!-- Estado de ocupación (solo para habitaciones privadas) -->
  {#if formData.room_type === 'private'}
    <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
      <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
        <User size={20} class="text-orange-600" />
        Inquilino
      </h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Asignar Inquilino (opcional)
        </label>
        <select 
          bind:value={formData.tenant_id}
          class="input-glass"
          on:change={() => formData.occupied = !!formData.tenant_id}
        >
          <option value="">Sin inquilino (Disponible)</option>
          {#each availableTenants as tenant (tenant.id)}
            <option value={tenant.id}>{tenant.full_name}</option>
          {/each}
        </select>
        <p class="text-xs text-gray-500 mt-1">
          Selecciona un inquilino de la lista
        </p>
      </div>
      
      {#if selectedTenant}
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 class="font-semibold text-orange-900 mb-2">Datos del Inquilino</h4>
          <div class="space-y-1 text-sm">
            <p class="text-orange-800">
              <strong>Nombre:</strong> {selectedTenant.full_name}
            </p>
            {#if selectedTenant.email}
              <p class="text-orange-800">
                <strong>Email:</strong> {selectedTenant.email}
              </p>
            {/if}
            {#if selectedTenant.phone}
              <p class="text-orange-800">
                <strong>Teléfono:</strong> {selectedTenant.phone}
              </p>
            {/if}
            {#if selectedTenant.contract_end_date}
              {@const endDate = selectedTenant.contract_end_date ? (() => {
                try {
                  const date = new Date(selectedTenant.contract_end_date);
                  return isNaN(date.getTime()) ? null : date.toLocaleDateString('es-ES');
                } catch {
                  return null;
                }
              })() : null}
              {#if endDate}
                <p class="text-orange-800">
                  <strong>Contrato vence:</strong> {endDate}
                </p>
              {/if}
            {/if}
          </div>
        </div>
      {:else if formData.tenant_id}
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p class="text-sm text-yellow-800">
            ⚠️ Inquilino no encontrado
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p class="text-sm text-blue-800">
        ℹ️ <strong>Sala común:</strong> Este espacio no se puede alquilar. Es para uso compartido de todos los inquilinos.
      </p>
    </div>
  {/if}

  {#if false}
    <!-- Sección de Datos del Inquilino -->
    <div class="border-t border-gray-200 pt-4 mt-2">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <User size={20} class="text-orange-600" />
        Datos del Inquilino
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <User size={16} class="inline mr-1" />
            Nombre completo *
          </label>
          <input
            type="text"
            bind:value={formData.tenant_name}
            placeholder="Juan Pérez García"
            class="input-glass"
            required={formData.occupied}
          />
        </div>
        
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <Mail size={16} class="inline mr-1" />
            Email
          </label>
          <input
            type="email"
            bind:value={formData.tenant_email}
            placeholder="inquilino@email.com"
            class="input-glass"
          />
        </div>
        
        <!-- Teléfono -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <Phone size={16} class="inline mr-1" />
            Teléfono
          </label>
          <input
            type="tel"
            bind:value={formData.tenant_phone}
            placeholder="+34 600 000 000"
            class="input-glass"
          />
        </div>
        
        <!-- DNI -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard size={16} class="inline mr-1" />
            DNI/NIE
          </label>
          <input
            type="text"
            bind:value={formData.tenant_dni}
            placeholder="12345678A"
            class="input-glass"
          />
        </div>
      </div>
    </div>
    
    <!-- Sección de Contrato -->
    <div class="border-t border-gray-200 pt-4 mt-4">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={20} class="text-orange-600" />
        Datos del Contrato
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Fecha de inicio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} class="inline mr-1" />
            Fecha de inicio del contrato
          </label>
          <input
            type="date"
            bind:value={formData.contract_start_date}
            class="input-glass"
          />
        </div>
        
        <!-- Duración en meses -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <Clock size={16} class="inline mr-1" />
            Duración del contrato (meses)
          </label>
          <input
            type="number"
            bind:value={formData.contract_months}
            placeholder="12"
            min="1"
            max="120"
            class="input-glass"
          />
        </div>
        
        <!-- Fecha de finalización (calculada automáticamente) -->
        {#if formData.contract_end_date}
          <div class="md:col-span-2">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p class="text-sm text-blue-800">
                <Calendar size={16} class="inline mr-1" />
                <strong>Fecha de finalización:</strong> 
                {new Date(formData.contract_end_date).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
                {#if new Date(formData.contract_end_date) < new Date()}
                  <span class="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    ⚠️ Contrato vencido
                  </span>
                {:else if new Date(formData.contract_end_date) - new Date() < 30 * 24 * 60 * 60 * 1000}
                  <span class="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    ⏰ Vence pronto
                  </span>
                {/if}
              </p>
            </div>
          </div>
        {/if}
        
        <!-- Fianza -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <Shield size={16} class="inline mr-1" />
            Fianza/Depósito (€)
          </label>
          <div class="flex gap-2">
            <input
              type="number"
              bind:value={formData.deposit_amount}
              placeholder="450.00"
              min="0"
              step="0.01"
              class="input-glass flex-1"
            />
          </div>
        </div>
        
        <!-- Notas del contrato -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <FileText size={16} class="inline mr-1" />
            Notas del contrato
          </label>
          <textarea
            bind:value={formData.contract_notes}
            placeholder="Condiciones especiales, acuerdos adicionales..."
            class="input-glass resize-none"
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>
    
    <!-- Sección de Inventario -->
    <div class="border-t border-gray-200 pt-4 mt-4">
      <button
        type="button"
        on:click={() => showInventory = !showInventory}
        class="w-full flex items-center justify-between text-left mb-4"
      >
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} class="text-orange-600" />
          Inventario de Entrega
          {#if formData.inventory?.length > 0}
            <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              {formData.inventory.length} items
            </span>
          {/if}
        </h3>
        {#if showInventory}
          <ChevronUp size={20} class="text-gray-600" />
        {:else}
          <ChevronDown size={20} class="text-gray-600" />
        {/if}
      </button>
      
      {#if showInventory}
        <InventoryManager bind:inventory={formData.inventory} />
      {/if}
    </div>
  {/if}
  
  <!-- Sección de Fotos -->
  <div class="border-t border-gray-200 pt-4 mt-4">
    <button
      type="button"
      on:click={() => showPhotos = !showPhotos}
      class="w-full flex items-center justify-between text-left mb-4"
    >
      <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Camera size={20} class="text-orange-600" />
        Fotos de la {formData.room_type === 'common' ? 'Sala' : 'Habitación'}
        {#if formData.photos?.length > 0}
          <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
            {formData.photos.length} fotos
          </span>
        {/if}
      </h3>
      {#if showPhotos}
        <ChevronUp size={20} class="text-gray-600" />
      {:else}
        <ChevronDown size={20} class="text-gray-600" />
      {/if}
    </button>
    
    {#if showPhotos}
      <PhotoGallery 
        bind:photos={formData.photos}
        {propertyId}
        roomId={currentRoomId}
        canEdit={true}
      />
    {/if}
  </div>

      <!-- Notas -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <FileText size={16} class="inline mr-1" />
          Notas (opcional)
        </label>
        <textarea
          bind:value={formData.notes}
          placeholder="Detalles adicionales de la habitación"
          class="input-glass resize-none"
          rows="3"
        ></textarea>
      </div>
    </div>
    <!-- Fin Paso 2 -->
  {/if}

  <!-- Error -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
      {error}
    </div>
  {/if}

  <!-- Botones de navegación -->
  <div class="flex flex-col sm:flex-row gap-3 pt-4">
    <Button type="button" variant="secondary" on:click={() => dispatch('cancel')} className="w-full sm:w-auto">
      Cancelar
    </Button>
    
    {#if currentStep > 1}
      <Button type="button" variant="secondary" on:click={previousStep} className="w-full sm:w-auto">
        Anterior
      </Button>
    {/if}
    
    {#if currentStep < totalSteps}
      <Button type="button" on:click={nextStep} className="w-full sm:flex-1">
        Siguiente
      </Button>
    {:else}
      <Button type="submit" disabled={loading} className="w-full sm:flex-1">
        {loading ? 'Guardando...' : room ? 'Actualizar' : 'Crear Habitación'}
      </Button>
    {/if}
  </div>
</form>

