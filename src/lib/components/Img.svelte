<script>
	// Any image with a fallback: if src is empty or fails to load,
	// the fallback (default-pfp) is shown instead.
	// Use:  <Img src={film.poster_url} alt={film.title} class="h-[280px] w-full object-cover" />
	import defaultPfp from '$lib/assets/default-pfp.png';

	let { src, alt = '', class: className = '', fallback = defaultPfp, ...rest } = $props();

	// remembers which src failed to load (a new src gets a fresh try)
	let failedSrc = $state(null);

	let currentSrc = $derived(!src || src === failedSrc ? fallback : src);
</script>

<img src={currentSrc} {alt} class={className} onerror={() => (failedSrc = src)} {...rest} />