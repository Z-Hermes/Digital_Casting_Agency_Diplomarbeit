<script>
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import Img from '$lib/components/Img.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import ProfileSection from '$lib/components/ProfileSection.svelte';
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

	// names of the built-in blocks (shown in edit mode)
	const builtinLabels = {
		attributes: 'Attributes',
		credits: 'Credits',
		films: 'Films',
		jobs: 'Open casting calls',
		photos: 'Photos'
	};

	const sectionTypeLabels = { text: 'Text', list: 'List', gallery: 'Gallery' };

	let role = $derived(data.profile.role);
	let isActor = $derived(role === 'actor');
	let isFilmmaker = $derived(role === 'director' || role === 'producer');

	// profile picture upload: the file dialog opens, the upload starts after choosing
	let fileInput = $state();
	let uploading = $state(false);

	// ===== edit mode ("Edit sections") =====
	let editing = $state(false);

	// order of the blocks while editing (changed by drag & drop or ▲ ▼)
	let order = $state([]);
	let dragKey = $state(null);

	// visitors (and the owner outside edit mode) see the saved order
	let shownOrder = $derived(editing ? order : data.layout);
	let orderChanged = $derived(editing && order.join(',') !== data.layout.join(','));

	let sectionsByKey = $derived(Object.fromEntries(data.sections.map((s) => [s.key, s])));

	// after adding / deleting a section the saved layout changes:
	// keep the order the user is arranging, add new blocks, drop deleted ones
	$effect(() => {
		const saved = data.layout;
		untrack(() => {
			if (!editing) return;
			const kept = order.filter((key) => saved.includes(key));
			order = [...kept, ...saved.filter((key) => !kept.includes(key))];
		});
	});

	function startEditing() {
		order = [...data.layout];
		editing = true;
	}

	function stopEditing() {
		if (orderChanged && !confirm('The new order is not saved. Leave anyway?')) return;
		editing = false;
	}

	// ----- drag & drop (HTML Drag and Drop API) -----
	function onDragStart(event, key) {
		dragKey = key;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', key);
		// show the whole block while dragging, not only the handle bar
		const block = event.currentTarget.closest('[data-block]');
		if (block) event.dataTransfer.setDragImage(block, 20, 20);
	}

	function onDragOver(event, key) {
		if (!dragKey) return;
		event.preventDefault(); // allows dropping here
		if (key === dragKey) return;

		// move the dragged block to the place of the block under the mouse
		const from = order.indexOf(dragKey);
		const to = order.indexOf(key);
		const next = [...order];
		next.splice(from, 1);
		next.splice(to, 0, dragKey);
		order = next;
	}

	function onDragEnd() {
		dragKey = null;
	}

	// ----- ▲ ▼ buttons (phones, keyboard) -----
	function move(key, direction) {
		const from = order.indexOf(key);
		const to = from + direction;
		if (to < 0 || to >= order.length) return;
		const next = [...order];
		[next[from], next[to]] = [next[to], next[from]];
		order = next;
	}

	// does this block have something to show?
	function hasContent(key) {
		if (key === 'attributes') return isActor;
		if (key === 'credits') return data.credits.length > 0;
		if (key === 'films') return isFilmmaker;
		if (key === 'jobs') return data.jobs.length > 0;
		if (key === 'photos') return data.media.length > 0;
		return key in sectionsByKey;
	}

	function blockLabel(key) {
		const section = sectionsByKey[key];
		if (section) return `${section.title} · ${sectionTypeLabels[section.type]}`;
		return builtinLabels[key] ?? key;
	}

	// ===== photo viewer (lightbox) =====
	let viewer = $state({ photos: [], index: null });
	let legacyPhotoUrls = $derived(data.media.filter((m) => m.type === 'photo').map((m) => m.url));

	function openPhotos(photos, index) {
		viewer.photos = photos;
		viewer.index = index;
	}

	function age(birthDate) {
		if (!birthDate) return null;
		const diff = Date.now() - new Date(birthDate).getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
	}

	// "a\nb" -> ["a", "b"]  (for awards)
	function lines(text) {
		return String(text ?? '')
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line !== '');
	}

	const smallButton = 'cursor-pointer rounded-lg px-4 py-2 text-[14px] transition-colors';
	const field =
		'w-full rounded-[10px] border border-[#2e332f] bg-[#232825] px-4 py-2.5 text-[15px] text-[#f2f2f0] outline-none focus:border-[#35c9b8]';
	const iconButton =
		'cursor-pointer rounded-md border border-[#2e332f] px-2.5 py-1 text-[13px] hover:border-[#35c9b8] disabled:cursor-default disabled:opacity-30';
