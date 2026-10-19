<script>
	import Img from '$lib/components/Img.svelte';

	let { data } = $props();

	// turns a normal YouTube link into an embeddable one
	function embedUrl(url) {
		if (!url) return null;
		const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return match ? `https://www.youtube.com/embed/${match[1]}` : url;
	}
</script>

<svelte:head>
	<title>{data.film.title} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1000px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/films" class="text-[14px] text-[#35c9b8] hover:underline">← Back to films</a>

	<div class="mt-6 flex flex-col gap-8 md:flex-row">
		<Img
			src={data.film.poster_url}
			alt={data.film.title}
			class="h-[420px] w-[300px] shrink-0 rounded-[20px] object-cover"
		/>

		<div class="flex-1">
			<h1 class="text-[36px] md:text-[42px]">{data.film.title}</h1>
			{#if data.film.year}<p class="text-[16px] text-[#8a8f8c]">{data.film.year}</p>{/if}

			{#if data.film.description}
				<p class="mt-5 whitespace-pre-line text-[17px] leading-relaxed text-[#c7cdc9]">
					{data.film.description}
				</p>
			{/if}

			{#if data.film.trailer_url}
				<div class="mt-6 aspect-video w-full overflow-hidden rounded-[15px]">
					<iframe
						src={embedUrl(data.film.trailer_url)}
						title="{data.film.title} trailer"
						class="h-full w-full"
						allowfullscreen
					></iframe>
				</div>
			{/if}
		</div>
	</div>

	{#if data.cast.length > 0}
		<div class="mt-12">
			<h2 class="text-[26px]">Cast</h2>
			<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each data.cast as member}
					<a
						href="/user/{member.username}"
						class="overflow-hidden rounded-[15px] border border-[#2a302d] bg-[#1b201d] transition hover:border-teal-400"
					>
						<Img src={member.avatar_url} alt={member.name} class="h-[160px] w-full object-cover" />
						<div class="p-3">
							<p class="text-[15px]">{member.name}</p>
							{#if member.role_name}<p class="text-[13px] text-[#8a8f8c]">as {member.role_name}</p>{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>