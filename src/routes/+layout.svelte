<script>
	import './layout.css';

	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	// data.user comes from +layout.server.js (null when nobody is logged in)
	let { data, children } = $props();

	// pages that should NOT show the navbar and footer
	const noNavPages = ['/login', '/register'];
	let showNav = $derived(!noNavPages.includes(page.url.pathname));
</script>

<div class="flex min-h-screen flex-col bg-[#101413] font-['Segoe_UI',system-ui,sans-serif] text-[#f2f2f0]">
	{#if showNav}
		<Nav user={data.user} />
	{/if}

	<!-- flex-1 pushes the footer to the bottom on short pages -->
	<main class="flex-1">
		{@render children()}
	</main>

	{#if showNav}
		<Footer />
	{/if}
</div>

<style>
	/* dark background behind everything + no white edges */
	:global(html, body) {
		margin: 0;
		background: #101413;
	}

	/* hide all scrollbars (scrolling still works) */
	:global(*) {
		scrollbar-width: none;
	}
	:global(*::-webkit-scrollbar) {
		display: none;
	}
</style>