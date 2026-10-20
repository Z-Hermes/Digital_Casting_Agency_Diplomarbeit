<script>
	// Search field from the Database mockup.
	// Put it inside a <form method="GET">: pressing Enter sends ?search=... to the page.
	// Use:  <form method="GET"><SearchBar value={data.search} /></form>
	let { name = 'search', value = '', placeholder = 'Search', class: className = '' } = $props();
</script>

<div class="relative w-full md:max-w-[360px] {className}">
	<!-- magnifying glass -->
	<svg
		class="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#595d59]"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>

	<input
		type="search"
		{name}
		{value}
		{placeholder}
		aria-label={placeholder}
		class="w-full rounded-[10px] border border-[#2e332f] bg-[#232825] py-2.5 pr-4 pl-12 text-[18px] text-[#f2f2f0] outline-none placeholder:text-[#595d59] focus:border-[#35c9b8]"
	/>
</div>