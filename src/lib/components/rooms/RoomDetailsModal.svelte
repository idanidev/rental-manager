<script>
  import { 
    User, Mail, Phone, CreditCard, Calendar, Clock, Shield, 
    Euro, Package, FileText, AlertCircle, CheckCircle, XCircle 
  } from 'lucide-svelte';
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import { storageService } from '$lib/services/storage';
  
  export let open = false;
  export let room;
  
  function getPhotoUrl(path) {
    if (!path) return '';
    // Si ya es una URL completa, devolverla tal cual
    if (path.startsWith('http')) return path;
    // Si no, usar el servicio de storage
    return storageService.getPhotoUrl(path);
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  function getDaysUntilExpiration() {
    if (!room?.contract_end_date) return null;
    const endDate = new Date(room.contract_end_date);
    const today = new Date();
    const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  }
  
  $: daysUntilExpiration = getDaysUntilExpiration();
  $: contractExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;
  $: contractExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
</script>

<Modal bind:open title="Detalles de la Habitación" size="xl">
  {#if room}
    <div class="space-y-6">
      <!-- Header con estado -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">{room.name}</h2>
          <p class="text-gray-600 mt-1">
            {room.monthly_rent}€/mes
            {#if room.size_sqm}
              · {room.size_sqm} m²
            {/if}
          </p>
        </div>
        <span class="px-4 py-2 rounded-full text-sm font-semibold
          {room.occupied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
          {room.occupied ? '✓ Ocupada' : 'Disponible'}
        </span>
      </div>
      
      {#if room.occupied}
        <!-- Datos del Inquilino -->
        <div class="glass-card">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} class="text-orange-600" />
            Inquilino Actual
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Nombre completo</p>
              <p class="font-semibold text-gray-800">{room.tenant_name || '-'}</p>
            </div>
            
            {#if room.tenant_email}
              <div>
                <p class="text-sm text-gray-600 flex items-center gap-1">
                  <Mail size={14} /> Email
                </p>
                <a href="mailto:{room.tenant_email}" class="font-semibold text-orange-600 hover:underline">
                  {room.tenant_email}
                </a>
              </div>
            {/if}
            
            {#if room.tenant_phone}
              <div>
                <p class="text-sm text-gray-600 flex items-center gap-1">
                  <Phone size={14} /> Teléfono
                </p>
                <a href="tel:{room.tenant_phone}" class="font-semibold text-orange-600 hover:underline">
                  {room.tenant_phone}
                </a>
              </div>
            {/if}
            
            {#if room.tenant_dni}
              <div>
                <p class="text-sm text-gray-600 flex items-center gap-1">
                  <CreditCard size={14} /> DNI/NIE
                </p>
                <p class="font-semibold text-gray-800">{room.tenant_dni}</p>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Información del Contrato -->
        {#if room.contract_start_date || room.contract_end_date}
          <div class="glass-card">
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} class="text-orange-600" />
              Contrato de Alquiler
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#if room.contract_start_date}
                <div>
                  <p class="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar size={14} /> Fecha de inicio
                  </p>
                  <p class="font-semibold text-gray-800">{formatDate(room.contract_start_date)}</p>
                </div>
              {/if}
              
              {#if room.contract_months}
                <div>
                  <p class="text-sm text-gray-600 flex items-center gap-1">
                    <Clock size={14} /> Duración
                  </p>
                  <p class="font-semibold text-gray-800">{room.contract_months} meses</p>
                </div>
              {/if}
              
              {#if room.contract_end_date}
                <div>
                  <p class="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar size={14} /> Fecha de finalización
                  </p>
                  <p class="font-semibold text-gray-800">{formatDate(room.contract_end_date)}</p>
                </div>
                
                <!-- Estado del contrato -->
                <div>
                  <p class="text-sm text-gray-600">Estado</p>
                  {#if contractExpired}
                    <div class="flex items-center gap-2 text-red-600">
                      <XCircle size={16} />
                      <span class="font-semibold">Contrato vencido ({Math.abs(daysUntilExpiration)} días)</span>
                    </div>
                  {:else if contractExpiringSoon}
                    <div class="flex items-center gap-2 text-orange-600">
                      <AlertCircle size={16} />
                      <span class="font-semibold">Vence en {daysUntilExpiration} días</span>
                    </div>
                  {:else}
                    <div class="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span class="font-semibold">Vigente ({daysUntilExpiration} días restantes)</span>
                    </div>
                  {/if}
                </div>
              {/if}
              
              {#if room.deposit_amount}
                <div class="md:col-span-2">
                  <p class="text-sm text-gray-600 flex items-center gap-1">
                    <Shield size={14} /> Fianza/Depósito
                  </p>
                  <p class="font-semibold text-gray-800 text-xl">{parseFloat(room.deposit_amount).toFixed(2)}€</p>
                </div>
              {/if}
              
              {#if room.contract_notes}
                <div class="md:col-span-2">
                  <p class="text-sm text-gray-600 mb-2">Notas del contrato</p>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-gray-800 text-sm whitespace-pre-wrap">{room.contract_notes}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- Inventario -->
        {#if room.inventory && room.inventory.length > 0}
          <div class="glass-card">
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={20} class="text-orange-600" />
              Inventario Entregado
              <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                {room.inventory.length} items
              </span>
            </h3>
            
            <div class="space-y-2">
              {#each room.inventory as item}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex-1">
                    <p class="font-semibold text-gray-800">
                      {item.name}
                      {#if item.quantity > 1}
                        <span class="text-gray-600 text-sm ml-2">x{item.quantity}</span>
                      {/if}
                    </p>
                    {#if item.notes}
                      <p class="text-sm text-gray-600 mt-1">{item.notes}</p>
                    {/if}
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold
                    {item.condition === 'nuevo' ? 'bg-green-100 text-green-700' :
                     item.condition === 'bueno' ? 'bg-blue-100 text-blue-700' :
                     item.condition === 'usado' ? 'bg-yellow-100 text-yellow-700' :
                     item.condition === 'regular' ? 'bg-orange-100 text-orange-700' :
                     'bg-red-100 text-red-700'}">
                    {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <!-- Habitación disponible -->
        <div class="glass-card text-center py-12">
          <div class="text-6xl mb-4">🏠</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Habitación Disponible</h3>
          <p class="text-gray-600">
            Esta habitación está disponible para alquilar. No hay inquilino actualmente.
          </p>
        </div>
      {/if}
      
      <!-- Notas generales -->
      {#if room.notes}
        <div class="glass-card">
          <h3 class="text-lg font-bold text-gray-800 mb-2">Notas</h3>
          <p class="text-gray-700 whitespace-pre-wrap">{room.notes}</p>
        </div>
      {/if}
      
      <!-- Fotos de la Habitación -->
      {#if room.photos && room.photos.length > 0}
        <div class="glass-card">
          <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📸 Fotos de la Habitación
            <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              {room.photos.length}
            </span>
          </h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {#each room.photos as photo, index}
              <div class="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-500 transition-all cursor-pointer group">
                <img
                  src={getPhotoUrl(photo)}
                  alt="Foto {index + 1}"
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  on:error={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Botón cerrar -->
      <div class="pt-4 border-t border-gray-200">
        <Button fullWidth on:click={() => open = false}>
          Cerrar
        </Button>
      </div>
    </div>
  {/if}
</Modal>

