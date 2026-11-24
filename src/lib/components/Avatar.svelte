<script>
	// Round profile picture. If the user has no photo (or it fails to load),
	// the default-pfp is shown instead.
	// Use:  <Avatar src={user.photo} alt="Brad Pitt" class="h-14 w-14" />
	import defaultPfp from '$lib/assets/default-pfp.png';
	import { m } from '$lib/paraglide/messages.js';

	let { src = '', alt = 'm.common_profile_picture()', class: className = 'h-14 w-14' } = $props();
</script>

<img
	src={src || defaultPfp}
	{alt}
	onerror={(e) => (e.currentTarget.src = defaultPfp)}
	class="block rounded-full border-2 border-[#666] object-cover {className}"
/>