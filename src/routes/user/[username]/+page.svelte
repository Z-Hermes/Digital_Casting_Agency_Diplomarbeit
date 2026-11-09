<script>
	import { enhance } from '$app/forms';
	import Img from '$lib/components/Img.svelte';
	import { getStage, formatDate } from '$lib/filmStages.js';

	let { data, form } = $props();

	const statusLabels = {
		available: 'Available',
		on_set: 'On set',
		booked: 'Booked'
	};

	const roleLabels = {
		admin: 'Admin',
		director: 'Director',
		producer: 'Producer',
		actor: 'Actor',
		spectator: 'Film fan'
	};

	const jobTypeLabels = {
		film: 'Film',
		series: 'Series',
		theatre: 'Theatre',
		commercial: 'Commercial'
	};

	let role = $derived(data.profile.role);
	let isActor = $derived(role === 'actor');
	let isFilmmaker = $derived(role === 'director' || role === 'producer');

	// profile picture upload: the file dialog opens, the upload starts after choosing
	let fileInput = $state();
	let uploading = $state(false);

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
			<Img
				src={data.profile.avatar_url}
				alt={data.profile.name}
				class="h-[280px] w-[220px] rounded-[20px] object-cover"
			/>

			{#if isActor}
				{#if data.profile.availability}
					<span class="mt-4 block rounded-full border border-[#2f8f5b] bg-[#12301f] px-4 py-1.5 text-center text-[14px]">
						{statusLabels[data.profile.availability] ?? data.profile.availability}
					</span>
				{/if}
			{:else}
				<span class="mt-4 block rounded-full border border-[#2e332f] bg-[#1b201d] px-4 py-1.5 text-center text-[14px]">
					{roleLabels[role] ?? role}
				</span>
			{/if}

			{#if data.isOwner}
				<form
					method="POST"
					action="?/avatar"
					enctype="multipart/form-data"
					class="mt-3"
					use:enhance={() => {
						uploading = true;
						return async ({ update }) => {
							await update();
							uploading = false;
							if (fileInput) fileInput.value = '';
						};
					}}
				>
					<input
						bind:this={fileInput}
						type="file"
						name="photo"
						accept="image/jpeg,image/png,image/webp"
						class="hidden"
						onchange={() => fileInput.form.requestSubmit()}
					/>
					<button
						type="button"
						disabled={uploading}
						onclick={() => fileInput.click()}
						class="w-full cursor-pointer rounded-lg border border-[#2e332f] px-4 py-2 text-[14px] transition-colors hover:border-[#35c9b8] disabled:cursor-wait disabled:opacity-60"
					>
						{uploading ? 'Uploading…' : data.profile.avatar_url ? 'Change photo' : 'Upload photo'}
					</button>
				</form>

				{#if form?.photoError}
					<p role="alert" class="mt-2 text-[13px] text-[#e05a5a]">{form.photoError}</p>
				{/if}

				<a
					href="/user/{data.profile.username}/edit"
					class="mt-3 block w-full rounded-lg border border-[#2e332f] px-4 py-2 text-center text-[14px] transition-colors hover:border-[#35c9b8]"
				>
					Edit profile
				</a>
			{/if}
		</div>

		<!-- Info -->
		<div class="flex-1">
			<h1 class="text-[36px] md:text-[42px]">{data.profile.name}</h1>
			<p class="text-[16px] text-[#8a8f8c]">@{data.profile.username}</p>

			
			<!-- only on your own profile -->
			{#if data.user?.username === data.profile.username}
				<a
					href="/my-photos"
					class="mt-3 inline-block rounded-lg border border-[#35c9b8] px-4 py-2 text-[14px] text-[#35c9b8] transition-colors hover:bg-[#084a43]"
				>
					Manage photos
				</a>
			{/if}

			{#if isActor}
				<!-- ===== Actor: physical data, languages, bio, CV ===== -->
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
			{:else}
				<!-- ===== Director / producer / admin / film fan ===== -->
				<div class="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-[15px] text-[#c7cdc9] sm:grid-cols-3">
					<p><span class="text-[#8a8f8c]">Role:</span> {roleLabels[role] ?? role}</p>
					<p>
						<span class="text-[#8a8f8c]">Member since:</span>
						{new Date(data.profile.created_at).getFullYear()}
					</p>
					{#if isFilmmaker}
						<p><span class="text-[#8a8f8c]">Films:</span> {data.films.length}</p>
					{/if}
				</div>

				{#if isFilmmaker && data.isOwner}
					<a
						href="/films/new"
						class="mt-6 inline-block rounded-lg bg-teal-400 px-5 py-2 font-medium text-[#032624] transition hover:bg-teal-300"
					>
						Add film
					</a>
				{/if}
			{/if}
		</div>
	</div>

	<!-- ===== Actor: Credits ===== -->
	{#if isActor && data.credits.length > 0}
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

	<!-- ===== Director / producer: films and open casting calls ===== -->
	{#if isFilmmaker}
		<div class="mt-12">
			<h2 class="text-[26px]">Films</h2>
			{#if data.films.length > 0}
				<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{#each data.films as film}
						{@const filmStage = getStage(film.stage)}
						<a
							href="/films/{film.id}"
							class="overflow-hidden rounded-[15px] border border-[#2a302d] bg-[#1b201d] transition-colors hover:border-[#35c9b8]"
						>
							{#if film.poster_url}
								<img src={film.poster_url} alt={film.title} class="h-[160px] w-full object-cover" />
							{/if}
							<div class="p-3">
								<p class="text-[15px]">{film.title} {#if film.year}({film.year}){/if}</p>
								{#if filmStage}
									<span class="mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[12px] leading-none {filmStage.color}">
										{filmStage.badge}
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<p class="mt-3 text-[#8a8f8c]">No films yet.</p>
			{/if}
		</div>

		{#if data.jobs.length > 0}
			<div class="mt-12">
				<h2 class="text-[26px]">Open casting calls</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					{#each data.jobs as job}
						<div class="rounded-[15px] border border-[#2a302d] bg-[#1b201d] p-4">
							<p class="text-[16px]">{job.title}</p>
							<p class="mt-1 text-[13px] text-[#8a8f8c]">
								{jobTypeLabels[job.production_type] ?? job.production_type}{#if job.city} · {job.city}{/if}
							</p>
							{#if job.deadline}
								<p class="mt-1 text-[13px] text-[#8a8f8c]">Apply until {formatDate(job.deadline)}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- ===== Gallery (every role that has photos) ===== -->
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