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

<!--
	Sizes:  no prefix = phone | md: = tablet (768px+) | lg: = laptop (1024px+) | xl: = big screen (1280px+)
-->

<!-- ===== HERO ===== -->
<section
	class="mx-3 my-8 flex min-h-[500px] items-center rounded-[15px] bg-cover bg-center md:mx-10 md:min-h-[400px] lg:mx-16 lg:min-h-[633px] xl:mx-auto xl:max-w-[1140px]"
	style="background-image: url({landingImage})"
>
	<div
		class="flex min-h-[400px] w-full flex-col items-center justify-around gap-8 bg-[#151618]/40 px-5 py-8 text-center md:min-h-[250px] md:flex-row md:gap-6 lg:min-h-[400px] lg:px-10"
	>
		<div>
			<p class="text-[20px] lg:text-[25px]">welcome to</p>
			<h1 class="text-[38px] md:text-[44px] lg:text-[62px]">HD Studios</h1>
		</div>

		<!-- divider: horizontal on phone, vertical from tablet up -->
		<div class="h-[2px] w-[150px] bg-[#888] md:h-[150px] md:w-[2px] lg:h-[230px]"></div>

		<p class="max-w-[540px] text-[18px] md:max-w-[340px] lg:max-w-[540px] lg:text-[29px]">
			The platform where actors showcase their talent and casting professionals discover the
			perfect cast for their next production.
		</p>
	</div>
</section>

<!-- ===== FEATURED ACTORS ===== -->
<section class="pt-8 pb-11">
	<div class="mx-auto max-w-[1124px] px-5 md:px-10 lg:px-16 xl:px-5">
		<h2 class="mb-3 text-[28px] md:text-[25px] lg:text-[38px]">Featured actors</h2>

		<!-- scrolls sideways when there are more cards -->
		<div class="flex gap-4 overflow-x-auto pb-2">
			{#each actors as actor}
				<article
					class="flex-none basis-[230px] overflow-hidden rounded-[25px] border border-[#2a302d] bg-[#1b201d] md:basis-[200px] lg:basis-[269px]"
				>
					<img
						src={defaultPfp}
						alt={actor.name}
						class="block h-[200px] w-full object-cover md:h-[170px] lg:h-[200px]"
					/>

					<!-- -mt-3 makes the box overlap the photo like in the mockup -->
					<div class="relative -mt-3 rounded-t-[25px] bg-[#1b201d] px-5 pt-[18px] pb-5 md:px-4 md:pt-4 md:pb-4 lg:px-5 lg:pt-[18px] lg:pb-5">
						<h3 class="text-[26px] md:text-[19px] lg:text-[26px]">{actor.name}</h3>
						<p class="mt-0.5 mb-3 text-[24px] md:text-[17px] lg:text-[24px]">{actor.age} years old</p>

						<div class="flex items-center justify-between">
							<span class="rounded-full border border-[#2f8f5b] bg-[#12301f] px-3 py-1 text-[15px] md:text-[13px] lg:text-[15px]">
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
	<div class="mx-auto flex max-w-[1124px] items-center justify-between px-5 md:px-10 lg:px-16 xl:px-5">
		<p class="text-[16px] text-[#8a8f8c] md:text-[18px] lg:text-[20px]">© Diplomarbeit 26-27</p>
		<a href="/about" class="text-[16px] text-[#35c9b8] md:text-[20px] lg:text-[22px]">about</a>
	</div>
</footer>