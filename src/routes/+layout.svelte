<script>
	// KEEP the CSS import your project already has here (from the Tailwind setup),
	// e.g. import './layout.css';  or  import '../app.css';
	import './layout.css';

	import logo from '$lib/assets/logo.png';
	import defaultPfp from '$lib/assets/default-pfp.png';

	let { children } = $props();

	// true = phone dropdown menu is open
	let menuOpen = $state(false);
</script>

<div class="min-h-screen bg-[#101413] pt-3 font-['Segoe_UI',system-ui,sans-serif] text-[#f2f2f0]">
	<!-- ===== NAVBAR (shown on every page) ===== -->
	<header
		class="relative mx-3 flex items-center justify-between rounded-[15px] bg-[#1a1a18] pr-3 sm:pr-6 xl:mx-auto xl:max-w-[1270px]"
	>
		<a href="/" class="flex items-center gap-4 text-[24px] sm:gap-5 sm:text-[30px]">
			<img src={logo} alt="HD Studios logo" class="block h-[73px] w-[73px] rounded-l-[15px]" />
			<span>HD Studios</span>
		</a>

		<div class="flex items-center gap-3 sm:gap-7">
			<!-- links: dropdown on phone, normal row from sm (640px) up -->
			<nav
				class="{menuOpen ? 'flex' : 'hidden'} absolute top-full right-0 z-10 mt-2 w-48 flex-col items-center gap-4 rounded-[15px] bg-[#1a1a18] p-4 text-[17px]
				sm:static sm:mt-0 sm:flex sm:w-auto sm:flex-row sm:gap-7 sm:bg-transparent sm:p-0 sm:text-[20px]"
				onclick={() => (menuOpen = false)}
			>
				<a href="/" class="hover:text-[#35c9b8]">Home</a>
				<a href="/inbox" class="hover:text-[#35c9b8]">Inbox</a>
				<a href="/actors" class="hover:text-[#35c9b8]">Actors</a>
				<a href="/news" class="hover:text-[#35c9b8]">News</a>
				<a href="/login" class="rounded-full bg-[#084a43] px-5 py-1.5 text-[#8fcfc4] hover:text-[#35c9b8]">
					log in
				</a>
			</nav>

			<a href="/profile">
				<img
					src={defaultPfp}
					alt="Your profile"
					class="block h-10 w-10 rounded-full border-2 border-[#666] object-cover sm:h-14 sm:w-14"
				/>
			</a>

			<!-- menu button: only visible on phone -->
			<button
				class="cursor-pointer text-[28px] leading-none sm:hidden"
				aria-label="Open menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				☰
			</button>
		</div>
	</header>

	{@render children()}
</div>

<style>
	/* dark background behind everything + no white edges */
	:global(html, body) {
		margin: 0;
		background: #101413;
	}

	/* hide all scrollbars (scrolling still works) */
	:global(*) {
		scrollbar-width: none; /* Firefox, Chrome, Edge */
	}
	:global(*::-webkit-scrollbar) {
		display: none; /* Safari, older Chrome */
	}
</style>