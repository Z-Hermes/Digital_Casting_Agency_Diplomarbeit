<script>
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';

	// form:        the result of a failed submit (error + values), from the page
	// initial:     values to start with (edit page: the saved film)
	// submitLabel: text of the save button
	// cancelHref:  where "Cancel" goes
	let { form, initial = {}, submitLabel = m.common_save(), cancelHref = '/films' } = $props();
	const start = form?.values ?? initial;

	// the deadline field is only needed while the film is casting
	let stage = $state(start.stage ?? 'casting');

	const inputClass =
		'w-full rounded-lg border border-white/10 bg-[#162322] px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:border-teal-400';
	const labelClass = 'mb-1 block text-[14px] text-[#c9cdca]';
	const hintClass = 'mt-1 text-[13px] text-[#8a8f8c]';
</script>

<form method="POST" use:enhance class="mt-8 space-y-6">
	<div>
		<label for="title" class={labelClass}>{m.filmform_title()}</label>
		<input
			id="title"
			name="title"
			type="text"
			required
			maxlength="150"
			value={start.title ?? ''}
			class={inputClass}
		/>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		<div>
			<label for="year" class={labelClass}>{m.filmform_year()}</label>
			<input
				id="year"
				name="year"
				type="number"
				min="1900"
				max="2100"
				placeholder="2027"
				value={start.year ?? ''}
				class={inputClass}
			/>
		</div>

		<div>
			<label for="stage" class={labelClass}>{m.filmform_stage()}</label>
			<select id="stage" name="stage" bind:value={stage} class={inputClass}>
				<option value="coming_soon">{m.stage_coming_soon_title()}</option>
				<option value="casting">{m.stage_casting_badge()}</option>
				<option value="in_production">{m.stage_in_production_title()}</option>
				<option value="released">{m.stage_released_title()}</option>
			</select>
		</div>
	</div>

	{#if stage === 'casting'}
		<div>
			<label for="casting_deadline" class={labelClass}>{m.filmform_deadline()}</label>
			<input
				id="casting_deadline"
				name="casting_deadline"
				type="date"
				required
				value={start.casting_deadline ?? ''}
				class={inputClass}
			/>
			<p class={hintClass}>{m.filmform_deadline_hint()}</p>
		</div>
	{/if}

	<div>
		<label for="description" class={labelClass}>{m.filmform_description()}</label>
		<textarea
			id="description"
			name="description"
			rows="6"
			maxlength="3000"
			placeholder={m.filmform_description_ph()}
			class={inputClass}>{start.description ?? ''}</textarea
		>
	</div>

	<div>
		<label for="poster_url" class={labelClass}>{m.filmform_poster()}</label>
		<input
			id="poster_url"
			name="poster_url"
			type="text"
			maxlength="500"
			placeholder={m.filmform_poster_ph()}
			value={start.poster_url ?? ''}
			class={inputClass}
		/>
	</div>

	<div>
		<label for="trailer_url" class={labelClass}>{m.filmform_trailer()}</label>
		<input
			id="trailer_url"
			name="trailer_url"
			type="text"
			maxlength="500"
			placeholder="https://www.youtube.com/watch?v=..."
			value={start.trailer_url ?? ''}
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
			{submitLabel}
		</button>
		<a
			href={cancelHref}
			class="rounded-lg border border-white/20 px-6 py-3 text-[#e4e6e4] transition hover:border-white/40"
		>
			{m.common_add_photos_cancel()}
		</a>
	</div>
</form>