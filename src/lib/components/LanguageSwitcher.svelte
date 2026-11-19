<script>
	// Dropdown to change the website language (EN / DE / SQ / IT).
	// The choice is saved in a cookie, then the page reloads in the new language.
	import { locales, getLocale, setLocale } from '$lib/paraglide/runtime.js';

	const labels = { en: 'EN', de: 'DE', sq: 'SQ', it: 'IT' };

	const current = getLocale();
</script>

<label for="language" class="sr-only">Language</label>
<select
	id="language"
	value={current}
	onchange={(event) => setLocale(event.currentTarget.value)}
	class="cursor-pointer rounded-full border border-[#2e332f] bg-[#232825] px-3 py-1 text-[14px] text-[#f2f2f0] outline-none hover:border-[#35c9b8] focus:border-[#35c9b8] lg:text-[16px]"
>
	{#each locales as locale (locale)}
		<option value={locale}>{labels[locale] ?? locale.toUpperCase()}</option>
	{/each}
</select>