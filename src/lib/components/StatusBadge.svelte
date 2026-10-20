<script>
	// Small pill that shows an actor's availability.
	// Works with the database values AND the written-out labels:
	//   <StatusBadge status={actor.availability} />   ('available', 'on_set', 'booked')
	//   <StatusBadge status="Booked" />
	let { status = 'available', class: className = '' } = $props();

	// database value -> text and colors (green / yellow / red)
	const badges = {
		available: { label: 'Available', color: 'bg-[#12301f] border-[#5cc489] text-[#c8f0d8]' },
		on_set: { label: 'On set', color: 'bg-[#3a3110] border-[#e0b84a] text-[#f5e3b0]' },
		booked: { label: 'Booked', color: 'bg-[#3a1414] border-[#e05a5a] text-[#f5c4c4]' }
	};

	// "On set" -> "on_set", "Booked" -> "booked"
	let key = $derived(String(status).toLowerCase().replace(' ', '_'));
	let badge = $derived(badges[key]);
</script>

<span
	class="inline-block rounded-full border px-3 py-1 text-[15px] leading-none {badge?.color ??
		'border-[#666] bg-[#222] text-[#ccc]'} {className}"
>
	{badge?.label ?? status}
</span>