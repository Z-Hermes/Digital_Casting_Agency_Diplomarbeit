<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	function formatTime(dateStr) {
		return new Date(dateStr).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const statusLabel = {
		pending: 'Pending',
		accepted: '✓ Accepted',
		declined: '✗ Declined'
	};

	const statusClass = {
		pending: 'border-white/15 text-[#c9cdca]',
		accepted: 'border-teal-400 bg-teal-400/15 text-teal-300',
		declined: 'border-red-400/60 bg-red-400/10 text-red-300'
	};
</script>

<!-- Accept / Decline buttons: only the recipient sees them, only while pending -->
{#snippet respondButtons(msg)}
	{#if msg.status === 'pending' && msg.recipient_id === data.currentUserId}
		<div class="mt-3 flex gap-2">
			<form method="POST" action="?/accept" use:enhance>
				<input type="hidden" name="message_id" value={msg.id} />
				<button
					type="submit"
					class="rounded-lg bg-teal-400 px-4 py-2 text-[14px] font-medium text-[#032624] hover:bg-teal-300"
				>
					Accept
				</button>
			</form>
			<form method="POST" action="?/decline" use:enhance>
				<input type="hidden" name="message_id" value={msg.id} />
				<button
					type="submit"
					class="rounded-lg border border-white/20 px-4 py-2 text-[14px] text-[#e4e6e4] hover:border-red-400 hover:text-red-300"
				>
					Decline
				</button>
			</form>
		</div>
	{:else if msg.status === 'pending' && msg.sender_id === data.currentUserId}
		<p class="mt-3 text-[13px] text-[#8a8f8c]">Waiting for an answer…</p>
	{/if}
{/snippet}

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
						{#if msg.type === 'application'}
							<!-- Application card: film, actor profile and the message -->
							<div class="rounded-[15px] border border-teal-400/40 bg-[#162322] p-4">
								<div class="flex items-center justify-between gap-3">
									<p class="text-[12px] uppercase tracking-wide text-teal-300">Application</p>
									{#if msg.status}
										<span class="rounded-full border px-2 py-0.5 text-[11px] {statusClass[msg.status]}">
											{statusLabel[msg.status]}
										</span>
									{/if}
								</div>

								<p class="mt-1 text-[17px] font-medium">{msg.film_title ?? msg.subject}</p>

								<div class="mt-3 flex items-center gap-3">
									{#if msg.sender_avatar}
										<img src={msg.sender_avatar} alt="" class="h-11 w-11 rounded-full object-cover" />
									{:else}
										<div class="flex h-11 w-11 items-center justify-center rounded-full bg-teal-900 text-teal-200">
											{msg.sender_name?.[0] ?? '?'}
										</div>
									{/if}
									<div class="min-w-0">
										<a href="/user/{msg.sender_username}" class="font-medium text-[#35c9b8] hover:underline">
											{msg.sender_name}
										</a>
										<p class="text-[13px] text-[#8a8f8c]">
											@{msg.sender_username}{msg.sender_city ? ` · ${msg.sender_city}` : ''}
										</p>
									</div>
								</div>

								{#if msg.body}
									<p class="mt-3 whitespace-pre-line text-[15px] text-[#e4e6e4]">{msg.body}</p>
								{/if}

								<a
									href="/user/{msg.sender_username}"
									class="mt-4 inline-block rounded-lg bg-teal-400 px-4 py-2 text-[14px] font-medium text-[#032624] hover:bg-teal-300"
								>
									View actor profile
								</a>

								{@render respondButtons(msg)}

								{#if msg.status === 'accepted'}
									<p class="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-3 py-2 text-[14px] font-medium text-teal-300">
										✓ Accepted
									</p>
								{:else if msg.status === 'declined'}
									<p class="mt-4 rounded-lg border border-red-400/50 bg-red-400/10 px-3 py-2 text-[14px] font-medium text-red-300">
										✗ Declined
									</p>
								{/if}
							</div>
						{:else if msg.type === 'notice'}
							<div
								class="rounded-[15px] border px-4 py-2 text-[14px] {msg.body.includes('declined')
									? 'border-red-400/40 bg-red-400/10 text-red-300'
									: 'border-teal-400/40 bg-teal-400/10 text-teal-300'}"
							>
								{msg.body}
							</div>
						{:else}
							<div
								class="rounded-[15px] px-4 py-2 {msg.sender_id === data.currentUserId
									? 'bg-teal-400 text-black'
									: 'bg-[#2a302d] text-white'}"
							>
								{msg.body}
							</div>
							{#if msg.type === 'invitation' && msg.status}
								<p class="mt-1 text-[12px] text-[#8a8f8c]">Invitation · {statusLabel[msg.status]}</p>
								{@render respondButtons(msg)}
							{/if}
						{/if}
						<p class="mt-1 text-[11px] text-[#5f655f]">{formatTime(msg.created_at)}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if form?.error}
		<p class="mt-2 text-sm text-red-400">{form.error}</p>
	{/if}

	<form method="POST" action="?/send" use:enhance class="mt-4 flex gap-3">
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