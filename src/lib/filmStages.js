// The 4 stages a film can be in. The value is stored in films.stage in the database.
// Used by FilmCard, the Films page and the film page, so the texts and colors are the same everywhere.
import { m } from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime.js';

// "get" = the text is read again each time, so every visitor gets their own language
export const filmStages = [
	{
		key: 'casting',
		get title() { return m.stage_casting_title(); },
		get description() { return m.stage_casting_desc(); },
		get badge() { return m.stage_casting_badge(); },
		color: 'border-[#35c9b8] bg-[#084a43] text-[#bfeee6]'
	},
	{
		key: 'coming_soon',
		get title() { return m.stage_coming_soon_title(); },
		get description() { return m.stage_coming_soon_desc(); },
		get badge() { return m.stage_coming_soon_badge(); },
		color: 'border-[#6b8db5] bg-[#1b2836] text-[#c9d8ea]'
	},
	{
		key: 'in_production',
		get title() { return m.stage_in_production_title(); },
		get description() { return m.stage_in_production_desc(); },
		get badge() { return m.stage_in_production_badge(); },
		color: 'border-[#e0b84a] bg-[#3a3110] text-[#f5e3b0]'
	},
	{
		key: 'released',
		get title() { return m.stage_released_title(); },
		get description() { return m.stage_released_desc(); },
		get badge() { return m.stage_released_badge(); },
		color: 'border-[#666] bg-[#222] text-[#ccc]'
	}
];

// finds the stage object for a database value, e.g. getStage('casting')
export function getStage(key) {
	return filmStages.find((stage) => stage.key === key);
}

// 2026-11-15 -> "15 Nov 2026"   (withYear = false -> "15 Nov")
// getLocale() = month names in the chosen language (Nov / Nov. / nën / nov)
export function formatDate(date, withYear = true) {
	if (!date) return '';
	return new Date(date).toLocaleDateString(getLocale(), {
		day: 'numeric',
		month: 'short',
		year: withYear ? 'numeric' : undefined
	});
}