</script>


<svelte:head>
	<title>{data.profile.name} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1000px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<!-- ===================== HEADER (always at the top) ===================== -->
	<div class="flex flex-col gap-8 md:flex-row">
		<!-- Photo + status + owner buttons -->
		<div class="w-[220px] shrink-0">
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
					Edit profile info
				</a>

				{#if editing}
					<button
						type="button"
						onclick={stopEditing}
						class="mt-3 w-full cursor-pointer rounded-lg bg-[#35c9b8] px-4 py-2 text-[14px] font-medium text-[#101413] hover:bg-[#5fd8ca]"
					>
						Done
					</button>
				{:else}
					<button
						type="button"
						onclick={startEditing}
						class="mt-3 w-full cursor-pointer rounded-lg bg-[#35c9b8] px-4 py-2 text-[14px] font-medium text-[#101413] hover:bg-[#5fd8ca]"
					>
						Edit sections
					</button>
				{/if}
			{/if}
		</div>

		<!-- Name, contact, bio -->
		<div class="min-w-0 flex-1">
			<h1 class="text-[36px] md:text-[42px]">{data.profile.name}</h1>
			<p class="text-[16px] text-[#8a8f8c]">@{data.profile.username}</p>

			{#if !data.isOwner}
				{#if data.user}
					<form method="POST" action="?/message" class="mt-4">
						<button
							class="cursor-pointer rounded-lg border border-[#35c9b8] px-5 py-2 text-[14px] text-[#35c9b8] transition-colors hover:bg-[#084a43]"
						>
							Send message
						</button>
					</form>
				{:else}
					<a href="/login" class="mt-4 inline-block text-[14px] text-[#35c9b8] hover:underline">
						Log in to send a message
					</a>
				{/if}
				{#if form?.error}
					<p role="alert" class="mt-2 text-[13px] text-[#e05a5a]">{form.error}</p>
				{/if}
			{/if}

			{#if data.profile.bio}
				<p class="mt-6 whitespace-pre-line text-[16px] leading-relaxed text-[#c7cdc9]">{data.profile.bio}</p>
			{:else if data.isOwner}
				<p class="mt-6 text-[15px] text-[#8a8f8c]">
					No description yet. Add one with "Edit profile info".
				</p>
			{/if}

			{#if !isActor}
				<div class="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-[#c7cdc9]">
					<p><span class="text-[#8a8f8c]">Role:</span> {roleLabels[role] ?? role}</p>
					<p>
						<span class="text-[#8a8f8c]">Member since:</span>
						{new Date(data.profile.created_at).getFullYear()}
					</p>
					{#if isFilmmaker}
						<p><span class="text-[#8a8f8c]">Films:</span> {data.films.length}</p>
					{/if}
				</div>
			{/if}

			{#if isActor && data.profile.cv_url}
				<a
					href={data.profile.cv_url}
					target="_blank"
					rel="noopener"
					class="mt-6 inline-block rounded-lg bg-[#35c9b8] px-5 py-2 font-medium text-[#101413] transition hover:bg-[#5fd8ca]"
				>
					Download CV
				</a>
			{/if}

			{#if isFilmmaker && data.isOwner}
				<a
					href="/films/new"
					class="mt-6 inline-block rounded-lg bg-[#35c9b8] px-5 py-2 font-medium text-[#101413] transition hover:bg-[#5fd8ca]"
				>
					Add film
				</a>
			{/if}
		</div>
	</div>

	
	<!-- ===================== EDIT MODE TOOLBAR ===================== -->
	{#if editing}
		<div class="mt-10 rounded-[15px] border border-dashed border-[#35c9b8]/60 bg-[#0f2523] p-4 md:p-5">
			<p class="text-[15px]">
				<strong>Edit mode.</strong> Drag a block by its bar (⠿) or use ▲ ▼ to change the order.
				Visitors see the saved order.
			</p>
			<div class="mt-3 flex flex-wrap gap-3">
				<form method="POST" action="?/saveLayout" use:enhance>
					<input type="hidden" name="layout" value={order.join(',')} />
					<button
						disabled={!orderChanged}
						class="{smallButton} bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca] disabled:cursor-default disabled:opacity-40"
					>
						Save order
					</button>
				</form>
				<button
					type="button"
					disabled={!orderChanged}
					onclick={() => (order = [...data.layout])}
					class="{smallButton} border border-[#2e332f] hover:border-[#8a8f8c] disabled:cursor-default disabled:opacity-40"
				>
					Undo changes
				</button>
			</div>
		</div>
	{/if}

	{#if form?.sectionMessage || form?.photoMessage}
		<p class="mt-6 rounded-[10px] border border-[#35c9b8]/60 bg-[#0f2523] px-4 py-3 text-[15px]" role="status">
			{form.sectionMessage ?? form.photoMessage}
		</p>
	{:else if form?.sectionError}
		<p class="mt-6 rounded-[10px] border border-[#e05a5a]/60 bg-[#3a1414] px-4 py-3 text-[15px]" role="alert">
			{form.sectionError}
		</p>
	{/if}

	<!-- ===================== BLOCKS (in the saved / arranged order) ===================== -->
	{#each shownOrder as key (key)}
		<!-- "Photos" (old photos without a section) only appears when there are some -->
		{#if (editing && key !== 'photos') || hasContent(key)}
			<section
				data-block
				aria-label={blockLabel(key)}
				class="mt-12 {editing
					? 'rounded-[15px] border border-[#2e332f] bg-[#141917] p-4 md:p-5'
					: ''} {dragKey === key ? 'opacity-40' : ''}"
				ondragover={(event) => onDragOver(event, key)}
				ondrop={(event) => {
					event.preventDefault();
					dragKey = null;
				}}
			>
				{#if editing}
					<!-- edit bar: drag handle, ▲ ▼, delete -->
					<div class="mb-4 flex items-center gap-2 border-b border-[#2e332f] pb-3">
						<div
							draggable="true"
							ondragstart={(event) => onDragStart(event, key)}
							ondragend={onDragEnd}
							role="button"
							tabindex="-1"
							aria-label="Drag to move"
							class="flex min-w-0 flex-1 cursor-grab items-center gap-3 active:cursor-grabbing"
						>
							<span class="text-[20px] text-[#8a8f8c]" aria-hidden="true">⠿</span>
							<span class="truncate text-[14px] text-[#a9b0ab]">{blockLabel(key)}</span>
						</div>

						<button type="button" class={iconButton} aria-label="Move up" disabled={order.indexOf(key) === 0} onclick={() => move(key, -1)}>▲</button>
						<button type="button" class={iconButton} aria-label="Move down" disabled={order.indexOf(key) === order.length - 1} onclick={() => move(key, 1)}>▼</button>

						{#if sectionsByKey[key]}
							<form
								method="POST"
								action="?/deleteSection"
								use:enhance
								onsubmit={(event) => {
									if (!confirm(`Delete the section "${sectionsByKey[key].title}"? Its content and photos are deleted too.`))
										event.preventDefault();
								}}
							>
								<input type="hidden" name="sectionId" value={sectionsByKey[key].id} />
								<button class="cursor-pointer rounded-md border border-[#e05a5a]/70 px-2.5 py-1 text-[13px] text-[#f5c4c4] hover:bg-[#3a1414]">
									Delete
								</button>
							</form>
						{/if}
					</div>
				{/if}

				<!-- ----- custom section (text / list / gallery) ----- -->
				{#if sectionsByKey[key]}
					<ProfileSection section={sectionsByKey[key]} {editing} onopen={openPhotos} />

				<!-- ----- attributes (from "Edit profile info") ----- -->
				{:else if key === 'attributes'}
					<h2 class="text-[26px]">Attributes</h2>
					<div class="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 text-[15px] text-[#c7cdc9] sm:grid-cols-3 md:p-6">
						{#if age(data.profile.birth_date)}<p><span class="block text-[13px] text-[#8a8f8c]">Age</span>{age(data.profile.birth_date)}</p>{/if}
						{#if data.profile.gender}<p><span class="block text-[13px] text-[#8a8f8c]">Gender</span><span class="capitalize">{data.profile.gender}</span></p>{/if}
						{#if data.profile.height_cm}<p><span class="block text-[13px] text-[#8a8f8c]">Height</span>{data.profile.height_cm} cm</p>{/if}
						{#if data.profile.weight_kg}<p><span class="block text-[13px] text-[#8a8f8c]">Weight</span>{data.profile.weight_kg} kg</p>{/if}
						{#if data.profile.eye_color}<p><span class="block text-[13px] text-[#8a8f8c]">Eyes</span>{data.profile.eye_color}</p>{/if}
						{#if data.profile.hair_color}<p><span class="block text-[13px] text-[#8a8f8c]">Hair</span>{data.profile.hair_color}</p>{/if}
						{#if data.profile.city}<p><span class="block text-[13px] text-[#8a8f8c]">City</span>{data.profile.city}</p>{/if}
						{#if data.profile.education}<p class="col-span-2"><span class="block text-[13px] text-[#8a8f8c]">Education</span>{data.profile.education}</p>{/if}
					</div>

					{#if data.languages.length > 0}
						<p class="mt-5 text-[14px] text-[#8a8f8c]">Languages</p>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each data.languages as lang}
								<span class="rounded-full bg-[#1b201d] px-3 py-1 text-[13px]">{lang}</span>
							{/each}
						</div>
					{/if}

					{#if lines(data.profile.awards).length > 0}
						<p class="mt-5 text-[14px] text-[#8a8f8c]">Awards</p>
						<ul class="mt-2 flex flex-col gap-1.5">
							{#each lines(data.profile.awards) as award}
								<li class="text-[15px] text-[#c7cdc9]">🏆 {award}</li>
							{/each}
						</ul>
					{/if}

					{#if editing}
						<p class="mt-4 text-[13px] text-[#8a8f8c]">
							Change these values with <a href="/user/{data.profile.username}/edit" class="text-[#35c9b8] hover:underline">Edit profile info</a>.
						</p>
					{/if}

				<!-- ----- credits ----- -->
				{:else if key === 'credits'}
					<h2 class="text-[26px]">Credits</h2>
					{#if data.credits.length > 0}
						<div class="mt-4 divide-y divide-[#2e332f] rounded-[15px] border border-[#2e332f] bg-[#1b201d]">
							{#each data.credits as credit}
								<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
									<span class="w-12 shrink-0 text-[14px] text-[#8a8f8c]">{credit.year ?? '—'}</span>
									<span class="text-[16px]">{credit.title}</span>
									{#if credit.role_name}<span class="text-[14px] text-[#a9b0ab]">as {credit.role_name}</span>{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-[#8a8f8c]">No credits yet.</p>
					{/if}

				<!-- ----- director / producer: films ----- -->
				{:else if key === 'films'}
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

				<!-- ----- director / producer: open casting calls ----- -->
				{:else if key === 'jobs'}
					<h2 class="text-[26px]">Open casting calls</h2>
					{#if data.jobs.length > 0}
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
					{:else}
						<p class="mt-3 text-[#8a8f8c]">No open casting calls.</p>
					{/if}

				<!-- ----- photos without a section (older uploads) ----- -->
				{:else if key === 'photos'}
					<h2 class="text-[26px]">Photos</h2>
					<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
						{#each data.media as item (item.id)}
							<div class="relative">
								{#if item.type === 'photo'}
									<button
										type="button"
										onclick={() => openPhotos(legacyPhotoUrls, legacyPhotoUrls.indexOf(item.url))}
										class="block w-full cursor-zoom-in overflow-hidden rounded-[15px]"
										aria-label="Open photo"
									>
										<img
											src={item.url}
											alt=""
											class="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
										/>
									</button>
								{:else}
									<div class="flex aspect-square w-full items-center justify-center rounded-[15px] bg-[#1b201d] text-[#8a8f8c]">
										Video
									</div>
								{/if}

								{#if editing}
									<form
										method="POST"
										action="?/deletePhoto"
										use:enhance
										class="absolute top-2 right-2"
										onsubmit={(event) => {
											if (!confirm('Delete this photo?')) event.preventDefault();
										}}
									>
										<input type="hidden" name="photoId" value={item.id} />
										<button aria-label="Delete photo" class="cursor-pointer rounded-full bg-black/70 px-2.5 py-1 text-[13px] text-white hover:bg-[#e05a5a]">
											✕
										</button>
									</form>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/each}

	
	<!-- ===================== ADD SECTION (edit mode) ===================== -->
	{#if editing}
		<form
			method="POST"
			action="?/addSection"
			use:enhance
			class="mt-12 rounded-[15px] border border-dashed border-[#2e332f] p-5 md:p-6"
		>
			<h2 class="text-[20px]">Add section</h2>
			<p class="mt-1 text-[14px] text-[#8a8f8c]">
				For example "Headshots" (gallery), "Skills" (list) or "About me" (text).
			</p>
			<div class="mt-4 flex flex-col gap-3 sm:flex-row">
				<select name="type" aria-label="Section type" class="{field} sm:w-40">
					<option value="text">Text</option>
					<option value="list">List</option>
					<option value="gallery">Gallery</option>
				</select>
				<input name="title" required maxlength="80" placeholder="Title of the section" aria-label="Section title" class={field} />
				<button class="{smallButton} shrink-0 bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca]">
					+ Add
				</button>
			</div>
		</form>
	{/if}

	<Lightbox photos={viewer.photos} bind:index={viewer.index} />
</div>