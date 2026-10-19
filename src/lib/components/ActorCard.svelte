<script>
	// Actor card used on the Home page and the Actors page.
	// variant="landing"  -> big text + "..." link   (home page)
	// variant="database" -> smaller text + "More" link   (actors page)
	// Use:
	//   <ActorCard name={actor.name} age={actor.age} status={actor.availability}
	//              image={actor.avatar_url} href="/user/{actor.username}" />
	import Img from './Img.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let {
		name,
		age = null,
		status = '',
		image = '',
		href = '/actors',
		variant = 'landing',
		class: className = ''
	} = $props();

	let isLanding = $derived(variant === 'landing');
</script>

<article class="overflow-hidden rounded-[25px] border border-[#2e332f] bg-[#1b201d] {className}">
	<a {href} tabindex="-1">
		<Img
			src={image}
			alt={name}
			class="block w-full object-cover {isLanding ? 'h-[200px] md:h-[170px] lg:h-[200px]' : 'h-[190px]'}"
		/>
	</a>

	<!-- -mt-3 makes the box overlap the photo like in the mockup -->
	<div
		class="relative -mt-3 rounded-t-[25px] bg-[#1b201d] {isLanding
			? 'px-5 pt-[18px] pb-5 md:px-4 md:pt-4 md:pb-4 lg:px-5 lg:pt-[18px] lg:pb-5'
			: 'px-5 pt-4 pb-4'}"
	>
		{#if isLanding}
			<h3 class="text-[26px] md:text-[19px] lg:text-[26px]">{name}</h3>
			{#if age}<p class="mt-0.5 text-[24px] md:text-[17px] lg:text-[24px]">{age} years old</p>{/if}
		{:else}
			<h3 class="text-[18px]">{name}</h3>
			{#if age}<p class="text-[18px]">{age} years old</p>{/if}
		{/if}

		<div class="mt-3 flex items-center justify-between">
			{#if status}
				<StatusBadge {status} class={isLanding ? '' : 'text-[14px]'} />
			{:else}
				<span></span>
			{/if}

			{#if isLanding}
				<a
					{href}
					class="text-[28px] leading-none font-bold text-[#35c9b8]"
					aria-label="More about {name}">...</a
				>
			{:else}
				<a {href} class="text-[13px] text-[#35c9b8] hover:underline">More</a>
			{/if}
		</div>
	</div>
</article>