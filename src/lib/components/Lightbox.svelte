<script>
	// Full-screen photo viewer.
	// Use:  <Lightbox photos={photoUrls} bind:index={viewer} />
	// index = number of the open photo, null = closed
	let { photos = [], index = $bindable(null) } = $props();

	let isOpen = $derived(index !== null && photos[index] !== undefined);

	function close() {
		index = null;
	}
	function next() {
		index = (index + 1) % photos.length;
	}
	function prev() {
		index = (index - 1 + photos.length) % photos.length;
	}

	// keyboard: Esc closes, arrow keys browse
	function onKey(event) {
		if (!isOpen) return;
		if (event.key === 'Escape') close();
		if (event.key === 'ArrowRight') next();
		if (event.key === 'ArrowLeft') prev();
	}

	const navButton =
		'absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/60 px-4 py-3 text-[24px] text-white hover:bg-[#35c9b8] hover:text-[#101413]';
</script>

<svelte:window onkeydown={onKey} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
		role="dialog"
		aria-modal="true"
		aria-label="Photo viewer"
	>
		<!-- click next to the photo = close -->
		<button type="button" class="absolute inset-0 cursor-zoom-out" aria-label="Close" onclick={close}></button>

		<img src={photos[index]} alt="" class="relative max-h-[85vh] max-w-[90vw] rounded-[10px] object-contain" />

		<button
			type="button"
			onclick={close}
			aria-label="Close"
			class="absolute top-4 right-4 cursor-pointer rounded-full bg-black/60 px-3 py-1 text-[22px] text-white hover:bg-[#35c9b8] hover:text-[#101413]"
		>
			✕
		</button>

		{#if photos.length > 1}
			<button type="button" onclick={prev} aria-label="Previous photo" class="{navButton} left-4">‹</button>
			<button type="button" onclick={next} aria-label="Next photo" class="{navButton} right-4">›</button>
		{/if}

		<p class="absolute bottom-4 left-1/2 -translate-x-1/2 text-[14px] text-[#a9b0ab]">
			{index + 1} / {photos.length}
		</p>
	</div>
{/if}