<script>
	import PhotoManager from '$lib/components/PhotoManager.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>My photos | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/user/{data.user.username}" class="text-[14px] text-[#35c9b8] hover:underline">
		← Back to my profile
	</a>

	<h1 class="mt-6 text-[28px] md:text-[36px]">My photos</h1>
	<p class="mt-1 text-[15px] text-[#8a8f8c]">
		Your profile picture is shown everywhere on the website. Gallery photos are shown on your profile.
	</p>

	<div class="mt-8">
		<PhotoManager name={data.user.name} avatarUrl={data.avatarUrl} photos={data.photos} {form} />
	</div>
</div>