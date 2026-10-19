<script>
	let { data } = $props();

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.article.title} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[800px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/news" class="text-[14px] text-[#35c9b8] hover:underline">← Back to news</a>

	{#if data.article.image_url}
		<img src={data.article.image_url} alt={data.article.title} class="mt-6 w-full rounded-[20px] object-cover" />
	{/if}

	{#if data.article.category === 'breaking'}
		<span class="mt-6 inline-block rounded-full bg-red-900/40 px-3 py-1 text-[12px] text-red-300">
			Breaking
		</span>
	{/if}

	<h1 class="mt-3 text-[32px] md:text-[42px]">{data.article.title}</h1>
	<p class="mt-2 text-[14px] text-[#8a8f8c]">
		{formatDate(data.article.created_at)}{#if data.article.author_name} · by {data.article.author_name}{/if}
	</p>

	<div class="mt-8 whitespace-pre-line text-[18px] leading-relaxed text-[#c7cdc9]">
		{data.article.body}
	</div>
</div>