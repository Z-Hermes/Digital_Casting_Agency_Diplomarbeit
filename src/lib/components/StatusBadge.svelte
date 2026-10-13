<script>
	// Small pill that shows an actor's status.
	// Use:  <StatusBadge status="Booked" />
	let { status = 'Available', class: className = '' } = $props();

	// one color set per status
	const colors = {
		Available: 'bg-[#12301f] border-[#5cc489] text-[#c8f0d8]',
		'On set': 'bg-[#3a3110] border-[#e0b84a] text-[#f5e3b0]',
		Booked: 'bg-[#3a1414] border-[#e05a5a] text-[#f5c4c4]'
	};
</script>

<span
	class="inline-block rounded-full border px-3 py-1 text-[15px] leading-none {colors[status] ??
		'border-[#666] bg-[#222] text-[#ccc]'} {className}"
>
	{status}
</span>