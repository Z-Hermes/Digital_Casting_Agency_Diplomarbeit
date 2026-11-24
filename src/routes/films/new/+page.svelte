<script>
	import FilmForm from '$lib/components/FilmForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();
</script>

<svelte:head>
	<title>{m.filmnew_title()} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 text-[#f2f2f0] md:px-10">
	<a href="/films" class="text-[14px] text-[#35c9b8] hover:underline">{m.film_back()}</a>
	<h1 class="mt-3 text-[32px] font-light">{m.filmnew_heading()}</h1>
	<p class="mt-2 text-[#8a8f8c]">
		{m.filmnew_text()}
	</p>

	<FilmForm {form} submitLabel={m.filmnew_title()} cancelHref="/films" />
</div>