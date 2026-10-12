<script>
	import defaultPfp from '$lib/assets/default-pfp.png';

	let { src, alt = '', class: className = '', fallback = defaultPfp, ...rest } = $props();

	let currentSrc = $state(src || fallback);

	// if the src prop changes (e.g. different actor in a list), reset
	$effect(() => {
		currentSrc = src || fallback;
	});

	function handleError() {
		currentSrc = fallback;
	}
</script>

<img src={currentSrc} alt={alt} class={className} onerror={handleError} {...rest} />