<script>
	// Upload / remove the profile picture and the gallery photos.
	// Used on the admin edit page and on the actor's "My photos" page.
	// The page needs the form actions: avatar, removeAvatar, gallery, deletePhoto
	// (see src/lib/server/photos.js).
	// Use:  <PhotoManager name={actor.name} avatarUrl={data.avatarUrl} photos={data.photos} {form} />
	import Avatar from './Avatar.svelte';

	let { name = '', avatarUrl = null, photos = [], form = null } = $props();

	// asks before deleting; "Cancel" stops the form
	function confirmAction(message) {
		return (event) => {
			if (!confirm(message)) event.preventDefault();
		};
	}

	const button =
		'cursor-pointer rounded-lg px-4 py-2 text-[14px] transition-colors';
	const fileInput =
		'block w-full text-[14px] text-[#a9b0ab] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#232825] file:px-4 file:py-2 file:text-[#f2f2f0] hover:file:bg-[#2e332f]';
</script>

<section class="flex flex-col gap-6">
	{#if form?.photoMessage}
		<p class="rounded-[10px] border border-[#35c9b8]/60 bg-[#0f2523] px-4 py-3 text-[15px]" role="status">
			{form.photoMessage}
		</p>
	{:else if form?.photoError}
		<p class="rounded-[10px] border border-[#e05a5a]/60 bg-[#3a1414] px-4 py-3 text-[15px]" role="alert">
			{form.photoError}
		</p>
	{/if}

	<!-- ===== Profile picture ===== -->
	<div class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
		<h2 class="text-[18px]">Profile picture</h2>

		<div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
			<Avatar src={avatarUrl} alt={name} class="h-28 w-28 shrink-0" />

			<div class="flex flex-1 flex-col gap-3">
				<form method="POST" action="?/avatar" enctype="multipart/form-data" class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required class={fileInput} />
					<button class="{button} shrink-0 bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca]">
						Upload
					</button>
				</form>

				{#if avatarUrl}
					<form method="POST" action="?/removeAvatar" onsubmit={confirmAction('Remove the profile picture?')}>
						<button class="{button} border border-[#e05a5a]/70 text-[#f5c4c4] hover:bg-[#3a1414]">
							Remove picture
						</button>
					</form>
				{/if}

				<p class="text-[13px] text-[#8a8f8c]">JPG, PNG or WebP, max. 5 MB.</p>
			</div>
		</div>
	</div>

	<!-- ===== Gallery ===== -->
	<div class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
		<h2 class="text-[18px]">Gallery <span class="text-[#8a8f8c]">{photos.length}</span></h2>

		<form method="POST" action="?/gallery" enctype="multipart/form-data" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
			<input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required class={fileInput} />
			<button class="{button} shrink-0 bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca]">
				Add photos
			</button>
		</form>
		<p class="mt-2 text-[13px] text-[#8a8f8c]">You can choose several pictures at once (max. 20 in total).</p>

		{#if photos.length === 0}
			<p class="mt-5 text-[15px] text-[#8a8f8c]">No gallery photos yet.</p>
		{:else}
			<ul class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each photos as photo (photo.id)}
					<li class="relative overflow-hidden rounded-[12px] border border-[#2e332f]">
						<img src={photo.url} alt="Gallery" class="aspect-square w-full object-cover" />
						<form
							method="POST"
							action="?/deletePhoto"
							onsubmit={confirmAction('Delete this photo?')}
							class="absolute top-2 right-2"
						>
							<input type="hidden" name="photoId" value={photo.id} />
							<button
								aria-label="Delete photo"
								class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#101413]/80 text-[16px] text-[#f5c4c4] transition-colors hover:bg-[#3a1414]"
							>
								✕
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>