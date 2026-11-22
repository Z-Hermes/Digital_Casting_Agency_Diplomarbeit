<script>
  let { data } = $props();
</script>

<svelte:head>
  <title>For You Page | Digital Casting Agency</title>
</svelte:head>

<!-- Vertikaler Scrolling-Frame -->
<div class="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-none">
  {#each data.posts as post (post.id)}
    <div class="h-screen w-full snap-start flex items-center justify-center relative">
      
      <!-- Frame-Container -->
      <div class="w-full h-full max-w-md bg-[#162322] flex items-center justify-center relative overflow-hidden">
        
        <!-- Platzhalter für Medieninhalte -->
        <div class="text-center text-gray-400">
          <h2 class="text-lg font-bold text-white">{post.title}</h2>
          <p class="text-sm text-teal-400">@{post.author}</p>
        </div>

        <!-- Schwebende Likes & Kommentare (Rechts unten im Frame) -->
        <div class="absolute right-4 bottom-16 flex flex-col items-center gap-4 z-10">
          
          <!-- Like Button -->
          <button class="flex flex-col items-center gap-1 group cursor-pointer">
            <div class="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-xl transition group-hover:bg-black/60">
              <i class="fa-solid fa-heart"></i>
            </div>
            <span class="text-xs text-white font-medium drop-shadow">{post.likes}</span>
          </button>

          <!-- Kommentar Button -->
          <button class="flex flex-col items-center gap-1 group cursor-pointer">
            <div class="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-xl transition group-hover:bg-black/60">
              <i class="fa-solid fa-comment"></i>
            </div>
            <span class="text-xs text-white font-medium drop-shadow">{post.comments}</span>
          </button>

        </div>

      </div>

    </div>
  {/each}
</div>

<style>
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>