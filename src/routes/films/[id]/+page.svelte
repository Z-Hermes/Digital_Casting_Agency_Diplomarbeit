<script>
    import filmRoll from '$lib/assets/film_roll_teal.png';
    import Img from '$lib/components/Img.svelte';
    import { getStage, formatDate } from '$lib/filmStages.js';
    import { enhance } from '$app/forms';
    import { m } from '$lib/paraglide/messages.js';

    let { data, form } = $props();

    let stage = $derived(getStage(data.film.stage));

    // database value -> translated status text
    const applicationLabels = {
        pending: m.application_pending(),
        accepted: m.application_accepted(),
        declined: m.application_declined()
    };

    // Steuert, ob das Bewerbungsformular/Modal offen ist
    let showApplyModal = $state(false);

    // remembers a poster that failed to load -> the placeholder is shown instead
    let failedPoster = $state(null);
    let showPoster = $derived(data.film.poster_url && data.film.poster_url !== failedPoster);

    // turns a normal YouTube link into an embeddable one
    function embedUrl(url) {
        if (!url) return null;
        const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
</script>

<svelte:head>
    <title>{data.film.title} | HD Studios</title>
</svelte:head>

<div class="mx-auto max-w-[1000px] px-5 py-10 text-[#f2f2f0] md:px-10">
    <div class="flex items-center justify-between gap-4">
        <a href="/films" class="text-[14px] text-[#35c9b8] hover:underline">{m.film_back()}</a>

        {#if data.user && (data.user.role === 'admin' || data.film.producer_id === data.user.id)}
            <a
                href="/films/{data.film.id}/edit"
                class="rounded-lg border border-white/20 px-4 py-2 text-[14px] text-[#e4e6e4] transition hover:border-teal-400 hover:text-teal-300"
            >
                {m.film_edit()}
            </a>
        {/if}
    </div>

    <div class="mt-6 flex flex-col gap-8 md:flex-row">
        <!-- poster (2:3), or the film frame when there is no poster yet -->
        <div
            class="relative aspect-[2/3] w-full max-w-[220px] shrink-0 overflow-hidden rounded-[15px] border border-[#2e332f] bg-gradient-to-b from-[#0f3b37] to-[#101413] sm:max-w-[300px]"
        >
            {#if showPoster}
                <img
                    src={data.film.poster_url}
                    alt={data.film.title}
                    class="h-full w-full object-cover"
                    onerror={() => (failedPoster = data.film.poster_url)}
                />
            {:else}
                <img src={filmRoll} alt="" class="absolute top-[18%] left-1/2 w-3/4 -translate-x-1/2 opacity-70" />
            {/if}
        </div>

        <div class="flex-1">
            <h1 class="text-[36px] md:text-[42px]">{data.film.title}</h1>
            {#if data.film.year}<p class="text-[16px] text-[#8a8f8c]">{data.film.year}</p>{/if}

            {#if stage}
                <span class="mt-4 inline-block rounded-full border px-3 py-1 text-[13px] leading-none {stage.color}">
                    {stage.badge}
                </span>
            {/if}

            <!-- casting box: only for films that are looking for actors -->
            {#if data.film.stage === 'casting'}
                <div class="mt-6 rounded-[15px] border border-[#35c9b8]/60 bg-[#0f2523] p-5">
                    <p class="text-[18px]">{m.film_casting_now()}</p>
                    <p class="mt-1 text-[14px] text-[#a9b0ab]">
                        {#if data.film.casting_deadline}
                            {m.film_deadline_text({ date: formatDate(data.film.casting_deadline) })}
                        {:else}
                            {m.film_applications_open()}
                        {/if}
                    </p>

                    {#if data.application}
                        <p class="mt-4 text-[14px] text-[#35c9b8] font-medium">
                            {m.film_applied({ status: applicationLabels[data.application.status] ?? data.application.status })}
                        </p>
                        {#if form?.conversationId}
                            <a
                                href="/messages/{form.conversationId}"
                                class="mt-2 inline-block text-[14px] text-[#35c9b8] underline hover:text-[#5fd8ca]"
                            >
                                {m.film_open_conversation()}
                            </a>
                        {/if}
                    {:else if data.user?.role === 'actor'}
                        <button
                            type="button"
                            onclick={() => (showApplyModal = !showApplyModal)}
                            class="mt-4 cursor-pointer rounded-lg bg-[#35c9b8] px-6 py-3 font-medium text-[#101413] transition-colors hover:bg-[#5fd8ca]"
                        >
                            {showApplyModal ? m.film_close_form() : m.film_apply_role()}
                        </button>
                    {:else if !data.user}
                        <a
                            href="/login"
                            class="mt-4 inline-block rounded-lg bg-[#35c9b8] px-6 py-3 font-medium text-[#101413] transition-colors hover:bg-[#5fd8ca]"
                        >
                            {m.film_login_to_apply()}
                        </a>
                    {/if}

                    <!-- Bewerbungsformular (wird eingeblendet, wenn geklickt) -->
                    {#if showApplyModal && !data.application}
                        <form method="POST" action="?/apply" use:enhance class="mt-4 flex flex-col gap-3">
                            {#if form?.error}
                                <p class="text-red-400 text-[14px]">{form.error}</p>
                            {/if}

                            <label class="text-[14px] text-[#a9b0ab]" for="message">{m.film_message_label()}</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="3"
                                maxlength="1000"
                                placeholder={m.film_message_ph()}
                                class="w-full rounded-lg border border-[#2e332f] bg-[#101413] p-3 text-[14px] text-white focus:border-[#35c9b8] focus:outline-none"
                            ></textarea>

                            <button
                                type="submit"
                                class="self-start rounded-lg bg-[#35c9b8] px-5 py-2 font-medium text-[#101413] hover:bg-[#5fd8ca]"
                            >
                                {m.film_submit()}
                            </button>
                        </form>
                    {/if}
                </div>
            {:else if data.film.stage === 'coming_soon'}
                <p class="mt-6 text-[15px] text-[#a9b0ab]">{m.film_not_open()}</p>
            {/if}

            {#if data.film.description}
                <p class="mt-5 whitespace-pre-line text-[17px] leading-relaxed text-[#c7cdc9]">
                    {data.film.description}
                </p>
            {/if}

            {#if data.film.trailer_url}
                <div class="mt-6 aspect-video w-full overflow-hidden rounded-[15px]">
                    <iframe
                        src={embedUrl(data.film.trailer_url)}
                        title={m.film_trailer_title({ title: data.film.title })}
                        class="h-full w-full"
                        allowfullscreen
                    ></iframe>
                </div>
            {/if}
        </div>
    </div>

    {#if data.cast && data.cast.length > 0}
        <div class="mt-12">
            <h2 class="text-[26px]">{m.film_cast()}</h2>
            <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {#each data.cast as member}
                    <a
                        href="/user/{member.username}"
                        class="overflow-hidden rounded-[15px] border border-[#2a302d] bg-[#1b201d] transition hover:border-teal-400"
                    >
                        <Img src={member.avatar_url} alt={member.name} class="h-[160px] w-full object-cover" />
                        <div class="p-3">
                            <p class="text-[15px]">{member.name}</p>
                            {#if member.role_name}<p class="text-[13px] text-[#8a8f8c]">{m.common_as_role({ role: member.role_name })}</p>{/if}
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</div>