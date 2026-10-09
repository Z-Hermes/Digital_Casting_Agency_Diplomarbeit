<script>
	let { data, form } = $props();

	function formatTime(dateStr) {
		return new Date(dateStr).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{data.conversation.other_name} | HD Studios</title>
</svelte:head>

<div class="mx-auto flex h-[calc(100vh-120px)] max-w-[800px] flex-col px-5 py-6 text-[#f2f2f0] md:px-10">
	<a href="/messages" class="text-[14px] text-[#35c9b8] hover:underline">← Back to inbox</a>
	<h1 class="mt-3 text-[26px]">{data.conversation.other_name}</h1>

	<div class="mt-5 flex-1 overflow-y-auto rounded-[15px] border border-[#2a302d] bg-[#1b201d] p-5">
		{#if data.messages.length === 0}
			<p class="text-[#8a8f8c]">No messages yet. Say hello!</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.messages as msg}
					<div class={msg.sender_id === data.currentUserId ? 'ml-auto max-w-[70%]' : 'mr-auto max-w-[70%]'}>
						<div
							class="rounded-[15px] px-4 py-2 {msg.sender_id === data.currentUserId
								? 'bg-teal-400 text-black'
								: 'bg-[#2a302d] text-white'}"
						>
							{msg.body}
						</div>
						<p class="mt-1 text-[11px] text-[#5f655f]">{formatTime(msg.created_at)}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if form?.error}
		<p class="mt-2 text-sm text-red-400">{form.error}</p>
	{/if}

	<form method="POST" class="mt-4 flex gap-3">
		<input
			name="body"
			type="text"
			required
			placeholder="Type a message..."
			class="flex-1 rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:border-teal-400"
		/>
		<button
			type="submit"
			class="rounded-lg bg-teal-400 px-5 py-3 font-medium text-black transition hover:bg-teal-300"
		>
			Send
		</button>
	</form>
</div>