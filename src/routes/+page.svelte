<script>
	import defaultPfp from '$lib/assets/default-pfp.png';
	import landingImage from '$lib/assets/landing-page.jpg';

	// Later this list can come from the database (+page.server.js)
	const actors = [
		{ name: 'Tom Hanks', age: 69, status: 'Booked' },
		{ name: 'Hugh Jackman', age: 57, status: 'Booked' },
		{ name: 'Scarlett Johanssen', age: 41, status: 'Booked' },
		{ name: 'Jennifer Aniston', age: 57, status: 'Booked' }
	];
</script>

<!-- (navbar is now in +layout.svelte) -->

<!-- ===== HERO ===== -->
<section
	class="mx-3 my-8 flex min-h-[500px] items-center rounded-[15px] bg-cover bg-center sm:min-h-[633px] xl:mx-auto xl:max-w-[1140px]"
	style="background-image: url({landingImage})"
>
	<div
		class="flex min-h-[400px] w-full flex-col items-center justify-around gap-8 bg-[#151618]/40 px-5 py-8 text-center lg:flex-row lg:px-10"
	>
		<div>
			<p class="text-[20px] sm:text-[25px]">welcome to</p>
			<h1 class="text-[38px] sm:text-[48px] lg:text-[62px]">HD Studios</h1>
		</div>

		<!-- divider: horizontal on phone/tablet, vertical on desktop -->
		<div class="h-[2px] w-[150px] bg-[#888] lg:h-[230px] lg:w-[2px]"></div>

		<p class="max-w-[540px] text-[18px] sm:text-[22px] lg:text-[29px]">
			The platform where actors showcase their talent and casting professionals discover the
			perfect cast for their next production.
		</p>
	</div>
</section>

<!-- ===== FEATURED ACTORS ===== -->
<section class="pt-8 pb-11">
	<div class="mx-auto max-w-[1124px] px-5">
		<h2 class="mb-3 text-[28px] sm:text-[38px]">Featured actors</h2>

		<!-- scrolls sideways when there are more cards -->
		<div class="flex gap-4 overflow-x-auto pb-2">
			{#each actors as actor}
				<article
					class="flex-none basis-[230px] overflow-hidden rounded-[25px] border border-[#2a302d] bg-[#1b201d] sm:basis-[269px]"
				>
					<img src={defaultPfp} alt={actor.name} class="block h-[200px] w-full object-cover" />

					<!-- -mt-3 makes the box overlap the photo like in the mockup -->
					<div class="relative -mt-3 rounded-t-[25px] bg-[#1b201d] px-5 pt-[18px] pb-5">
						<h3 class="text-[26px]">{actor.name}</h3>
						<p class="mt-0.5 mb-3 text-[24px]">{actor.age} years old</p>

						<div class="flex items-center justify-between">
							<span class="rounded-full border border-[#2f8f5b] bg-[#12301f] px-3 py-1 text-[15px]">
								{actor.status}
							</span>
							<button
								class="cursor-pointer text-[28px] leading-none font-bold text-[#35c9b8]"
								aria-label="More options">...</button
							>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="bg-[#0b0d0c] py-9">
	<div class="mx-auto flex max-w-[1124px] items-center justify-between px-5">
		<p class="text-[16px] text-[#8a8f8c] sm:text-[20px]">© Diplomarbeit 26-27</p>
		<a href="/about" class="text-[16px] text-[#35c9b8] sm:text-[22px]">about</a>
	</div>
</footer>