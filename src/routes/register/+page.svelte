<script>
	let username = '';
	let email = '';
	let name = '';
	let password = '';
	let role = 'actor';
</script>

<svelte:head>
	<title>Register | HD Studios</title>
</svelte:head>

<div class="min-h-screen bg-neutral-950 text-white">
	<div class="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
		<div class="w-full max-w-md">

			<div class="mb-8 text-center">
				<h1 class="text-3xl font-bold tracking-wide">Create Account</h1>
				<p class="mt-2 text-sm text-gray-400">
					Join HD Studios and create your professional profile.
				</p>
			</div>

			<form method="POST" class="space-y-5 rounded-2xl border border-white/10 bg-neutral-900 p-7 shadow-xl">

				<div>
					<label for="name" class="mb-2 block text-sm text-gray-300">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						required
						class="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-green-500"
						placeholder="Your name"
					/>
				</div>

				<div>
					<label for="username" class="mb-2 block text-sm text-gray-300">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						required
						class="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-green-500"
						placeholder="Username"
					/>
				</div>

				<div>
					<label for="email" class="mb-2 block text-sm text-gray-300">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						required
						class="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-green-500"
						placeholder="your@email.com"
					/>
				</div>

				<div>
					<label for="password" class="mb-2 block text-sm text-gray-300">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						required
						class="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-green-500"
						placeholder="Password"
					/>
				</div>

				<div>
					<label for="role" class="mb-2 block text-sm text-gray-300">Account type</label>
					<select
						id="role"
						name="role"
						bind:value={role}
						class="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none focus:border-green-500"
					>
						<option value="actor">Actor</option>
						<option value="director">Director</option>
						<option value="producer">Producer</option>
						<option value="spectator">Spectator</option>
					</select>
				</div>

				<button
					type="submit"
					class="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold transition hover:bg-green-500"
				>
					Create Account
				</button>

				<p class="text-center text-sm text-gray-400">
					Already have an account?
					<a href="/login" class="text-green-500 hover:text-green-400">Login</a>
				</p>
			</form>
		</div>
	</div>
</div>