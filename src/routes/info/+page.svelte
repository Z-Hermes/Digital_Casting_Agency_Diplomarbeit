<script>
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.info_title()} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-16 text-[#f2f2f0] md:px-10">
	<h1 class="text-[38px] md:text-[48px]">{m.info_heading()}</h1>
	<div class="mt-4 h-1 w-24 rounded-full bg-[#35c9b8]"></div>

	<div class="mt-10 space-y-8">
		<div>
			<h2 class="text-[24px] text-[#35c9b8] md:text-[28px]">{m.info_actors_heading()}</h2>
			<p class="mt-2 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
				{m.info_actors_text()}
			</p>
		</div>

		<div>
			<h2 class="text-[24px] text-[#35c9b8] md:text-[28px]">{m.info_directors_heading()}</h2>
			<p class="mt-2 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
				{m.info_directors_text()}
			</p>
		</div>

		<div>
			<h2 class="text-[24px] text-[#35c9b8] md:text-[28px]">{m.info_messaging_heading()}</h2>
			<p class="mt-2 text-[18px] leading-relaxed text-[#c7cdc9] md:text-[20px]">
				{m.info_messaging_text()}
			</p>
		</div>
	</div>
</div>