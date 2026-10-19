// The 4 stages a film can be in. The value is stored in films.stage in the database.
// Used by FilmCard, the Films page and the film page, so the texts and colors are the same everywhere.

export const filmStages = [
	{
		key: 'casting',
		title: 'Casting now',
		description: 'Productions looking for actors. Open a film to apply for a role.',
		badge: 'Casting open',
		color: 'border-[#35c9b8] bg-[#084a43] text-[#bfeee6]'
	},
	{
		key: 'coming_soon',
		title: 'Coming soon',
		description: 'Announced productions. Casting has not opened yet.',
		badge: 'Coming soon',
		color: 'border-[#6b8db5] bg-[#1b2836] text-[#c9d8ea]'
	},
	{
		key: 'in_production',
		title: 'In production',
		description: 'Cast is complete and the cameras are rolling.',
		badge: 'Shooting',
		color: 'border-[#e0b84a] bg-[#3a3110] text-[#f5e3b0]'
	},
	{
		key: 'released',
		title: 'Released',
		description: 'Finished films.',
		badge: 'Released',
		color: 'border-[#666] bg-[#222] text-[#ccc]'
	}
];

// finds the stage object for a database value, e.g. getStage('casting')
export function getStage(key) {
	return filmStages.find((stage) => stage.key === key);
}

// 2026-11-15 -> "15 Nov 2026"   (withYear = false -> "15 Nov")
export function formatDate(date, withYear = true) {
	if (!date) return '';
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: withYear ? 'numeric' : undefined
	});
}