<script>
   	import ActorCard from '$lib/components/ActorCard.svelte';
	import landingImage from '$lib/assets/landing-page.jpg';

	// featured actors come from +page.server.js (most bookings first)
   	let { data } = $props();
</script>

<!--
	Sizes:  no prefix = phone | md: = tablet (768px+) | lg: = laptop (1024px+) | xl: = big screen (1280px+)
	Navbar and footer come from +layout.svelte
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
			   			{#each data.actors as actor}
   				<ActorCard
   					name={actor.name}
   					age={actor.age}
   					status={actor.availability}
   					image={actor.avatar_url}
   					href="/user/{actor.username}"
   					class="flex-none basis-[230px] md:basis-[200px] lg:basis-[269px]"
   				/>
   			{:else}
   				<p class="text-[#8a8f8c]">No actors yet.</p>
   			{/each}
		</div>
	</div>
</section>