<script>
	import Avatar from '$lib/components/Avatar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';

	let { data, form } = $props();

	// asks before deactivating; "Cancel" stops the form
	function confirmAction(message) {
		return (event) => {
			if (!confirm(message)) event.preventDefault();
		};
	}
</script>

<svelte:head>
	<title>Manage actors | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1124px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
		<div>
			<p class="text-[14px] text-[#35c9b8]">Admin</p>
			<h1 class="text-[32px] md:text-[42px]">Manage actors</h1>
			<p class="mt-1 text-[15px] text-[#8a8f8c]">
				{data.actors.length}
				{data.actors.length === 1 ? 'actor' : 'actors'}{#if data.search}&nbsp;found for "{data.search}"{/if}
			</p>
		</div>

		<form method="GET">
			<SearchBar value={data.search} placeholder="Search actors" />
		</form>
	</div>

	<!-- result of the last action -->
	{#if form?.message}
		<p class="mt-6 rounded-[10px] border border-[#35c9b8]/60 bg-[#0f2523] px-4 py-3 text-[15px]" role="status">
			{form.message}
		</p>
	{:else if form?.error}
		<p class="mt-6 rounded-[10px] border border-[#e05a5a]/60 bg-[#3a1414] px-4 py-3 text-[15px]" role="alert">
			{form.error}
		</p>
	{/if}

	{#if data.actors.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No actors found.</p>
	{:else}
		<ul class="mt-6 flex flex-col gap-3">
			{#each data.actors as actor (actor.id)}
				<li
					class="flex flex-col gap-4 rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-4 lg:flex-row lg:items-center {actor.blocked
						? 'opacity-60'
						: ''}"
				>
					<!-- who -->
					<div class="flex min-w-0 flex-1 items-center gap-4">
						<Avatar src={actor.avatar_url} alt={actor.name} class="h-14 w-14 shrink-0" />
						<div class="min-w-0">
							<p class="flex flex-wrap items-center gap-2 text-[18px]">
								{actor.name}
								{#if actor.blocked}
									<span class="rounded-full border border-[#666] bg-[#222] px-2.5 py-0.5 text-[12px] text-[#ccc]">
										Deactivated
									</span>
								{/if}
							</p>
							<p class="truncate text-[14px] text-[#8a8f8c]">@{actor.username} | {actor.email}</p>
						</div>
					</div>

					<!-- profile info -->
					<div class="flex items-center gap-4 text-[14px] text-[#c7cdc9] lg:w-[220px]">
						<span class="w-[90px]">{actor.city ?? 'No city'}</span>
						{#if actor.availability}
							<StatusBadge status={actor.availability} class="text-[13px]" />
						{/if}
					</div>

					<!-- actions -->
					<div class="flex flex-wrap gap-2">
						<a
							href="/admin/actors/{actor.id}"
							class="rounded-lg border border-[#35c9b8] px-4 py-2 text-[14px] text-[#35c9b8] transition-colors hover:bg-[#084a43]"
						>
							Edit
						</a>

						<form
							method="POST"
							action="?/toggleBlocked"
							onsubmit={actor.blocked
								? undefined
								: confirmAction(`Deactivate ${actor.name}? They will be logged out and hidden from the website.`)}
						>
							<input type="hidden" name="id" value={actor.id} />
							{#if actor.blocked}
								<button
									class="cursor-pointer rounded-lg bg-[#084a43] px-4 py-2 text-[14px] text-[#bfeee6] transition-colors hover:bg-[#0b5f56]"
								>
									Activate
								</button>
							{:else}
								<button
									class="cursor-pointer rounded-lg border border-[#e05a5a]/70 px-4 py-2 text-[14px] text-[#f5c4c4] transition-colors hover:bg-[#3a1414]"
								>
									Deactivate
								</button>
							{/if}
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>