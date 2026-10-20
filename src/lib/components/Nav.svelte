<script>
	// Navbar shown on every page (added in +layout.svelte).
	// user = the logged-in user, or null when nobody is logged in
	import logo from '$lib/assets/logo.png';
	import Avatar from './Avatar.svelte';

	let { user } = $props();

	// true = phone dropdown menu is open
	let menuOpen = $state(false);

	// closes the phone menu after clicking a link
	function close() {
		menuOpen = false;
	}
</script>

<div class="pt-3">
	<header
		class="relative mx-3 flex items-center justify-between rounded-[15px] bg-[#1a1a18] pr-3 md:pr-6 xl:mx-auto xl:max-w-[1270px]"
	>
		<a href="/" class="flex items-center gap-4 text-[22px] lg:gap-5 lg:text-[30px]" onclick={close}>
			<img
				src={logo}
				alt="HD Studios logo"
				class="block h-[62px] w-[62px] rounded-l-[15px] lg:h-[73px] lg:w-[73px]"
			/>
			<span>HD Studios</span>
		</a>

		<div class="flex items-center gap-3 lg:gap-7">
			<!-- links: dropdown on phone, normal row from md (768px) up -->
			<nav
				class="{menuOpen ? 'flex' : 'hidden'} absolute top-full right-0 z-10 mt-2 w-48 flex-col items-center gap-4 rounded-[15px] bg-[#1a1a18] p-4 text-[17px]
				md:static md:mt-0 md:flex md:w-auto md:flex-row md:gap-5 md:bg-transparent md:p-0 md:text-[15px] lg:gap-7 lg:text-[20px]"
			>
				<a href="/" onclick={close} class="hover:text-[#35c9b8]">Home</a>
				<a href="/messages" onclick={close} class="hover:text-[#35c9b8]">Inbox</a>
				<a href="/actors" onclick={close} class="hover:text-[#35c9b8]">Actors</a>
				<a href="/news" onclick={close} class="hover:text-[#35c9b8]">News</a>
				<a href="/films" onclick={close} class="hover:text-[#35c9b8]">Films</a>

                
				<!-- only admins see this link -->
				{#if user?.role === 'admin'}
					<a href="/admin/actors" onclick={close} class="text-[#35c9b8] hover:underline">Admin</a>
				{/if}
                
				{#if user}
					<form method="POST" action="/logout">
						<button
							type="submit"
							class="cursor-pointer rounded-full bg-[#084a43] px-5 py-1.5 text-[#8fcfc4] hover:text-[#35c9b8] md:px-4 md:py-1 lg:px-5 lg:py-1.5"
						>
							log out
						</button>
					</form>
				{:else}
					<a
						href="/login"
						onclick={close}
						class="rounded-full bg-[#084a43] px-5 py-1.5 text-[#8fcfc4] hover:text-[#35c9b8] md:px-4 md:py-1 lg:px-5 lg:py-1.5"
					>
						log in
					</a>
				{/if}
			</nav>

			<!-- profile picture: the user's own photo, or the default one -->
			<a href={user ? '/dashboard' : '/login'} onclick={close}>
				<Avatar
					src={user?.avatar_url}
					alt={user ? user.name : 'Log in'}
					class="h-10 w-10 md:h-11 md:w-11 lg:h-14 lg:w-14"
				/>
			</a>

			<!-- menu button: only visible on phone -->
			<button
				class="cursor-pointer text-[28px] leading-none md:hidden"
				aria-label="Open menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				☰
			</button>
		</div>
	</header>
</div>