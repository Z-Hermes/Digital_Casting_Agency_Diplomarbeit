<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const MAX_MB = 100; // must match videos.js
	const MAX_SECONDS = 60;

	let fileInput = $state();
	let checking = $state(false);
	let uploading = $state(false);
	let fileProblem = $state(null);
	let duration = $state(null);
	let unchecked = $state(false);

	// Fast feedback BEFORE the (possibly big) upload starts.
	// The server checks everything again - this is only for comfort.
	function checkFile() {
		fileProblem = null;
		duration = null;
		unchecked = false;

		const file = fileInput.files?.[0];
		if (!file) return;

		if (file.size > MAX_MB * 1024 * 1024) {
			fileProblem = `The video is too big (max. ${MAX_MB} MB). Tip: record in 1080p instead of 4K.`;
			return;
		}

		checking = true;
		const url = URL.createObjectURL(file);
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			URL.revokeObjectURL(url);
			checking = false;
			if (!isFinite(video.duration) || video.duration === 0) {
				unchecked = true;
				return;
			}
			duration = video.duration;
			if (video.duration > MAX_SECONDS + 0.5) {
				fileProblem = `This video is ${Math.ceil(video.duration)} seconds long (max. ${MAX_SECONDS}).`;
			}
		};
		video.onerror = () => {
			// e.g. HEVC videos this browser cannot decode: let the upload
			// happen anyway, the server checks the length from the file header
			URL.revokeObjectURL(url);
			checking = false;
			unchecked = true;
		};
		video.src = url;
	}

	function confirmDelete(event) {
		if (!confirm('Delete this video?')) event.preventDefault();
	}

	const button = 'cursor-pointer rounded-lg px-4 py-2 text-[14px] transition-colors';
	const fileInputClass =
		'block w-full text-[14px] text-[#a9b0ab] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#232825] file:px-4 file:py-2 file:text-[#f2f2f0] hover:file:bg-[#2e332f]';
</script>

<svelte:head>
	<title>My videos | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/user/{data.user.username}" class="text-[14px] text-[#35c9b8] hover:underline">
		← Back to my profile
	</a>

	<h1 class="mt-6 text-[28px] md:text-[36px]">My videos</h1>
	<p class="mt-1 text-[15px] text-[#8a8f8c]">
		Short self-tape videos (max. 1 minute) that are shown on your profile.
	</p>

	<section class="mt-8 flex flex-col gap-6">
		{#if form?.videoMessage}
			<p class="rounded-[10px] border border-[#35c9b8]/60 bg-[#0f2523] px-4 py-3 text-[15px]" role="status">
				{form.videoMessage}
			</p>
		{:else if form?.videoError}
			<p class="rounded-[10px] border border-[#e05a5a]/60 bg-[#3a1414] px-4 py-3 text-[15px]" role="alert">
				{form.videoError}
			</p>
		{/if}

		<div class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
			<h2 class="text-[18px]">
				Videos <span class="text-[#8a8f8c]">{data.videos.length}/{data.maxVideos}</span>
			</h2>

			{#if data.videos.length < data.maxVideos}
				<form
					method="POST"
					action="?/upload"
					enctype="multipart/form-data"
					class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
					use:enhance={({ cancel }) => {
						if (checking || fileProblem || !fileInput.files?.length) {
							cancel();
							return;
						}
						uploading = true;
						return async ({ update }) => {
							await update();
							uploading = false;
							fileInput.value = '';
							duration = null;
							unchecked = false;
						};
					}}
				>
					<input
						bind:this={fileInput}
						type="file"
						name="video"
						accept="video/mp4,video/quicktime,.mp4,.mov"
						required
						class={fileInputClass}
						onchange={checkFile}
					/>
					<button
						disabled={checking || uploading || fileProblem !== null}
						class="{button} shrink-0 bg-[#35c9b8] font-medium text-[#101413] hover:bg-[#5fd8ca] disabled:cursor-default disabled:opacity-40"
					>
						{uploading ? 'Uploading…' : 'Upload'}
					</button>
				</form>

				{#if fileProblem}
					<p class="mt-2 text-[13px] text-[#e05a5a]" role="alert">{fileProblem}</p>
				{:else if checking}
					<p class="mt-2 text-[13px] text-[#8a8f8c]">Checking video length…</p>
				{:else if duration !== null}
					<p class="mt-2 text-[13px] text-[#8a8f8c]">Length: {Math.round(duration)} seconds ✓</p>
				{:else if unchecked}
					<p class="mt-2 text-[13px] text-[#8a8f8c]">
						The length could not be checked in this browser – the server will check it.
					</p>
				{/if}

				<p class="mt-2 text-[13px] text-[#8a8f8c]">
					MP4 or MOV, max. {MAX_SECONDS} seconds, max. {MAX_MB} MB. Tip: record in 1080p, not 4K.
				</p>
			{:else}
				<p class="mt-4 text-[15px] text-[#8a8f8c]">
					You have reached the maximum of {data.maxVideos} videos. Delete one to upload a new one.
				</p>
			{/if}

			{#if data.videos.length === 0}
				<p class="mt-5 text-[15px] text-[#8a8f8c]">No videos yet.</p>
			{:else}
				<ul class="mt-5 grid gap-4 sm:grid-cols-2">
					{#each data.videos as video (video.id)}
						<li class="relative overflow-hidden rounded-[12px] border border-[#2e332f]">
							<!-- svelte-ignore a11y_media_has_caption -->
							<video
								src={video.url}
								controls
								preload="metadata"
								playsinline
								class="aspect-video w-full bg-black"
							></video>
							<form
								method="POST"
								action="?/deleteVideo"
								onsubmit={confirmDelete}
								class="absolute top-2 right-2"
							>
								<input type="hidden" name="videoId" value={video.id} />
								<button
									aria-label="Delete video"
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
</div>