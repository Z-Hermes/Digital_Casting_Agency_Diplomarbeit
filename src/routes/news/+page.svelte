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
	<title>News | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1124px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<h1 class="text-[32px] md:text-[42px]">News</h1>
	<div class="mt-3 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	{#if data.news.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No news yet.</p>
	{:else}
		<div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.news as article}
				<a
					href="/news/{article.id}"
					class="overflow-hidden rounded-[20px] border border-[#2a302d] bg-[#1b201d] transition hover:border-teal-400"
				>
					{#if article.image_url}
						<img src={article.image_url} alt={article.title} class="h-[180px] w-full object-cover" />
					{/if}
					<div class="p-4">
						{#if article.category === 'breaking'}
							<span class="inline-block rounded-full bg-red-900/40 px-3 py-1 text-[12px] text-red-300">
								Breaking
							</span>
						{/if}
						<h3 class="mt-2 text-[20px]">{article.title}</h3>
						<p class="mt-1 text-[14px] text-[#8a8f8c]">{article.excerpt}</p>
						<p class="mt-3 text-[12px] text-[#5f655f]">{formatDate(article.created_at)}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>