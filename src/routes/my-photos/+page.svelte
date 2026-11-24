<script>
	import PhotoManager from '$lib/components/PhotoManager.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{m.my_photos_title()} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/user/{data.user.username}" class="text-[14px] text-[#35c9b8] hover:underline">
		{m.common_back_to_profile()}
	</a>

	<h1 class="mt-6 text-[28px] md:text-[36px]">{m.myphotos_title()}</h1>
		<p class="mt-1 text-[15px] text-[#8a8f8c]">
		{m.myphotos_text()}
	</p>
	<div class="mt-8">
		<PhotoManager name={data.user.name} avatarUrl={data.avatarUrl} photos={data.photos} {form} showAvatar={false} />	</div>
</div>