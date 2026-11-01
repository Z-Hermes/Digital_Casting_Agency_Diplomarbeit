<script>
	import FilmForm from '$lib/components/FilmForm.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Add film | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 text-[#f2f2f0] md:px-10">
	<a href="/films" class="text-[14px] text-[#35c9b8] hover:underline">← Back to films</a>
	<h1 class="mt-3 text-[32px] font-light">Add a film</h1>
	<p class="mt-2 text-[#8a8f8c]">
		Applications for your film arrive in your inbox, with the actor's profile and message.
	</p>

	<FilmForm {form} submitLabel="Add film" cancelHref="/films" />
</div>