<script>
	import defaultPfp from '$lib/assets/default-pfp.png';

	let { data } = $props();

	const statusLabels = {
		available: 'Available',
		on_set: 'On set',
		booked: 'Booked'
	};

	function age(birthDate) {
		if (!birthDate) return null;
		const diff = Date.now() - new Date(birthDate).getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
	}
</script>

<svelte:head>
	<title>{data.profile.name} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1000px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<div class="flex flex-col gap-8 md:flex-row">
		<!-- Photo + status -->
		<div class="shrink-0">
			<img
				src={data.profile.avatar_url || defaultPfp}
				alt={data.profile.name}
				class="h-[280px] w-[220px] rounded-[20px] object-cover"
			/>
			{#if data.profile.availability}
				<span class="mt-4 block rounded-full border border-[#2f8f5b] bg-[#12301f] px-4 py-1.5 text-center text-[14px]">
					{statusLabels[data.profile.availability] ?? data.profile.availability}
				</span>
			{/if}
		</div>

		<!-- Info -->
		<div class="flex-1">
			<h1 class="text-[36px] md:text-[42px]">{data.profile.name}</h1>
			<p class="text-[16px] text-[#8a8f8c]">@{data.profile.username}</p>

			<div class="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-[15px] text-[#c7cdc9] sm:grid-cols-3">
				{#if data.profile.city}<p><span class="text-[#8a8f8c]">City:</span> {data.profile.city}</p>{/if}
				{#if age(data.profile.birth_date)}<p><span class="text-[#8a8f8c]">Age:</span> {age(data.profile.birth_date)}</p>{/if}
				{#if data.profile.gender}<p><span class="text-[#8a8f8c]">Gender:</span> {data.profile.gender}</p>{/if}
				{#if data.profile.height_cm}<p><span class="text-[#8a8f8c]">Height:</span> {data.profile.height_cm} cm</p>{/if}
				{#if data.profile.eye_color}<p><span class="text-[#8a8f8c]">Eyes:</span> {data.profile.eye_color}</p>{/if}
				{#if data.profile.hair_color}<p><span class="text-[#8a8f8c]">Hair:</span> {data.profile.hair_color}</p>{/if}
			</div>

			{#if data.languages.length > 0}
				<div class="mt-5">
					<p class="text-[14px] text-[#8a8f8c]">Languages</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each data.languages as lang}
							<span class="rounded-full bg-[#1b201d] px-3 py-1 text-[13px]">{lang}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.profile.bio}
				<div class="mt-6">
					<p class="text-[14px] text-[#8a8f8c]">Bio</p>
					<p class="mt-2 whitespace-pre-line text-[16px] leading-relaxed text-[#c7cdc9]">{data.profile.bio}</p>
				</div>
			{/if}

			{#if data.profile.cv_url}
				<a
					href={data.profile.cv_url}
					target="_blank"
					rel="noopener"
					class="mt-6 inline-block rounded-lg bg-teal-400 px-5 py-2 font-medium text-black transition hover:bg-teal-300"
				>
					Download CV
				</a>
			{/if}
		</div>
	</div>

	<!-- Credits -->
	{#if data.credits.length > 0}
		<div class="mt-12">
			<h2 class="text-[26px]">Credits</h2>
			<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each data.credits as credit}
					<div class="overflow-hidden rounded-[15px] border border-[#2a302d] bg-[#1b201d]">
						{#if credit.poster_url}
							<img src={credit.poster_url} alt={credit.title} class="h-[160px] w-full object-cover" />
						{/if}
						<div class="p-3">
							<p class="text-[15px]">{credit.title} {#if credit.year}({credit.year}){/if}</p>
							{#if credit.role_name}<p class="text-[13px] text-[#8a8f8c]">as {credit.role_name}</p>{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Gallery -->
	{#if data.media.length > 0}
		<div class="mt-12">
			<h2 class="text-[26px]">Gallery</h2>
			<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each data.media as item}
					{#if item.type === 'photo'}
						<img src={item.url} alt="" class="aspect-square w-full rounded-[15px] object-cover" />
					{:else}
						<div class="flex aspect-square w-full items-center justify-center rounded-[15px] bg-[#1b201d] text-[#8a8f8c]">
							Video
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>