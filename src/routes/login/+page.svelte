<script>
    let { form } = $props();

    let username = $state('');
    let password = $state('');
</script>

<svelte:head>
	<title>Login | HD Studios</title>
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden bg-[#032624] text-white"
	style="background:
		radial-gradient(circle at 15% 45%, rgba(0, 150, 135, 0.38), transparent 35%),
		radial-gradient(circle at 60% 20%, rgba(0, 110, 100, 0.25), transparent 35%),
		radial-gradient(circle at 85% 80%, rgba(0, 190, 170, 0.18), transparent 35%),
		linear-gradient(135deg, #062f2d 0%, #075c55 50%, #021d1c 100%);"
>
	<div class="mx-auto flex min-h-screen max-w-6xl items-center gap-20 px-8">

		<div class="w-1/2 -translate-y-10">
			<p class="text-2xl tracking-wide">
				<span class="text-teal-400">HD</span> Studios
			</p>

			<h1 class="mt-12 text-6xl font-light tracking-tight">
				Welcome Back
			</h1>

			<div class="mt-6 h-1 w-24 rounded-full bg-teal-400"></div>

			<p class="mt-8 max-w-lg text-xl leading-relaxed text-teal-100/70">
				Sign in to your HD Studios account and continue
				exploring opportunities in the Albanian film industry.
			</p>
		</div>

		<div class="relative w-[530px] rounded-[28px] bg-black p-5 shadow-2xl">

			<div class="absolute left-4 top-5 flex h-[calc(100%-40px)] flex-col justify-between">
				{#each Array(8) as _}
					<div class="h-8 w-12 rounded-lg bg-[#18201f]"></div>
				{/each}
			</div>

			<div class="absolute right-4 top-5 flex h-[calc(100%-40px)] flex-col justify-between">
				{#each Array(8) as _}
					<div class="h-8 w-12 rounded-lg bg-[#18201f]"></div>
				{/each}
			</div>

			<div class="relative mx-12 min-h-[480px] rounded-sm bg-[#111817] px-10 py-8">

				<div class="text-center">
					<h2 class="text-3xl font-light">
						Login
					</h2>

					<div class="mx-auto mt-3 h-1 w-24 rounded-full bg-teal-400"></div>
				</div>

				{#if form?.error}
					<p class="mt-4 text-center text-sm text-red-400">{form.error}</p>
				{/if}

				<form method="POST" class="mt-10 space-y-4" action="?/login">

					<input
						name="username"
						type="text"
						bind:value={username}
						required
						placeholder="Username"
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

					<div class="pt-1 text-right">
						<a
							href="/reset-password"
							class="text-sm text-teal-400 transition hover:text-teal-300"
						>
							Forgot password?
						</a>
					</div>

					<button
						type="submit"
						class="mt-3 w-full rounded-lg bg-teal-400 py-3 font-medium text-white transition hover:bg-teal-300"
					>
						Login
					</button>

					<p class="pt-4 text-center text-sm text-gray-400">
						Don't have an account?
						<a
							href="/register"
							class="ml-2 text-teal-400 transition hover:text-teal-300"
						>
							Create Account
						</a>
					</p>

				</form>
			</div>
		</div>
	</div>
</div>