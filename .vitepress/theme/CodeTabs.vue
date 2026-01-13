<script setup lang="ts">
import { ref } from 'vue'
import { VPImage } from 'vitepress/theme'

interface Tab {
  name: string
  slot: string
  icon?: string
}

const props = defineProps<{
  tabs: Tab[]
}>()

const activeIndex = ref(0)

// Icon alias to light/dark paths mapping
const iconMap: Record<string, { light: string; dark: string }> = {
  'testo-class': {
    light: '/icon/light-testo-class.svg',
    dark: '/icon/dark-testo-class.svg',
  },
  'testo-function': {
    light: '/icon/light-testo-function.svg',
    dark: '/icon/dark-testo-function.svg',
  },
  'testo-php': {
    light: '/icon/light-testo-php.svg',
    dark: '/icon/dark-testo-php.svg',
  },
  'testo': {
    light: '/icon/light-khinkali-bordered.svg',
    dark: '/icon/dark-khinkali-bordered.svg',
  },
  'class': {
    light: '/icon/light-class.svg',
    dark: '/icon/dark-class.svg',
  },
}

const getIcon = (tab: Tab) => {
  const alias = tab.icon || 'testo'
  return iconMap[alias]
}
</script>

<template>
  <div class="code-tabs-ide">
    <!-- Tabs Bar -->
    <div class="ide-tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        class="ide-tab"
        :class="{ active: activeIndex === index }"
        @click="activeIndex = index"
      >
        <span class="tab-icon">
          <VPImage :image="getIcon(tab)" />
        </span>
        <span class="tab-name">{{ tab.name }}</span>
      </button>
    </div>

    <!-- Code Content via slots -->
    <div class="ide-content">
      <template v-for="(tab, index) in tabs" :key="tab.slot">
        <div v-show="activeIndex === index" class="code-slot">
          <slot :name="tab.slot"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.code-tabs-ide {
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  margin: 24px 0;
}

/* Tabs */
.ide-tabs {
  display: flex;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-x: auto;
  border-radius: 12px 12px 0 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.ide-tabs::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.ide-tab:first-child {
  border-radius: 12px 0 0 0;
}

.ide-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-size: 13px;
  font-family: var(--vp-font-family-base);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ide-tab:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
}

.ide-tab.active {
  background: var(--vp-code-block-bg);
  color: var(--vp-c-text-1);
  box-shadow: inset 0 -2px 0 var(--vp-c-brand-1);
}

.tab-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon :deep(img) {
  width: 16px;
  height: 16px;
  max-width: 16px;
  max-height: 16px;
  object-fit: contain;
}

/* Content - reset VitePress code block styles */
.ide-content {
  position: relative;
}

.code-slot {
  width: 100%;
}

/* Override VitePress code block styles inside our component */
.code-slot :deep(div[class*="language-"]) {
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.code-slot :deep(.vp-code-group) {
  margin: 0 !important;
  border-radius: 0 !important;
}

.code-slot :deep(div[class*="language-"]:hover) {
  transform: none !important;
  box-shadow: none !important;
}

/* Hide the language label */
.code-slot :deep(span.lang) {
  display: none;
}

/* Hide copy button or style it */
.code-slot :deep(button.copy) {
  top: 8px;
  right: 8px;
}

/* Responsive */
@media (max-width: 640px) {
  .ide-tab {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
