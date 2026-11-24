<script>
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import Img from '$lib/components/Img.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import ProfileSection from '$lib/components/ProfileSection.svelte';
	import { getStage, formatDate } from '$lib/filmStages.js';
	import { m } from '$lib/paraglide/messages.js';

	let { data, form } = $props();

	const statusLabels = {
		available: m.status_available(),
		on_set: m.status_on_set(),
		booked: m.status_booked()
	};

	const genderLabels = {
		female: m.gender_female(),
		male: m.gender_male(),
		other: m.gender_other()
	};

	const roleLabels = {
		admin: m.role_admin(),
		director: m.role_director(),
		producer: m.role_producer(),
		actor: m.role_actor(),
		spectator: m.role_film_fan()
	};

	const jobTypeLabels = {
		film: m.credit_film(),
		series: m.credit_series(),
		theatre: m.credit_theatre(),
		commercial: m.credit_commercial()
	};

	// names of the built-in blocks (shown in edit mode)
	const builtinLabels = {
		attributes: m.profile_attributes(),
		credits: m.profile_credits(),
		films: m.profile_films(),
		jobs: m.profile_casting_calls(),
		photos: m.profile_photos(),
		videos: m.profile_videos()
	};

	const sectionTypeLabels = { text: m.section_type_text(), list: m.section_type_list(), gallery: m.section_type_gallery() };

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
		if (orderChanged && !confirm(m.profile_confirm_leave())) return;
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
		if (key === 'videos') return data.videos.length > 0;
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
						{uploading ? m.common_uploading() : data.profile.avatar_url ? m.profile_change_photo() : m.profile_upload_photo()}
					</button>
				</form>

				{#if form?.photoError}
					<p role="alert" class="mt-2 text-[13px] text-[#e05a5a]">{form.photoError}</p>
				{/if}

				<a
					href="/user/{data.profile.username}/edit"
					class="mt-3 block w-full rounded-lg border border-[#2e332f] px-4 py-2 text-center text-[14px] transition-colors hover:border-[#35c9b8]"
				>
					{m.profile_edit_info()}
				</a>

				{#if editing}
					<button
						type="button"
						onclick={stopEditing}
						class="mt-3 w-full cursor-pointer rounded-lg bg-[#35c9b8] px-4 py-2 text-[14px] font-medium text-[#101413] hover:bg-[#5fd8ca]"
					>
						{m.profile_done()}
					</button>
				{:else}
					<button
						type="button"
						onclick={startEditing}
						class="mt-3 w-full cursor-pointer rounded-lg bg-[#35c9b8] px-4 py-2 text-[14px] font-medium text-[#101413] hover:bg-[#5fd8ca]"
					>
						{m.profile_edit_sections()}
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
							{m.profile_send_message()}
						</button>
					</form>
				{:else}
					<a href="/login" class="mt-4 inline-block text-[14px] text-[#35c9b8] hover:underline">
						{m.profile_login_to_message()}
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
					{m.profile_no_description()}
				</p>
			{/if}

			{#if !isActor}
				<div class="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-[#c7cdc9]">
					<p><span class="text-[#8a8f8c]">{m.profile_role()}</span> {roleLabels[role] ?? role}</p>
					<p>
						<span class="text-[#8a8f8c]">{m.profile_member_since()}</span>
						{new Date(data.profile.created_at).getFullYear()}
					</p>
					{#if isFilmmaker}
						<p><span class="text-[#8a8f8c]">{m.profile_films_count()}</span> {data.films.length}</p>
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
					{m.profile_download_cv()}
				</a>
			{/if}

			{#if isFilmmaker && data.isOwner}
				<a
					href="/films/new"
					class="mt-6 inline-block rounded-lg bg-[#35c9b8] px-5 py-2 font-medium text-[#101413] transition hover:bg-[#5fd8ca]"
				>
					{m.profile_add_film()}
				</a>
			{/if}
		</div>
	</div>

	<!-- ===================== EDIT MODE TOOLBAR ===================== -->
	{#if editing}
		<div class="mt-10 rounded-[15px] border border-dashed border-[#35c9b8]/60 bg-[#0f2523] p-4 md:p-5">
			<p class="text-[15px]">
				<strong>{m.profile_edit_mode()}</strong> {m.profile_edit_mode_hint()}
			</p>
			<div class="mt-3 flex flex-wrap gap-3">
				<form method="POST" action="?/saveLayout" use:enhance>
					<input type="hidden" name="layout" value={order.join(',')} />
					<button
						disabled={!orderChanged}
						class="{smallButton} bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca] disabled:cursor-default disabled:opacity-40"
					>
						{m.profile_save_order()}
					</button>
				</form>
				<button
					type="button"
					disabled={!orderChanged}
					onclick={() => (order = [...data.layout])}
					class="{smallButton} border border-[#2e332f] hover:border-[#8a8f8c] disabled:cursor-default disabled:opacity-40"
				>
					{m.profile_undo()}
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
							aria-label={m.profile_drag()}
							class="flex min-w-0 flex-1 cursor-grab items-center gap-3 active:cursor-grabbing"
						>
							<span class="text-[20px] text-[#8a8f8c]" aria-hidden="true">⠿</span>
							<span class="truncate text-[14px] text-[#a9b0ab]">{blockLabel(key)}</span>
						</div>

						<button type="button" class={iconButton} aria-label={m.profile_move_up()} disabled={order.indexOf(key) === 0} onclick={() => move(key, -1)}>▲</button>
						<button type="button" class={iconButton} aria-label={m.profile_move_down()} disabled={order.indexOf(key) === order.length - 1} onclick={() => move(key, 1)}>▼</button>

						{#if sectionsByKey[key]}
							<form
								method="POST"
								action="?/deleteSection"
								use:enhance
								onsubmit={(event) => {
									if (!confirm(m.profile_confirm_delete_section({ title: sectionsByKey[key].title })))
										event.preventDefault();
								}}
							>
								<input type="hidden" name="sectionId" value={sectionsByKey[key].id} />
								<button class="cursor-pointer rounded-md border border-[#e05a5a]/70 px-2.5 py-1 text-[13px] text-[#f5c4c4] hover:bg-[#3a1414]">
									{m.common_delete()}
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
					<h2 class="text-[26px]">{m.profile_attributes()}</h2>
					<div class="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 text-[15px] text-[#c7cdc9] sm:grid-cols-3 md:p-6">
						{#if age(data.profile.birth_date)}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_age()}</span>{age(data.profile.birth_date)}</p>{/if}
						{#if data.profile.gender}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_gender()}</span><span class="capitalize">{genderLabels[data.profile.gender] ?? data.profile.gender}</span></p>{/if}
						{#if data.profile.height_cm}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_height()}</span>{data.profile.height_cm} cm</p>{/if}
						{#if data.profile.weight_kg}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_weight()}</span>{data.profile.weight_kg} kg</p>{/if}
						{#if data.profile.eye_color}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_eyes()}</span>{data.profile.eye_color}</p>{/if}
						{#if data.profile.hair_color}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_hair()}</span>{data.profile.hair_color}</p>{/if}
						{#if data.profile.city}<p><span class="block text-[13px] text-[#8a8f8c]">{m.profile_city()}</span>{data.profile.city}</p>{/if}
						{#if data.profile.education}<p class="col-span-2"><span class="block text-[13px] text-[#8a8f8c]">{m.profile_education()}</span>{data.profile.education}</p>{/if}
					</div>

					{#if data.languages.length > 0}
						<p class="mt-5 text-[14px] text-[#8a8f8c]">{m.profile_languages()}</p>