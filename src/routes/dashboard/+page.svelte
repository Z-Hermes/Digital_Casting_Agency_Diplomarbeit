<script>
	import { m } from '$lib/paraglide/messages.js';
    let { data } = $props();
</script>

<svelte:head>
<title>{m.dashboard_title()} | HD Studios</title></svelte:head>

<div class="min-h-screen bg-[#032624] p-10 text-white">
	<h1 class="text-4xl font-light">{m.dashboard_welcome({ name: data.user.name })}</h1>
	<p class="mt-2 text-teal-100/70">{m.dashboard_role({ role: data.user.role })}</p>

	<form method="POST" action="/logout" class="mt-6">
		<button
			type="submit"
			class="rounded-lg bg-teal-400 px-4 py-2 font-medium text-white transition hover:bg-teal-300"
		>
			{m.dashboard_logout()}
		</button>
	</form>
</div>