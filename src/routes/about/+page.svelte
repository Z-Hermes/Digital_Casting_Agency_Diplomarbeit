<script>
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.about_title()} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-16 text-[#f2f2f0] md:px-10">
	<h1 class="text-[38px] md:text-[48px]">{m.about_heading()}</h1>
	<div class="mt-4 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	<p class="mt-8 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
		{m.about_text_1()}
	</p>

	<p class="mt-6 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
		{m.about_text_2()}
	</p>

	<h2 class="mt-12 text-[26px] md:text-[32px]">{m.about_team_heading()}</h2>
	<p class="mt-3 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
		{m.about_team_text()}
	</p>
</div>