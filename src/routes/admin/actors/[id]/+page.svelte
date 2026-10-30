<script>
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import PhotoManager from '$lib/components/PhotoManager.svelte';

	let { data, form } = $props();

	// after a failed save, show what was typed instead of the old values
	let actor = $derived(form?.values ?? data.actor);
	let saved = $derived(page.url.searchParams.has('saved') && !form);

	// same look for every input field
	const field =
		'w-full rounded-[10px] border border-[#2e332f] bg-[#232825] px-4 py-2.5 text-[16px] text-[#f2f2f0] [color-scheme:dark] outline-none focus:border-[#35c9b8]';
	const label = 'mb-1.5 block text-[14px] text-[#a9b0ab]';
</script>

<svelte:head>
	<title>Edit {data.actor.name} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[900px] px-5 py-10 text-[#f2f2f0] md:px-10">
	<a href="/admin/actors" class="text-[14px] text-[#35c9b8] hover:underline">← Back to all actors</a>

	<div class="mt-6 flex items-center gap-4">
		<Avatar src={data.actor.avatar_url} alt={data.actor.name} class="h-16 w-16 shrink-0" />
		<div>
			<h1 class="text-[28px] md:text-[36px]">Edit {data.actor.name}</h1>
			<a href="/user/{data.actor.username}" class="text-[14px] text-[#8a8f8c] hover:text-[#35c9b8]">
				View public profile
			</a>
		</div>
	</div>

	{#if saved}
		<p class="mt-6 rounded-[10px] border border-[#35c9b8]/60 bg-[#0f2523] px-4 py-3 text-[15px]" role="status">
			Changes saved.
		</p>
	{/if}
	{#if form?.error}
		<p class="mt-6 rounded-[10px] border border-[#e05a5a]/60 bg-[#3a1414] px-4 py-3 text-[15px]" role="alert">
			{form.error}
		</p>
	{/if}

		<!-- ===== Photos ===== -->
	<div class="mt-8">
		<PhotoManager name={data.actor.name} avatarUrl={data.avatarUrl} photos={data.photos} {form} />
	</div>

	<form method="POST" class="mt-8 flex flex-col gap-8">
		<!-- ===== Account ===== -->
		<fieldset class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
			<legend class="px-2 text-[18px]">Account</legend>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="md:col-span-2">
					<label for="name" class={label}>Full name</label>
					<input id="name" name="name" value={actor.name ?? ''} required class={field} />
				</div>
				<div>
					<label for="username" class={label}>Username</label>
					<input id="username" name="username" value={actor.username ?? ''} required class={field} />
				</div>
				<div>
					<label for="email" class={label}>Email</label>
					<input id="email" name="email" type="email" value={actor.email ?? ''} required class={field} />
				</div>
			</div>
		</fieldset>

		<!-- ===== Profile ===== -->
		<fieldset class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
			<legend class="px-2 text-[18px]">Profile</legend>
			<div class="grid gap-4 md:grid-cols-3">
				<div>
					<label for="availability" class={label}>Availability</label>
					<select id="availability" name="availability" value={actor.availability ?? 'available'} class={field}>
						<option value="available">Available</option>
						<option value="on_set">On set</option>
						<option value="booked">Booked</option>
					</select>
				</div>
				<div>
					<label for="birth_date" class={label}>Birth date</label>
					<input id="birth_date" name="birth_date" type="date" value={actor.birth_date ?? ''} class={field} />
				</div>
				<div>
					<label for="gender" class={label}>Gender</label>
					<select id="gender" name="gender" value={actor.gender ?? ''} class={field}>
						<option value="">Not set</option>
						<option value="female">Female</option>
						<option value="male">Male</option>
						<option value="other">Other</option>
					</select>
				</div>
				<div>
					<label for="city" class={label}>City</label>
					<input id="city" name="city" value={actor.city ?? ''} class={field} />
				</div>
				<div>
					<label for="height_cm" class={label}>Height (cm)</label>
					<input id="height_cm" name="height_cm" type="number" min="50" max="250" value={actor.height_cm ?? ''} class={field} />
				</div>
				<div>
					<label for="weight_kg" class={label}>Weight (kg)</label>
					<input id="weight_kg" name="weight_kg" type="number" min="20" max="300" value={actor.weight_kg ?? ''} class={field} />
				</div>
				<div>
					<label for="eye_color" class={label}>Eye color</label>
					<input id="eye_color" name="eye_color" value={actor.eye_color ?? ''} class={field} />
				</div>
				<div>
					<label for="hair_color" class={label}>Hair color</label>
					<input id="hair_color" name="hair_color" value={actor.hair_color ?? ''} class={field} />
				</div>
				<div>
					<label for="education" class={label}>Education</label>
					<input id="education" name="education" value={actor.education ?? ''} class={field} />
				</div>
			</div>
		</fieldset>

		<!-- ===== About ===== -->
		<fieldset class="rounded-[15px] border border-[#2e332f] bg-[#1b201d] p-5 md:p-6">
			<legend class="px-2 text-[18px]">About</legend>
			<div class="flex flex-col gap-4">
				<div>
					<label for="bio" class={label}>Bio</label>
					<textarea id="bio" name="bio" rows="4" class={field}>{actor.bio ?? ''}</textarea>
				</div>
				<div>
					<label for="awards" class={label}>Awards (one per line)</label>
					<textarea id="awards" name="awards" rows="3" class={field}>{actor.awards ?? ''}</textarea>
				</div>
			</div>
		</fieldset>

		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
			<a
				href="/admin/actors"
				class="rounded-lg border border-[#2e332f] px-6 py-3 text-center transition-colors hover:border-[#8a8f8c]"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="cursor-pointer rounded-lg bg-[#35c9b8] px-6 py-3 font-medium text-[#101413] transition-colors hover:bg-[#5fd8ca]"
			>
				Save changes
			</button>
		</div>
	</form>
</div>