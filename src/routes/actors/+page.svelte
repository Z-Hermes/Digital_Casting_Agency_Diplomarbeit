<script>
	import defaultPfp from '$lib/assets/default-pfp.png';

	let { data } = $props();

	const statusLabels = {
		available: 'Available',
		on_set: 'On set',
		booked: 'Booked'
	};
</script>

<svelte:head>
	<title>Actors | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1124px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<h1 class="text-[32px] md:text-[42px]">Actor Database</h1>
	<div class="mt-3 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	<!-- Filters -->
	<form method="GET" class="mt-8 flex flex-wrap gap-3">
		<input
			type="text"
			name="search"
			value={data.filters.search}
			placeholder="Search by name..."
			class="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-[#162322] px-4 py-2 text-white outline-none placeholder:text-gray-400 focus:border-teal-400"
		/>

		<input
			type="text"
			name="city"
			value={data.filters.city}
			placeholder="City"
			class="rounded-lg border border-white/10 bg-[#162322] px-4 py-2 text-white outline-none placeholder:text-gray-400 focus:border-teal-400"
		/>

		<select
			name="gender"
			value={data.filters.gender}
			class="rounded-lg border border-white/10 bg-[#162322] px-4 py-2 text-gray-300 outline-none focus:border-teal-400"
		>
			<option value="">Any gender</option>
			<option value="female">Female</option>
			<option value="male">Male</option>
			<option value="other">Other</option>
		</select>

		<select
			name="availability"
			value={data.filters.availability}
			class="rounded-lg border border-white/10 bg-[#162322] px-4 py-2 text-gray-300 outline-none focus:border-teal-400"
		>
			<option value="">Any availability</option>
			<option value="available">Available</option>
			<option value="on_set">On set</option>
			<option value="booked">Booked</option>
		</select>

		<button
			type="submit"
			class="rounded-lg bg-teal-400 px-5 py-2 font-medium text-white transition hover:bg-teal-300"
		>
			Filter
		</button>
	</form>

	<!-- Results -->
	{#if data.actors.length === 0}
		<p class="mt-10 text-[#8a8f8c]">No actors match these filters.</p>
	{:else}
		<div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.actors as actor}
				<a
					href="/user/{actor.username}"
					class="overflow-hidden rounded-[20px] border border-[#2a302d] bg-[#1b201d] transition hover:border-teal-400"
				>
					<img
						src={actor.avatar_url || defaultPfp}
						alt={actor.name}
						class="h-[220px] w-full object-cover"
					/>
					<div class="p-4">
						<h3 class="text-[20px]">{actor.name}</h3>
						<p class="mt-1 text-[14px] text-[#8a8f8c]">{actor.city ?? 'Unknown city'}</p>
						<span class="mt-3 inline-block rounded-full border border-[#2f8f5b] bg-[#12301f] px-3 py-1 text-[13px]">
							{statusLabels[actor.availability] ?? actor.availability}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>