<div class="glass-card animate-pulse">
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        <div class="space-y-2">
          <div class="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div class="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
      <div class="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
    </div>
    
    <!-- Content -->
    <div class="space-y-2">
      <div class="h-3 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
      <div class="h-3 w-3/4 bg-gray-200 dark:bg-gray-600 rounded"></div>
    </div>
    
    <!-- Footer -->
    <div class="flex gap-2 pt-2">
      <div class="h-8 w-full bg-gray-200 dark:bg-gray-600 rounded-xl"></div>
      <div class="h-8 w-full bg-gray-200 dark:bg-gray-600 rounded-xl"></div>
    </div>
  </div>
</div>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>

