<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { data, form } = $props();

	// feed position + playback
	let feedEl = $state();
	let activeId = $state(null);
	let feedProgress = $state(0);
	let scrolled = $state(false);
	let muted = $state(true);
	let playProgress = $state(0);
	let needsTap = $state(null);
	let loaded = $state({});
	let durations = $state({});
	let portrait = $state({});
	let failed = $state({});
	const videoEls = {};
	const slideEls = {};
	const likeForms = {};
	let seeking = false;

	let activeIndex = $derived(data.posts.findIndex((p) => p.id === activeId));

	// optimistic overrides: videoId -> { liked, likes, comments }
	let overrides = $state({});

	// double-tap heart + single-tap play/pause flash
	let burst = $state(null);
	let burstTimer;
	let flash = $state(null);
	let flashTimer;
	let tapTimer;
	let lastTap = 0;
	let lastTapId = null;

	// comments drawer
	let commentsFor = $state(null);
	let comments = $state([]);
	let commentsLoading = $state(false);
	let commentBody = $state('');
	let commentsToken = 0;

	// upload modal
	let showUpload = $state(false);
	let fileInput = $state();
	let previewUrl = $state(null);
	let fileName = $state('');
	let fileError = $state(null);
	let fileDuration = $state(null);
	let checking = $state(false);
	let unchecked = $state(false);
	let caption = $state('');
	let uploading = $state(false);
	let dragOver = $state(false);

	let toast = $state(null);
	let toastTimer;
	let expanded = $state({});

	function view(post) {
		const o = overrides[post.id] ?? {};
		return {
			liked: o.liked ?? !!post.liked_by_me,
			likes: o.likes ?? post.likes,
			comments: o.comments ?? post.comments
		};
	}

	function bump(id, delta) {
		const o = overrides[id] ?? {};
		const base = o.comments ?? data.posts.find((p) => p.id === id)?.comments ?? 0;
		overrides[id] = { ...o, comments: base + delta };
	}

	function fmt(n) {
		return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${n}`;
	}

	function durationLabel(s) {
		if (!isFinite(s)) return '';
		const total = Math.round(s);
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	function timeAgo(date) {
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return m.fyp_just_now();
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return m.fyp_minutes_ago({ n: minutes });
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return m.fyp_hours_ago({ n: hours });
		const days = Math.floor(hours / 24);
		if (days < 7) return m.fyp_days_ago({ n: days });
		return new Date(date).toLocaleDateString(getLocale());
	}

	function toastMsg(msg, kind = 'ok') {
		toast = { msg, kind };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 2200);
	}

	function onScroll(e) {
		const el = e.currentTarget;
		const max = el.scrollHeight - el.clientHeight;
		feedProgress = max > 0 ? (el.scrollTop / max) * 100 : 0;
		if (el.scrollTop > 40) scrolled = true;
	}

	function step(dir) {
		feedEl?.scrollBy({ top: dir * feedEl.clientHeight, behavior: 'smooth' });
	}

	function fireBurst(id) {
		burst = { id, key: Date.now() };
		clearTimeout(burstTimer);
		burstTimer = setTimeout(() => (burst = null), 850);
	}

	function togglePlay(id) {
		const el = videoEls[id];
		if (!el) return;
		if (el.paused) {
			el.play().catch(() => {});
			flash = { id, icon: 'play', key: Date.now() };
		} else {
			el.pause();
			flash = { id, icon: 'pause', key: Date.now() };
		}
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flash = null), 550);
	}

	// one tap = play/pause, two quick taps = like (TikTok style)
	function tap(post) {
		const now = Date.now();
		if (lastTapId === post.id && now - lastTap < 300) {
			clearTimeout(tapTimer);
			lastTap = 0;
			lastTapId = null;
			fireBurst(post.id);
			if (!view(post).liked) likeForms[post.id]?.requestSubmit();
		} else {
			lastTap = now;
			lastTapId = post.id;
			clearTimeout(tapTimer);
			tapTimer = setTimeout(() => togglePlay(post.id), 280);
		}
	}

	function seekFromEvent(e, post) {
		const el = videoEls[post.id];
		if (!el || !el.duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		el.currentTime = ratio * el.duration;
		playProgress = ratio * 100;
	}

	async function openComments(post) {
		commentsFor = post;
		comments = [];
		commentsLoading = true;
		commentBody = '';
		const token = ++commentsToken;
		try {
			const res = await fetch(`/foryoupage?videoId=${post.id}`);
			if (token !== commentsToken) return;
			if (res.ok) comments = await res.json();
			else toastMsg(m.fyp_err_load_comments(), 'err');
		} catch {
			if (token === commentsToken) toastMsg(m.fyp_err_load_comments(), 'err');
		}
		if (token === commentsToken) commentsLoading = false;
	}

	function closeComments() {
		commentsToken++;
		commentsFor = null;
		comments = [];
		commentBody = '';
	}

	// client-side pre-check (the server checks again, authoritatively)
	function setFile(file) {
		fileError = null;
		fileDuration = null;
		unchecked = false;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		if (!file) return;

		const okType =
			['video/mp4', 'video/quicktime'].includes(file.type) ||
			(!file.type && /\.(mp4|mov)$/i.test(file.name));
		if (!okType) {
			fileError = m.fyp_err_format();
			return;
		}
		if (file.size > 100 * 1024 * 1024) {
			fileError = m.fyp_err_too_big({ mb: 100 });
			return;
		}

		previewUrl = URL.createObjectURL(file);
		fileName = file.name;
		checking = true;
		const probe = document.createElement('video');
		probe.preload = 'metadata';
		probe.onloadedmetadata = () => {
			checking = false;
			if (!isFinite(probe.duration) || probe.duration === 0) {
				unchecked = true;
				return;
			}
			fileDuration = probe.duration;
			if (probe.duration > 60.5) {
				fileError = m.fyp_err_too_long({ seconds: Math.ceil(probe.duration), max: 60 });
			}
		};
		probe.onerror = () => {
			// e.g. HEVC that this browser cannot decode — the server still checks
			checking = false;
			unchecked = true;
		};
		probe.src = previewUrl;
	}

	function onFileChange() {
		setFile(fileInput.files?.[0]);
	}

	function onDrop(e) {
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		fileInput.files = dt.files;
		setFile(file);
	}

	function openUpload() {
		showUpload = true;
		fileError = null;
	}

	function closeUpload() {
		showUpload = false;
		uploading = false;
		caption = '';
		fileName = '';
		fileError = null;
		fileDuration = null;
		checking = false;
		unchecked = false;
		dragOver = false;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		if (fileInput) fileInput.value = '';
	}

	async function share(post) {
		const url = `${location.origin}/foryoupage#video-${post.id}`;
		try {
			await navigator.clipboard.writeText(url);
			toastMsg(m.fyp_link_copied());
		} catch {
			toastMsg(m.fyp_err_copy(), 'err');
		}
	}

	// which slide is on screen -> play it, pause the rest
	$effect(() => {
		const posts = data.posts;
		const root = feedEl;
		if (!root || posts.length === 0) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting && e.intersectionRatio >= 0.6) {
						activeId = Number(e.target.dataset.id);
						playProgress = 0;
					}
				}
			},
			{ root, threshold: [0.6] }
		);
		for (const p of posts) {
			const el = slideEls[p.id];
			if (el) io.observe(el);
		}
		untrack(() => {
			if (activeId === null) activeId = posts[0].id;
		});
		return () => io.disconnect();
	});

	$effect(() => {
		const id = activeId;
		const m = muted;
		for (const p of data.posts) {
			const el = videoEls[p.id];
			if (!el) continue;
			if (p.id === id) {
				el.muted = m;
				el.play().catch(() => {
					needsTap = id;
				});
			} else {
				el.pause();
			}
		}
	});

	$effect(() => {
		function onKey(e) {
			const tag = e.target?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
			if (e.key === 'Escape') {
				if (showUpload) closeUpload();
				if (commentsFor) closeComments();
				return;
			}
			if (showUpload || commentsFor) return;
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				step(1);
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				step(-1);
			}
			if (e.code === 'Space' && activeId !== null) {
				e.preventDefault();
				togglePlay(activeId);
			}
			if (e.key === 'm' || e.key === 'M') muted = !muted;
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	onMount(() => {
		if (location.hash.startsWith('#video-')) {
			document.getElementById(location.hash.slice(1))?.scrollIntoView();
		}
		return () => {
			clearTimeout(toastTimer);
			clearTimeout(burstTimer);
			clearTimeout(flashTimer);
			clearTimeout(tapTimer);
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	});
</script>

<svelte:head>
	<title>{m.fyp_title()} | Digital Casting Agency</title>
</svelte:head>

<div class="relative bg-[#070a09] text-[#f2f2f0]">
	<div class="stage-glow pointer-events-none fixed inset-0"></div>
	<div class="grain pointer-events-none fixed inset-0"></div>
	<p class="side-mark pointer-events-none fixed left-5 top-1/2 hidden lg:block">{m.fyp_kicker()}</p>

	<!-- vertical snap feed -->
	<div
		bind:this={feedEl}
		onscroll={onScroll}
		class="feed relative z-10 w-full snap-y snap-mandatory {commentsFor || showUpload
			? 'overflow-hidden'
			: 'overflow-y-scroll'} scrollbar-none"
	>
		{#if data.posts.length === 0}
			<section class="slide relative flex w-full snap-start items-center justify-center">
				<div class="frame relative flex w-full max-w-md select-none flex-col items-center justify-center gap-4 overflow-hidden bg-[#162322] px-8 text-center">
					<span class="text-5xl text-[#35c9b8]/70"><i class="fa-solid fa-clapperboard"></i></span>
					<h2 class="text-[24px] font-semibold">{m.fyp_empty_title()}</h2>
					<p class="text-[15px] text-[#8a8f8c]">
						{m.fyp_empty_text()}
					</p>
					{#if data.user?.role === 'actor'}
						<button
							onclick={openUpload}
							class="mt-2 flex cursor-pointer items-center gap-2 rounded-full bg-[#35c9b8] px-6 py-2.5 text-[15px] font-semibold text-[#101413] transition hover:bg-[#5fd8ca]"
						>
							<span><i class="fa-solid fa-video"></i></span> {m.fyp_upload_cta()}
						</button>
					{:else}
						<a
							href="/actors"
							class="mt-2 rounded-full border border-[#35c9b8] px-6 py-2.5 text-[15px] font-medium text-[#35c9b8] transition hover:bg-[#084a43]"
						>
							{m.fyp_browse_actors()}
						</a>
					{/if}
				</div>
			</section>
		{/if}

		{#each data.posts as post, i (post.id)}
			{@const v = view(post)}
			<section
				id="video-{post.id}"
				data-id={post.id}
				bind:this={slideEls[post.id]}
				class="slide relative flex w-full snap-start items-center justify-center"
			>
				<div class="frame relative w-full max-w-md select-none overflow-hidden bg-[#162322]">
					{#if failed[post.id]}
						<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#162322] to-[#0d1413] text-center">
							<span class="text-4xl text-[#35c9b8]/50"><i class="fa-solid fa-film"></i></span>
							<p class="text-[14px] text-[#8a8f8c]">{m.fyp_unavailable()}</p>
						</div>
					{:else}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							bind:this={videoEls[post.id]}
							src={post.url}
							loop
							playsinline
							muted={muted}
							preload={i === 0 ? 'auto' : 'metadata'}
							draggable="false"
							class="absolute inset-0 h-full w-full {portrait[post.id] === false ? 'object-contain' : 'object-cover'}"
							onloadedmetadata={(e) => {
								const el = e.currentTarget;
								durations[post.id] = el.duration;
								portrait[post.id] = el.videoHeight >= el.videoWidth;
							}}
							onloadeddata={() => (loaded[post.id] = true)}
							onerror={() => (failed[post.id] = true)}
							ontimeupdate={(e) => {
								if (post.id === activeId && !seeking) {
									const el = e.currentTarget;
									playProgress = el.duration ? (el.currentTime / el.duration) * 100 : 0;
								}
							}}
						></video>
					{/if}

					<div class="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent"></div>
					<div class="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>

					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="tap-zone absolute inset-0 z-10" onclick={() => tap(post)} role="presentation"></div>

					{#if post.id === activeId && !loaded[post.id] && !failed[post.id]}
						<div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
							<span class="text-3xl text-[#35c9b8]"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
						</div>
					{/if}

					{#if needsTap === post.id}
						<button
							onclick={() => {
								videoEls[post.id]?.play().then(() => (needsTap = null)).catch(() => {});
							}}
							class="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/40 text-white"
						>
							<span class="flex h-16 w-16 items-center justify-center rounded-full bg-[#35c9b8] text-2xl text-[#101413]">
								<i class="fa-solid fa-play"></i>
							</span>
							<span class="text-[13px] font-medium">{m.fyp_tap_to_play()}</span>
						</button>
					{/if}

					{#if burst?.id === post.id}
						{#key burst.key}
							<div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
								<span class="burst-heart text-[96px] text-[#ff3b5c] drop-shadow-[0_6px_30px_rgba(255,59,92,0.55)]">
									<i class="fa-solid fa-heart"></i>
								</span>
							</div>
						{/key}
					{/if}

					{#if flash?.id === post.id}
						{#key flash.key}
							<div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
								<span class="flash-icon flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur-md">
									{#if flash.icon === 'play'}
										<span><i class="fa-solid fa-play"></i></span>
									{:else}
										<span><i class="fa-solid fa-pause"></i></span>
									{/if}
								</span>
							</div>
						{/key}
					{/if}

					<!-- top chrome -->
					<div class="absolute inset-x-0 top-0 z-30 h-[3px] bg-white/5">
						<div class="h-full bg-gradient-to-r from-[#35c9b8] to-[#8df2e2] transition-[width] duration-150" style="width:{feedProgress}%"></div>
					</div>
					<div class="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
						<div class="flex items-center gap-2.5">
							<span class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[15px] text-[#35c9b8] backdrop-blur-md">
								<i class="fa-solid fa-clapperboard"></i>
							</span>
							<div>
								<p class="text-[15px] font-semibold leading-none tracking-wide">{m.fyp_for_you()}</p>
								<p class="mt-1 text-[11px] leading-none text-white/50">
									{activeIndex + 1} / {data.posts.length} · self-tapes
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={() => (muted = !muted)}
								aria-label={muted ? m.fyp_sound_on() : m.fyp_mute()}
								title={muted ? m.fyp_sound_on_key() : m.fyp_mute_key()}
								class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 text-[15px] backdrop-blur-md transition hover:scale-105 hover:bg-black/60 {muted
									? 'sound-hint text-white'
									: 'text-[#35c9b8]'}"
							>
								{#if muted}
									<span><i class="fa-solid fa-volume-xmark"></i></span>
								{:else}
									<span><i class="fa-solid fa-volume-high"></i></span>
								{/if}
							</button>
							{#if data.user?.role === 'actor'}
								<button
									onclick={openUpload}
									aria-label={m.fyp_upload_heading()}
									class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#35c9b8] text-[17px] text-[#101413] shadow-[0_0_24px_rgba(53,201,184,0.45)] transition hover:scale-105 hover:bg-[#5fd8ca]"
								>
									<span><i class="fa-solid fa-plus"></i></span>
								</button>
							{/if}
						</div>
					</div>

					<!-- right action rail -->
					<div class="absolute bottom-24 right-3 z-30 flex flex-col items-center gap-4">
						<a
							href="/user/{post.username}"
							aria-label={m.fyp_profile_of({ name: post.name })}
							class="mb-1 rounded-full ring-2 ring-[#35c9b8] ring-offset-2 ring-offset-black/40 transition hover:scale-105"
						>
							<Avatar src={post.avatar_url} alt={post.name} class="h-11 w-11" />
						</a>

						<form
							method="POST"
							action="?/like"
							bind:this={likeForms[post.id]}
							use:enhance={({ formData }) => {
								const id = Number(formData.get('videoId'));
								const before = view(post);
								overrides[id] = {
									...overrides[id],
									liked: !before.liked,
									likes: before.likes + (before.liked ? -1 : 1)
								};
								return async ({ result, update }) => {
									if (result.type === 'redirect') {
										goto(result.location);
										return;
									}
									if (result.type === 'success') {
										await update({ reset: false });
										overrides = {};
									} else {
										overrides[id] = { ...overrides[id], liked: before.liked, likes: before.likes };
										toastMsg(m.fyp_err_like(), 'err');
									}
								};
							}}
						>
							<input type="hidden" name="videoId" value={post.id} />
							<button class="group flex cursor-pointer flex-col items-center gap-1" aria-label={v.liked ? m.fyp_unlike() : m.fyp_like()}>
								<span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-xl backdrop-blur-md transition group-hover:scale-105 group-hover:bg-black/60">
									{#key v.liked}
										<span class={v.liked ? 'heart-pop text-[#ff3b5c]' : 'text-white'}>
											<i class="fa-solid fa-heart"></i>
										</span>
									{/key}
								</span>
								<span class="text-xs font-semibold drop-shadow">{fmt(v.likes)}</span>
							</button>
						</form>

						<button onclick={() => openComments(post)} class="group flex cursor-pointer flex-col items-center gap-1" aria-label={m.fyp_comments()}>
							<span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-xl backdrop-blur-md transition group-hover:scale-105 group-hover:bg-black/60">
								<span class="text-white"><i class="fa-solid fa-comment"></i></span>
							</span>
							<span class="text-xs font-semibold drop-shadow">{fmt(v.comments)}</span>
						</button>

						<button onclick={() => share(post)} class="group flex cursor-pointer flex-col items-center gap-1" aria-label={m.fyp_copy_link()}>
							<span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-xl backdrop-blur-md transition group-hover:scale-105 group-hover:bg-black/60">
								<span class="text-white"><i class="fa-solid fa-share"></i></span>
							</span>
							<span class="text-xs font-semibold drop-shadow">{m.fyp_share()}</span>
						</button>

						{#if data.user && data.user.id === post.user_id}
							<form
								method="POST"
								action="?/deleteVideo"
								onsubmit={(e) => {
									if (!confirm(m.fyp_confirm_delete()))
										e.preventDefault();
								}}
								use:enhance={({ formData }) => {
									const id = Number(formData.get('videoId'));
									return async ({ result, update }) => {
										if (result.type === 'success') {
											if (commentsFor?.id === id) closeComments();
											await update({ reset: false });
											overrides = {};
											toastMsg(m.fyp_deleted());
										} else if (result.type === 'redirect') {
											goto(result.location);
										} else {
											await update({ reset: false });
											toastMsg(m.fyp_err_delete_video(), 'err');
										}
									};
								}}
							>
								<input type="hidden" name="videoId" value={post.id} />
								<button class="group flex cursor-pointer flex-col items-center gap-1" aria-label={m.fyp_delete_selftape()}>
									<span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-lg text-white/70 backdrop-blur-md transition group-hover:scale-105 group-hover:bg-[#3a1414] group-hover:text-[#ff8a8a]">
										<span><i class="fa-solid fa-trash"></i></span>
									</span>
								</button>
							</form>
						{/if}
					</div>

					<!-- casting info + caption -->
					<div class="absolute bottom-6 left-4 right-20 z-30">
						<div class="flex flex-wrap items-center gap-2">
							<a href="/user/{post.username}" class="text-[16px] font-semibold drop-shadow hover:text-[#35c9b8]">
								@{post.username}
							</a>
							{#if post.availability}
								<StatusBadge status={post.availability} class="text-[11px]" />
							{/if}
						</div>
						<div class="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
							<span class="flex items-center gap-1.5 rounded-full border border-[#35c9b8]/40 bg-[#0f2523]/80 px-2 py-0.5 font-medium text-[#7ef0e0]">
								<span><i class="fa-solid fa-clapperboard"></i></span>
								{m.fyp_selftape()}{#if durations[post.id]} · {durationLabel(durations[post.id])}{/if}
							</span>
							{#if post.city}
								<span class="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-md">
									<span><i class="fa-solid fa-location-dot"></i></span> {post.city}
								</span>
							{/if}
						</div>
						{#if post.caption}
							<button
								onclick={() => (expanded[post.id] = !expanded[post.id])}
								class="mt-1.5 block cursor-pointer text-left text-[14px] leading-snug text-white/90 drop-shadow {expanded[post.id] ? '' : 'line-clamp-2'}"
							>
								{post.caption}
							</button>
						{/if}
						<p class="mt-1.5 text-[11px] text-white/50">{post.name} · {timeAgo(post.created_at)}</p>
					</div>

					{#if i === 0 && !scrolled && data.posts.length > 1}
						<div class="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 text-center text-white/60">
							<span class="hint-bounce block text-[14px]"><i class="fa-solid fa-chevron-up"></i></span>
							<p class="text-[10px] tracking-widest">{m.fyp_swipe()}</p>
						</div>
					{/if}

					<!-- playback seek bar -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="group absolute inset-x-0 bottom-0 z-40 flex h-4 cursor-pointer items-end"
						role="presentation"
						onclick={(e) => e.stopPropagation()}
						onpointerdown={(e) => {
							e.stopPropagation();
							seeking = true;
							e.currentTarget.setPointerCapture(e.pointerId);
							seekFromEvent(e, post);
						}}
						onpointermove={(e) => {
							if (seeking) seekFromEvent(e, post);
						}}
						onpointerup={() => (seeking = false)}
					>
						<div class="h-[3px] w-full bg-white/15 transition-all group-hover:h-[6px]">
							<div
								class="h-full bg-gradient-to-r from-[#35c9b8] to-[#8df2e2]"
								style="width:{post.id === activeId ? playProgress : 0}%"
							></div>
						</div>
					</div>

					<!-- comments drawer -->
					{#if commentsFor?.id === post.id}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="absolute inset-0 z-40 bg-black/50" onclick={closeComments} role="presentation"></div>
						<div class="drawer absolute inset-x-0 bottom-0 z-50 flex h-[68%] flex-col rounded-t-[20px] border-t border-[#2e332f] bg-[#141917]/95 backdrop-blur-xl">
							<div class="flex items-center justify-between border-b border-[#2e332f] px-4 py-3">
								<p class="text-[15px] font-semibold">{m.fyp_comments_count({ count: fmt(v.comments) })}</p>
								<button
									onclick={closeComments}
									aria-label={m.fyp_close_comments()}
									class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#8a8f8c] transition hover:bg-[#232825] hover:text-white"
								>
									<span><i class="fa-solid fa-xmark"></i></span>
								</button>
							</div>

							<div class="themed-scroll flex-1 overflow-y-auto px-4 py-3">
								{#if commentsLoading}
									<div class="flex h-full items-center justify-center text-xl text-[#8a8f8c]">
										<span><i class="fa-solid fa-circle-notch fa-spin"></i></span>
									</div>
								{:else if comments.length === 0}
									<div class="flex h-full flex-col items-center justify-center gap-2 text-center">
										<span class="text-2xl text-[#35c9b8]/60"><i class="fa-regular fa-comment"></i></span>
										<p class="text-[14px] text-[#8a8f8c]">{m.fyp_no_comments()}</p>
									</div>
								{:else}
									<ul class="flex flex-col gap-4">
										{#each comments as c (c.id)}
											<li class="group flex gap-3 {c.pending ? 'opacity-60' : ''}">
												<Avatar src={c.avatar_url} alt={c.name} class="h-8 w-8 shrink-0" />
												<div class="min-w-0 flex-1">
													<p class="text-[13px] font-semibold">
														{c.name}
														<span class="ml-1 text-[11px] font-normal text-[#8a8f8c]">{timeAgo(c.created_at)}</span>
													</p>
													<p class="mt-0.5 whitespace-pre-line text-[14px] leading-snug text-[#e8ece9]">{c.body}</p>
												</div>
												{#if data.user && c.id > 0 && (c.user_id === data.user.id || data.user.role === 'admin')}
													<form
														method="POST"
														action="?/deleteComment"
														use:enhance={({ formData }) => {
															const cid = Number(formData.get('commentId'));
															return async ({ result, update }) => {
																if (result.type === 'success') {
																	comments = comments.filter((x) => x.id !== cid);
																	bump(post.id, -1);
																	await update({ reset: false, invalidateAll: false });
																} else if (result.type === 'redirect') {
																	goto(result.location);
																} else {
																	toastMsg(m.fyp_err_delete_comment(), 'err');
																}
															};
														}}
													>
														<input type="hidden" name="commentId" value={c.id} />
														<button
															aria-label={m.fyp_delete_comment()}
															class="cursor-pointer text-[12px] text-[#8a8f8c] opacity-0 transition group-hover:opacity-100 hover:text-[#ff8a8a]"
														>
															<span><i class="fa-solid fa-trash"></i></span>
														</button>
													</form>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</div>

							<div class="border-t border-[#2e332f] p-3">
								{#if data.user}
									<form
										method="POST"
										action="?/addComment"
										class="flex items-center gap-2"
										use:enhance={({ formData, cancel }) => {
											const body = String(formData.get('body') ?? '').trim();
											if (!body) {
												cancel();
												return;
											}
											const id = Number(formData.get('videoId'));
											const temp = {
												id: -Date.now(),
												user_id: data.user.id,
												name: data.user.name,
												username: data.user.username,
												avatar_url: data.user.avatar_url,
												body,
												created_at: new Date(),
												pending: true
											};
											comments = [...comments, temp];
											bump(id, 1);
											commentBody = '';
											return async ({ result, update }) => {
												if (result.type === 'success') {
													const real = result.data?.comment;
													comments = comments.map((x) =>
														x.id === temp.id ? (real ?? { ...temp, pending: false }) : x
													);
													await update({ reset: false, invalidateAll: false });
												} else if (result.type === 'redirect') {
													goto(result.location);
												} else {
													comments = comments.filter((x) => x.id !== temp.id);
													bump(id, -1);
													toastMsg(m.fyp_err_post_comment(), 'err');
												}
											};
										}}
									>
										<input type="hidden" name="videoId" value={post.id} />
										<input
											bind:value={commentBody}
											name="body"
											maxlength="300"
											placeholder={m.fyp_add_comment_ph()}
											aria-label={m.fyp_add_comment()}
											class="min-w-0 flex-1 rounded-full border border-[#2e332f] bg-[#232825] px-4 py-2 text-[14px] outline-none transition focus:border-[#35c9b8]"
										/>
										<button
											disabled={!commentBody.trim()}
											aria-label={m.fyp_send_comment()}
											class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#35c9b8] text-[#101413] transition hover:bg-[#5fd8ca] disabled:cursor-default disabled:opacity-40"
										>
											<span><i class="fa-solid fa-paper-plane"></i></span>
										</button>
									</form>
								{:else}
									<p class="py-1 text-center text-[14px] text-[#8a8f8c]">
										<a href="/login" class="text-[#35c9b8] hover:underline">{m.common_login()}</a> {m.fyp_login_to_comment()}
									</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/each}
	</div>

	<!-- upload modal (actors only) -->
	{#if showUpload}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
			onclick={closeUpload}
			role="presentation"
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="modal-card themed-scroll max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[20px] border border-[#2e332f] bg-[#141917] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-label={m.fyp_upload_heading()}
				tabindex="-1"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						<span class="text-[18px] text-[#35c9b8]"><i class="fa-solid fa-clapperboard"></i></span>
						<div>
							<h2 class="text-[18px] font-semibold leading-none">{m.fyp_upload_heading()}</h2>
							<p class="mt-1 text-[11px] leading-none text-[#8a8f8c]">
								{m.fyp_used({ used: data.myVideos, max: data.maxVideos })}
							</p>
						</div>
					</div>
					<button
						onclick={closeUpload}
						aria-label={m.common_close()}
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#8a8f8c] transition hover:bg-[#232825] hover:text-white"
					>
						<span><i class="fa-solid fa-xmark"></i></span>
					</button>
				</div>

				{#if data.myVideos >= data.maxVideos}
					<div class="mt-4 flex flex-col items-center gap-3 py-6 text-center">
						<span class="text-3xl text-[#e0b45a]"><i class="fa-solid fa-circle-exclamation"></i></span>
						<p class="text-[15px] text-[#c7cdc9]">
							{m.fyp_max_reached({ max: data.maxVideos })}
						</p>
						<a href="/my-videos" class="rounded-[12px] bg-[#35c9b8] px-6 py-2 text-[15px] font-semibold text-[#101413] transition hover:bg-[#5fd8ca]">
							{m.fyp_manage_videos()}
						</a>
					</div>
				{:else}
					<form
						method="POST"
						action="?/upload"
						enctype="multipart/form-data"
						class="mt-4 flex flex-col gap-3"
						use:enhance={({ cancel }) => {
							if (checking || fileError || !fileInput?.files?.length) {
								cancel();
								if (!fileInput?.files?.length) fileError = m.fyp_err_choose_video();
								return;
							}
							uploading = true;
							return async ({ result, update }) => {
								uploading = false;
								if (result.type === 'success') {
									await update({ reset: false });
									overrides = {};
									closeUpload();
									toastMsg(m.fyp_posted());
									feedEl?.scrollTo({ top: 0, behavior: 'smooth' });
								} else if (result.type === 'redirect') {
									goto(result.location);
								} else {
									await update({ reset: false });
								}
							};
						}}
					>
					<input
							bind:this={fileInput}
							id="fyp-video-input"
							type="file"
							name="video"
							accept="video/mp4,video/quicktime,.mp4,.mov"
							class="hidden"
							onchange={onFileChange}
						/>
						<label
							for="fyp-video-input"
							class="block cursor-pointer overflow-hidden rounded-[14px] border-2 border-dashed transition {dragOver
								? 'border-[#35c9b8] bg-[#0f2523]'
								: 'border-[#2e332f] bg-[#1b201d] hover:border-[#35c9b8]'}"
							ondragover={(e) => {
								e.preventDefault();
								dragOver = true;
							}}
							ondragleave={() => (dragOver = false)}
							ondrop={(e) => {
								e.preventDefault();
								onDrop(e);
							}}
						>

						{#if checking}
							<p class="text-[13px] text-[#8a8f8c]">{m.common_checking_length()}</p>
						{:else if fileDuration !== null}
							<p class="text-[13px] text-[#7ef0e0]">{m.common_length_ok({ seconds: Math.round(fileDuration) })}</p>
						{:else if unchecked}
							<p class="text-[13px] text-[#8a8f8c]">
								{m.common_length_unknown()}
							</p>
						{/if}
						{#if fileError}
							<p class="text-[13px] text-[#ff8a8a]" role="alert">{fileError}</p>
						{/if}
						{#if form?.videoError}
							<p class="text-[13px] text-[#ff8a8a]" role="alert">{form.videoError}</p>
						{/if}

						<div>
							<textarea
								bind:value={caption}
								name="caption"
								rows="2"
								maxlength="300"
								placeholder={m.fyp_caption_ph()}
								aria-label={m.fyp_caption()}
								class="w-full resize-none rounded-[12px] border border-[#2e332f] bg-[#232825] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#35c9b8]"
							></textarea>
							<p class="mt-1 text-right text-[11px] text-[#8a8f8c]">{caption.length}/300</p>
						</div>

						<button
							disabled={uploading || checking || fileError !== null}
							class="flex cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#35c9b8] py-2.5 text-[15px] font-semibold text-[#101413] transition hover:bg-[#5fd8ca] disabled:cursor-wait disabled:opacity-60"
						>
							{#if uploading}
								<span><i class="fa-solid fa-circle-notch fa-spin"></i></span> {m.fyp_uploading()}
							{:else}
								<span><i class="fa-solid fa-paper-plane"></i></span> {m.fyp_post()}
							{/if}
						</button>
						<p class="text-center text-[12px] text-[#8a8f8c]">{m.common_tip_1080p()}</p>
					</form>
				{/if}
			</div>
		</div>
	{/if}

	{#if toast}
		<div class="toast fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
			<p
				class="flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] backdrop-blur-md {toast.kind === 'err'
					? 'border-[#e05a5a]/60 bg-[#3a1414]/90 text-[#ffc9c9]'
					: 'border-[#35c9b8]/60 bg-[#0f2523]/90 text-[#aef4ea]'}"
				role="status"
			>
				{#if toast.kind === 'err'}
					<span><i class="fa-solid fa-circle-exclamation"></i></span>
				{:else}
					<span><i class="fa-solid fa-circle-check"></i></span>
				{/if}
				{toast.msg}
			</p>
		</div>
	{/if}
</div>

<style>
	.feed,
	.slide,
	.frame {
		height: 100vh;
		height: 100dvh;
	}
	@media (min-width: 768px) {
		.frame {
			height: calc(100vh - 2rem);
			height: calc(100dvh - 2rem);
			border-radius: 26px;
			border: 1px solid #2e332f;
			box-shadow: 0 0 90px rgba(53, 201, 184, 0.08);
		}
	}

	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.themed-scroll {
		scrollbar-width: thin;
		scrollbar-color: #2e332f #141917;
	}
	.themed-scroll::-webkit-scrollbar {
		width: 8px;
	}
	.themed-scroll::-webkit-scrollbar-track {
		background: #141917;
	}
	.themed-scroll::-webkit-scrollbar-thumb {
		background: #2e332f;
		border-radius: 8px;
	}
	.themed-scroll::-webkit-scrollbar-thumb:hover {
		background: #35c9b8;
	}

	.tap-zone {
		touch-action: manipulation;
	}

	.stage-glow {
		background:
			radial-gradient(640px circle at 12% 18%, rgba(53, 201, 184, 0.09), transparent 60%),
			radial-gradient(760px circle at 88% 82%, rgba(53, 201, 184, 0.06), transparent 60%),
			radial-gradient(500px circle at 70% 10%, rgba(255, 59, 92, 0.04), transparent 60%);
	}
	.grain {
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
	}
	.side-mark {
		writing-mode: vertical-rl;
		transform: translateY(-50%) rotate(180deg);
		letter-spacing: 0.45em;
		font-size: 11px;
		color: rgba(242, 242, 240, 0.14);
	}

	.heart-pop {
		animation: heartPop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.4);
	}
	@keyframes heartPop {
		0% {
			transform: scale(0.6);
		}
		60% {
			transform: scale(1.3);
		}
		100% {
			transform: scale(1);
		}
	}
	.burst-heart {
		animation: burst 0.85s ease-out forwards;
	}
	@keyframes burst {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		18% {
			transform: scale(1.15);
			opacity: 1;
		}
		70% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.25) translateY(-14px);
			opacity: 0;
		}
	}
	.flash-icon {
		animation: flashFade 0.55s ease-out forwards;
	}
	@keyframes flashFade {
		0% {
			transform: scale(0.7);
			opacity: 0;
		}
		25% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.15);
			opacity: 0;
		}
	}
	.drawer {
		animation: slideUp 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
	}
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	.modal-card {
		animation: scaleIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2);
	}
	@keyframes scaleIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.toast {
		animation: toastIn 0.25s ease-out;
	}
	@keyframes toastIn {
		from {
			transform: translate(-50%, 12px);
			opacity: 0;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}
	.hint-bounce {
		animation: hintBounce 1.6s ease-in-out infinite;
	}
	@keyframes hintBounce {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		50% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}
	.sound-hint {
		animation: soundPulse 2s ease-in-out infinite;
	}
	@keyframes soundPulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(53, 201, 184, 0.45);
		}
		50% {
			box-shadow: 0 0 0 7px rgba(53, 201, 184, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.heart-pop,
		.burst-heart,
		.flash-icon,
		.drawer,
		.modal-card,
		.toast,
		.hint-bounce,
		.sound-hint {
			animation: none;
		}
	}
</style>