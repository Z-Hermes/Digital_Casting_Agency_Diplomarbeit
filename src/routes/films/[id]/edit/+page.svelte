<script>
	import FilmForm from '$lib/components/FilmForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data, form } = $props();
</script>

<svelte:head>
<title>{m.filmedit_title({ title: data.film.title })} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 text-[#f2f2f0] md:px-10">
	<a href="/films/{data.film.id}" class="text-[14px] text-[#35c9b8] hover:underline">{m.filmedit_back()}</a>
	<h1 class="mt-3 text-[32px] font-light">{m.film_edit()}</h1>
	<p class="mt-2 text-[#8a8f8c]">
		{m.filmedit_text()}
	</p>

	<FilmForm {form} initial={data.film} submitLabel={m.common_save_changes()} cancelHref="/films/{data.film.id}" />
</div>