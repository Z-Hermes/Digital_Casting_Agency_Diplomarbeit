<script>
	// Poster card for a film.
	// Films page:  <FilmCard title={film.title} year={film.year} image={film.poster_url}
	//                        stage={film.stage} deadline={film.casting_deadline} href="/films/{film.id}" />
	// Credits:     <FilmCard size="small" title={credit.title} year={credit.year}
	//                        role={credit.role_name} image={credit.poster_url} />
	// Without href the card is not clickable (credits are not always films on the platform).
	import filmRoll from '$lib/assets/film_roll_teal.png';
	import { getStage, formatDate } from '$lib/filmStages.js';

	let {
		title,
		year = null,
		role = '',
		image = '',
		stage = '',
		deadline = null,
		href = '',
		size = 'large',
		class: className = ''
	} = $props();

	let isLarge = $derived(size === 'large');
	let stageInfo = $derived(getStage(stage));
	let isCasting = $derived(stage === 'casting');

	// remembers a poster that failed to load -> the placeholder is shown instead
	let failedImage = $state(null);
	let showPoster = $derived(image && image !== failedImage);
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	href={href || undefined}
	class="flex flex-col overflow-hidden rounded-[15px] border bg-[#1b201d] {isCasting
		? 'border-[#35c9b8]/60'
		: 'border-[#2e332f]'} {href ? 'transition-colors hover:border-[#35c9b8]' : ''} {className}"
>
	<!-- poster in film-poster format (2:3) -->
	<div class="relative aspect-[2/3] bg-gradient-to-b from-[#0f3b37] to-[#101413]">
		{#if showPoster}
			<img src={image} alt={title} class="h-full w-full object-cover" onerror={() => (failedImage = image)} />
		{:else}
			<!-- no poster yet: film frame as placeholder -->
			<img src={filmRoll} alt="" class="absolute top-[18%] left-1/2 w-3/4 -translate-x-1/2 opacity-70" />
		{/if}

		<!-- stage label (not shown for released films or credits) -->
		{#if stageInfo && stage !== 'released'}
			<span
				class="absolute top-3 left-3 rounded-full border px-3 py-1 text-[12px] leading-none {stageInfo.color}"
			>
				{stageInfo.badge}
			</span>
		{/if}

		<!-- title over a dark fade at the bottom of the poster -->
		<div
			class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101413] via-[#101413]/85 to-transparent {isLarge
				? 'px-4 pt-16 pb-4'
				: 'px-3 pt-12 pb-3'}"
		>
			<h3 class="leading-tight {isLarge ? 'text-[20px]' : 'text-[15px]'}">{title}</h3>
			{#if year}
				<p class="mt-1 text-[#a9b0ab] {isLarge ? 'text-[14px]' : 'text-[12px]'}">{year}</p>
			{/if}
			{#if role}
				<p class="text-[#a9b0ab] {isLarge ? 'text-[14px]' : 'text-[12px]'}">as {role}</p>
			{/if}
		</div>
	</div>

	<!-- casting films get a strip with the deadline -->
	{#if isCasting}
		<div class="flex items-center justify-between gap-2 px-4 py-3 text-[13px]">
			<span class="whitespace-nowrap text-[#a9b0ab]">
				{#if deadline}Until {formatDate(deadline, false)}{:else}Open now{/if}
			</span>
			<span class="font-semibold text-[#35c9b8]">Apply</span>
		</div>
	{/if}
</svelte:element>