<script>
	import FilmCard from '$lib/components/FilmCard.svelte';
	import { filmStages } from '$lib/filmStages.js';

	let { data } = $props();

	// one section per stage, only stages that have films
	let sections = $derived(
		filmStages
			.map((stage) => ({ ...stage, films: data.films.filter((film) => film.stage === stage.key) }))
			.filter((section) => section.films.length > 0)
	);
</script>

<svelte:head>
	<title>Films | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1124px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<h1 class="text-[32px] md:text-[42px]">Films</h1>
	<div class="mt-3 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	{#if sections.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No films yet.</p>
	{:else}
		<!-- jump links to the sections -->
		<nav class="mt-8 flex flex-wrap gap-2">
			{#each sections as section}
				<a
					href="#{section.key}"
					class="rounded-full border border-[#2e332f] bg-[#1b201d] px-4 py-1.5 text-[14px] transition-colors hover:border-[#35c9b8]"
				>
					{section.title}
					<span class="text-[#8a8f8c]">{section.films.length}</span>
				</a>
			{/each}
		</nav>

		{#each sections as section}
			<section id={section.key} class="mt-12 scroll-mt-6">
				<h2 class="text-[26px] md:text-[30px]">{section.title}</h2>
				<p class="mt-1 text-[15px] text-[#8a8f8c]">{section.description}</p>

				<div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
					{#each section.films as film}
						<FilmCard
							title={film.title}
							year={film.year}
							image={film.poster_url}
							stage={film.stage}
							deadline={film.casting_deadline}
							href="/films/{film.id}"
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>