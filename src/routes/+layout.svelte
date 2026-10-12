<script>
	import './layout.css';
	import Nav from '$lib/components/Nav.svelte';
	import { page } from '$app/state';

	// pages that should NOT show the navbar
	const noNavPages = ['/login', '/register'];
	let showNav = $derived(!noNavPages.includes(page.url.pathname));

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-[#101413] font-['Segoe_UI',system-ui,sans-serif] text-[#f2f2f0]">
	{#if showNav}
		<Nav user={data.user} />
	{/if}

	{@render children()}
</div>

<style>
	:global(html, body) {
		margin: 0;
		background: #101413;
	}

	:global(*) {
		scrollbar-width: none;
	}
	:global(*::-webkit-scrollbar) {
		display: none;
	}
</style>