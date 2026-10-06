<script>

	let {form} = $props();
	let username = $state('');
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let role = $state('actor');
</script>

<svelte:head>
	<title>Register | HD Studios</title>
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden bg-[#032624] text-white"
	style="background:
		radial-gradient(circle at 15% 45%, rgba(0, 150, 135, 0.38), transparent 35%),
		radial-gradient(circle at 60% 20%, rgba(0, 110, 100, 0.25), transparent 35%),
		radial-gradient(circle at 85% 80%, rgba(0, 190, 170, 0.18), transparent 35%),
		linear-gradient(135deg, #062f2d 0%, #075c55 50%, #021d1c 100%);"
>
	<div class="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 sm:px-8 lg:flex-row lg:gap-20">

		<div class="w-full lg:w-1/2 lg:-translate-y-10">
			<p class="text-2xl tracking-wide">
				<span class="text-teal-400">HD</span> Studios
			</p>

			<h1 class="mt-6 text-4xl font-light tracking-tight sm:text-6xl lg:mt-12">
				Create Account
			</h1>

			<div class="mt-6 h-1 w-24 rounded-full bg-teal-400"></div>

			<p class="mt-8 max-w-lg text-lg leading-relaxed text-teal-100/70 sm:text-xl">
				Join HD Studios and create your professional profile.
				Connect with actors, directors, producers and other people
				working in the Albanian film industry.
			</p>
		</div>

		<div class="relative w-full max-w-[530px] rounded-[28px] bg-black p-5 shadow-2xl">

			<div class="absolute left-2 top-5 flex h-[calc(100%-40px)] flex-col justify-between sm:left-4">
				{#each Array(8) as _}
					<div class="h-8 w-7 rounded-lg bg-[#18201f] sm:w-12"></div>
				{/each}
			</div>

			<div class="absolute right-2 top-5 flex h-[calc(100%-40px)] flex-col justify-between sm:right-4">
				{#each Array(8) as _}
					<div class="h-8 w-7 rounded-lg bg-[#18201f] sm:w-12"></div>
				{/each}
			</div>

			<div class="relative mx-6 rounded-sm bg-[#111817] px-5 py-8 sm:mx-12 sm:px-10">

				<div class="text-center">
					<h2 class="text-3xl font-light">
						Register
					</h2>

					<div class="mx-auto mt-3 h-1 w-24 rounded-full bg-teal-400"></div>
				</div>

				<form method="POST" class="mt-7 space-y-3" action="?/register">

					<input
						name="name"
						type="text"
						bind:value={name}
						required
						placeholder="Full name"
						class="w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-teal-400"
					/>

					<input
						name="username"
						type="text"
						bind:value={username}
						required
						placeholder="Username"
						class="w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-teal-400"
					/>

					<input
						name="email"
						type="email"
						bind:value={email}
						required
						placeholder="Email address"
						class="w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-teal-400"
					/>

					<input
						name="password"
						type="password"
						bind:value={password}
						required
						placeholder="Password"
						class="w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none transition placeholder:text-gray-400 focus:border-teal-400"
					/>

					<div class="relative">
						<select
							name="role"
							bind:value={role}
							class="w-full appearance-none rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-gray-300 outline-none transition focus:border-teal-400"
						>
							<option value="actor">Actor</option>
							<option value="producer">Producer</option>
							<option value="director">Director</option>
							<option value="spectator">Guest</option>
						</select>

						<div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-teal-400">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</div>
					</div>

					<button
						type="submit"
						class="w-full rounded-lg bg-teal-400 py-3 font-medium text-white transition hover:bg-teal-300"
					>
						Create Account
					</button>

					{#if form?.error}
    <p role="alert" class="text-sm text-red-400">
        {form.error}
    </p>
{/if}

					<p class="pt-2 text-center text-sm text-gray-400">
						Already have an account?
						<a
							href="/login"
							class="ml-2 text-teal-400 transition hover:text-teal-300"
						>
							Login
						</a>
					</p>

				</form>
			</div>
		</div>
	</div>
</div>