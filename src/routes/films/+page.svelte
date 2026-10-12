<script>
	import Img from '$lib/components/Img.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Films | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1124px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<h1 class="text-[32px] md:text-[42px]">Films</h1>
	<div class="mt-3 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	{#if data.films.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No films yet.</p>
	{:else}
		<div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.films as film}
				<a
					href="/films/{film.id}"
					class="overflow-hidden rounded-[20px] border border-[#2a302d] bg-[#1b201d] transition hover:border-teal-400"
				>
					<Img src={film.poster_url} alt={film.title} class="h-[280px] w-full object-cover" />
					<div class="p-4">
						<h3 class="text-[20px]">{film.title}</h3>
						{#if film.year}<p class="mt-1 text-[14px] text-[#8a8f8c]">{film.year}</p>{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>