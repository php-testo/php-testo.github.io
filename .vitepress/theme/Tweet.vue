<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import { getLocaleByPath } from '../locales'

const props = withDefaults(defineProps<{
  /** Tweet id, the numeric tail of the status URL. */
  id: string
  /** Author handle without the @, used to build the fallback link. */
  user?: string
  /** Optional preview image shown while the embed is loading. */
  poster?: string
  /** Caption under the placeholder — usually a hint of what's in the tweet. */
  caption?: string
}>(), {
  user: 'i',
})

const route = useRoute()
const { isDark } = useData()

const locale = computed(() => getLocaleByPath(route.path))
const tweetUrl = computed(() => `https://x.com/${props.user}/status/${props.id}`)

const root = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const state = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')

/**
 * widgets.js is shared by every Tweet on the page, so the loader is cached at
 * module level. A failed load resets the cache — the next attempt retries.
 */
let widgetsPromise: Promise<any> | null = null

function loadWidgets(): Promise<any> {
  if (widgetsPromise) return widgetsPromise

  widgetsPromise = new Promise((resolve, reject) => {
    const twttr = (window as any).twttr
    if (twttr?.widgets) return resolve(twttr)

    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.onload = () => {
      const loaded = (window as any).twttr
      loaded?.widgets ? resolve(loaded) : reject(new Error('twttr.widgets is missing'))
    }
    script.onerror = () => reject(new Error('failed to load widgets.js'))
    document.head.appendChild(script)
  })

  widgetsPromise.catch(() => { widgetsPromise = null })

  return widgetsPromise
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

async function mount(): Promise<void> {
  state.value = 'loading'

  try {
    const twttr = await withTimeout(loadWidgets(), 8000)
    if (!container.value) return

    container.value.innerHTML = ''
    const rendered = await twttr.widgets.createTweet(props.id, container.value, {
      theme: isDark.value ? 'dark' : 'light',
      lang: locale.value.code,
      conversation: 'none',
      align: 'center',
      dnt: true,
    })

    // createTweet resolves with undefined when the tweet is gone or blocked
    if (!rendered) throw new Error('tweet was not rendered')
    state.value = 'ready'
  } catch {
    state.value = 'failed'
  }
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  // No IntersectionObserver — just load right away
  if (!('IntersectionObserver' in window)) {
    void mount()
    return
  }

  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    observer?.disconnect()
    observer = null
    void mount()
  }, { rootMargin: '400px 0px' })

  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

// The embed picks its theme at render time, so a theme switch needs a remount
watch(isDark, () => {
  if (state.value === 'ready') void mount()
})
</script>

<template>
  <div ref="root" class="tweet-embed">
    <button
      v-if="state === 'failed'"
      type="button"
      class="tweet-placeholder"
      :aria-label="`${locale.tweetLoadLabel} @${user}`"
      @click="mount"
    >
      <span class="tweet-overlay">
        <span class="tweet-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" />
          </svg>
        </span>

        <span class="tweet-text">
          <span class="tweet-title">
            {{ locale.tweetLoadLabel }}
            <span class="tweet-handle">@{{ user }}</span>
          </span>
          <span class="tweet-hint">{{ locale.tweetFailedLabel }}</span>
        </span>
      </span>
    </button>

    <div v-else-if="state !== 'ready'" class="tweet-placeholder is-loading">
      <img v-if="poster" class="tweet-poster" :src="poster" alt="" />

      <span class="tweet-overlay">
        <span class="tweet-spinner" aria-hidden="true" />

        <span class="tweet-text">
          <span class="tweet-title">
            {{ locale.tweetLoadingLabel }}
            <span class="tweet-handle">@{{ user }}</span>
          </span>
          <span class="tweet-hint">{{ caption || locale.tweetHint }}</span>
        </span>
      </span>
    </div>

    <div ref="container" class="tweet-slot" />

    <a
      v-if="state !== 'ready'"
      class="tweet-fallback"
      :href="tweetUrl"
      target="_blank"
      rel="noopener"
    >{{ locale.tweetOpenLabel }} ↗</a>
  </div>
</template>

<style scoped>
.tweet-embed {
  margin: 24px 0;
}

.tweet-placeholder {
  position: relative;
  display: block;
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-align: left;
}

button.tweet-placeholder {
  cursor: pointer;
  transition: border-color 0.25s, background-color 0.25s;
}

button.tweet-placeholder:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
}

.tweet-poster {
  display: block;
  width: 100%;
  height: auto;
  opacity: 0.55;
}

.tweet-overlay {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
}

.tweet-poster + .tweet-overlay {
  position: absolute;
  inset: auto 0 0 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  color: #fff;
}

.tweet-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.tweet-spinner {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 8px;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: tweet-spin 0.8s linear infinite;
}

.tweet-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tweet-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: inherit;
}

.tweet-handle {
  font-weight: 400;
  opacity: 0.7;
}

.tweet-hint {
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.7;
}

.tweet-fallback {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  text-align: center;
  color: var(--vp-c-text-2);
}

.tweet-fallback:hover {
  color: var(--vp-c-brand-1);
}

.tweet-slot :deep(twitter-widget) {
  margin: 0 auto !important;
}

@keyframes tweet-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .tweet-spinner {
    animation-duration: 2.4s;
  }
}

@media (max-width: 640px) {
  .tweet-overlay {
    padding: 14px 16px;
    gap: 12px;
  }

  .tweet-icon {
    width: 34px;
    height: 34px;
  }
}
</style>
