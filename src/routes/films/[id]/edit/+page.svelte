<script>
	import FilmForm from '$lib/components/FilmForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Edit {data.film.title} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 text-[#f2f2f0] md:px-10">
	<a href="/films/{data.film.id}" class="text-[14px] text-[#35c9b8] hover:underline">← Back to film</a>
	<h1 class="mt-3 text-[32px] font-light">Edit film</h1>
	<p class="mt-2 text-[#8a8f8c]">
		Changes appear on the film page right away. Applications that already arrived stay in your inbox.
	</p>

	<FilmForm {form} initial={data.film} submitLabel="Save changes" cancelHref="/films/{data.film.id}" />
</div>