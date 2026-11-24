<script>
	// One section the user added to their profile (text, list or gallery).
	// editing = false -> what visitors see
	// editing = true  -> the owner can change the title/content, add or delete photos
	// The page needs the form actions: updateSection, sectionPhotos, deletePhoto
	// Use:  <ProfileSection {section} {editing} onopen={(photos, index) => ...} />
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { section, editing = false, onopen = () => {} } = $props();

	let photoUrls = $derived(section.photos.map((photo) => photo.url));

	const field =
		'w-full rounded-[10px] border border-[#2e332f] bg-[#232825] px-4 py-2.5 text-[15px] text-[#f2f2f0] outline-none focus:border-[#35c9b8]';
	const smallButton = 'cursor-pointer rounded-lg px-4 py-2 text-[14px] transition-colors';
	const fileInput =
		'block w-full text-[14px] text-[#a9b0ab] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#232825] file:px-4 file:py-2 file:text-[#f2f2f0] hover:file:bg-[#2e332f]';

	// keeps the form fields after saving (enhance would empty them otherwise)
	function keepValues() {
		return async ({ update }) => update({ reset: false });
	}
</script>

{#if editing && section.type !== 'gallery'}
	<!-- ===== edit: title + text / list items ===== -->
	<form method="POST" action="?/updateSection" use:enhance={keepValues} class="flex flex-col gap-3">
		<input type="hidden" name="sectionId" value={section.id} />
		<input name="title" value={section.title} required maxlength="80" aria-label={m.section_title_label()} class="{field} text-[18px]" />
		<textarea
			name="body"
			rows={section.type === 'list' ? 5 : 4}
			maxlength="5000"
			aria-label={section.type === 'list' ? m.section_list_items() : m.section_type_text()}
			placeholder={section.type === 'list' ? m.section_list_ph() : m.section_text_ph()}
			class={field}>{section.body ?? ''}</textarea
		>
		<button class="{smallButton} self-start bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca]">
			{m.section_save()}
		</button>
	</form>
{:else if editing}
	<!-- ===== edit: gallery title ===== -->
	<form method="POST" action="?/updateSection" use:enhance={keepValues} class="flex flex-col gap-3 sm:flex-row">
		<input type="hidden" name="sectionId" value={section.id} />
		<input name="title" value={section.title} required maxlength="80" aria-label={m.section_title_label()} class="{field} text-[18px]" />
		<button class="{smallButton} shrink-0 border border-[#2e332f] hover:border-[#35c9b8]">{m.section_rename()}</button>
	</form>
{:else}
	<h2 class="text-[26px]">{section.title}</h2>
{/if}

<!-- ===== content (visitors) ===== -->
{#if !editing && section.type === 'text' && section.body}
	<p class="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-[#c7cdc9]">{section.body}</p>
{:else if !editing && section.type === 'list' && section.items.length > 0}
	<ul class="mt-3 flex flex-col gap-2">
		{#each section.items as item}
			<li class="flex gap-3 text-[16px] text-[#c7cdc9]">
				<span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#35c9b8]"></span>
				{item}
			</li>
		{/each}
	</ul>
{:else if !editing && section.type !== 'gallery'}
	<p class="mt-3 text-[#8a8f8c]">{m.section_empty()}</p>
{/if}

<!-- ===== gallery (visitors and owner) ===== -->
{#if section.type === 'gallery'}
	{#if section.photos.length > 0}
		<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each section.photos as photo, index (photo.id)}
				<div class="relative">
					<button
						type="button"
						onclick={() => onopen(photoUrls, index)}
						class="block w-full cursor-zoom-in overflow-hidden rounded-[15px]"
						aria-label="{m.common_open_photo()}"
					>
						<img
							src={photo.url}
							alt=""
							class="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
						/>
					</button>

					{#if editing}
						<form
							method="POST"
							action="?/deletePhoto"
							use:enhance
							class="absolute top-2 right-2"
							onsubmit={(event) => {
								if (!confirm({m.common_confirm_delete_photo()})) event.preventDefault();
							}}
						>
							<input type="hidden" name="photoId" value={photo.id} />
							<button
								aria-label="{m.common_delete_photo()}"
								class="cursor-pointer rounded-full bg-black/70 px-2.5 py-1 text-[13px] text-white hover:bg-[#e05a5a]"
							>
								✕
							</button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{:else if !editing}
		<p class="mt-3 text-[#8a8f8c]">{m.common_no_photos()}</p>
	{/if}

	{#if editing}
		<form
			method="POST"
			action="?/sectionPhotos"
			enctype="multipart/form-data"
			use:enhance
			class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
		>
			<input type="hidden" name="sectionId" value={section.id} />
			<input type="file" name="photos" multiple required accept="image/jpeg,image/png,image/webp" class={fileInput} />
			<button class="{smallButton} shrink-0 bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca]">
				{m.common_add_photos()}
			</button>
		</form>
		<p class="mt-2 text-[13px] text-[#8a8f8c]">{m.section_photo_hint()}</p>
	{/if}
{/if}