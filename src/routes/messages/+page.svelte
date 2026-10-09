<script>
	let { data } = $props();

	function formatDate(dateStr) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>Inbox | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[800px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<h1 class="text-[32px] md:text-[42px]">Inbox</h1>
	<div class="mt-3 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	{#if data.conversations.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No conversations yet.</p>
	{:else}
		<div class="mt-8 flex flex-col gap-2">
			{#each data.conversations as conv}
				<a
					href="/messages/{conv.id}"
					class="flex items-center justify-between rounded-[15px] border border-[#2a302d] bg-[#1b201d] px-5 py-4 transition hover:border-teal-400"
				>
					<div>
						<p class="text-[18px]">
							{conv.other_name}
							{#if conv.unread_count > 0}
								<span class="ml-2 rounded-full bg-teal-400 px-2 py-0.5 text-[12px] text-black">
									{conv.unread_count}
								</span>
							{/if}
						</p>
						<p class="mt-1 truncate text-[14px] text-[#8a8f8c]">{conv.last_body ?? 'No messages yet'}</p>
					</div>
					<span class="shrink-0 text-[12px] text-[#5f655f]">{formatDate(conv.last_date)}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>