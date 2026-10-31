<script>
	import { enhance } from '$app/forms';

	let { form } = $props();

	// the deadline field is only needed while the film is casting
	let stage = $state(form?.values?.stage ?? 'casting');

	const inputClass =
		'w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:border-teal-400';
	const labelClass = 'mb-1 block text-[14px] text-[#c9cdca]';
	const hintClass = 'mt-1 text-[13px] text-[#8a8f8c]';
</script>

<svelte:head>
	<title>Add film | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 text-[#f2f2f0] md:px-10">
	<a href="/films" class="text-[14px] text-[#35c9b8] hover:underline">← Back to films</a>
	<h1 class="mt-3 text-[32px] font-light">Add a film</h1>
	<p class="mt-2 text-[#8a8f8c]">
		Applications for your film arrive in your inbox, with the actor's profile and message.
	</p>

	<form method="POST" use:enhance class="mt-8 space-y-6">
		<div>
			<label for="title" class={labelClass}>Title</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				maxlength="150"
				value={form?.values?.title ?? ''}
				class={inputClass}
			/>
		</div>

		<div class="grid gap-6 sm:grid-cols-2">
			<div>
				<label for="year" class={labelClass}>Year</label>
				<input
					id="year"
					name="year"
					type="number"
					min="1900"
					max="2100"
					placeholder="2027"
					value={form?.values?.year ?? ''}
					class={inputClass}
				/>
			</div>

			<div>
				<label for="stage" class={labelClass}>Stage</label>
				<select id="stage" name="stage" bind:value={stage} class={inputClass}>
					<option value="coming_soon">Coming soon</option>
					<option value="casting">Casting open</option>
					<option value="in_production">In production</option>
					<option value="released">Released</option>
				</select>
			</div>
		</div>

		{#if stage === 'casting'}
			<div>
				<label for="casting_deadline" class={labelClass}>Applications close on</label>
				<input
					id="casting_deadline"
					name="casting_deadline"
					type="date"
					required
					value={form?.values?.casting_deadline ?? ''}
					class={inputClass}
				/>
				<p class={hintClass}>Actors can apply until this day.</p>
			</div>
		{/if}

		<div>
			<label for="description" class={labelClass}>Description</label>
			<textarea
				id="description"
				name="description"
				rows="6"
				maxlength="3000"
				placeholder="What is the film about? Where and when is it shot?"
				class={inputClass}>{form?.values?.description ?? ''}</textarea
			>
		</div>

		<div>
			<label for="poster_url" class={labelClass}>Poster (optional)</label>
			<input
				id="poster_url"
				name="poster_url"
				type="text"
				maxlength="500"
				placeholder="/media/poster.jpg or https://..."
				value={form?.values?.poster_url ?? ''}
				class={inputClass}
			/>
		</div>

		<div>
			<label for="trailer_url" class={labelClass}>Trailer link (optional)</label>
			<input
				id="trailer_url"
				name="trailer_url"
				type="text"
				maxlength="500"
				placeholder="https://www.youtube.com/watch?v=..."
				value={form?.values?.trailer_url ?? ''}
				class={inputClass}
			/>
		</div>

		{#if form?.error}
			<p role="alert" class="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-red-300">
				{form.error}
			</p>
		{/if}

		<div class="flex gap-3">
			<button
				type="submit"
				class="rounded-lg bg-teal-400 px-6 py-3 font-medium text-[#032624] transition hover:bg-teal-300"
			>
				Add film
			</button>
			<a
				href="/films"
				class="rounded-lg border border-white/20 px-6 py-3 text-[#e4e6e4] transition hover:border-white/40"
			>
				Cancel
			</a>
		</div>
	</form>
</div>