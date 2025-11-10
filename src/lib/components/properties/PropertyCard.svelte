<script>
  import { Home, MapPin, Users, TrendingUp } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import GlassCard from '../ui/GlassCard.svelte';
  
  export let property;
  
  const role = property.property_access?.[0]?.role || 'viewer';
  // Solo contar habitaciones privadas (excluir salas comunes)
  const privateRooms = property.rooms?.filter(r => r.room_type !== 'common') || [];
  const roomCount = privateRooms.length;
  const occupiedRooms = privateRooms.filter(r => r.occupied).length;
  const occupancyRate = roomCount > 0 ? (occupiedRooms / roomCount * 100).toFixed(0) : 0;

  function handleClick() {
    goto(`/properties/${property.id}`);
  }
</script>

<GlassCard>
  <div 
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
    role="button"
    tabindex="0"
    class="w-full text-left space-y-3 cursor-pointer"
  >
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2">
        <div class="p-2 gradient-primary rounded-lg">
          <Home size={20} class="text-white" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-bold text-gray-800">
            {property.name}
          </h3>
          <div class="flex items-center text-xs sm:text-sm text-gray-600 mt-0.5">
            <MapPin size={12} class="mr-1" />
            <span class="truncate">{property.address}</span>
          </div>
        </div>
      </div>
      
      <!-- Role Badge -->
      <span class="px-3 py-1 rounded-full text-xs font-semibold
        {role === 'owner' ? 'bg-purple-100 text-purple-700' : 
         role === 'editor' ? 'bg-blue-100 text-blue-700' : 
         'bg-gray-100 text-gray-700'}">
        {role === 'owner' ? 'Propietario' : role === 'editor' ? 'Editor' : 'Visor'}
      </span>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <div class="stat-card">
        <div class="flex items-center gap-1.5 mb-1">
          <Users size={16} class="text-purple-600" />
          <span class="stat-label text-xs">Habitaciones</span>
        </div>
        <div class="stat-value text-xl">
          {occupiedRooms}/{roomCount}
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center gap-1.5 mb-1">
          <TrendingUp size={16} class="text-pink-600" />
          <span class="stat-label text-xs">Ocupación</span>
        </div>
        <div class="stat-value text-xl">
          {occupancyRate}%
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        style="width: {occupancyRate}%"
      ></div>
    </div>
  </div>
</GlassCard>
