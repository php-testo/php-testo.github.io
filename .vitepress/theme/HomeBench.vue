<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  codeTab?: string
  resultTab?: string
}>(), {
  codeTab: 'Code',
  resultTab: 'Result',
})

const activeTab = ref<'code' | 'result'>('code')
</script>

<template>
  <div class="bench-showcase">
    <div class="bench-description">
      <slot name="description" />
    </div>

    <div class="bench-tabs-wrap">
      <div class="bench-tabs">
        <button
          :class="{ active: activeTab === 'code' }"
          @click="activeTab = 'code'"
        >{{ codeTab }}</button>
        <button
          :class="{ active: activeTab === 'result' }"
          @click="activeTab = 'result'"
        >{{ resultTab }}</button>
      </div>
    </div>

    <div v-show="activeTab === 'code'" class="bench-code-panel">
      <div class="bench-code-split">
        <div class="bench-code-block">
          <slot name="left" />
        </div>
        <div class="bench-code-block">
          <slot name="right" />
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'result'" class="bench-result-panel">
      <slot name="result" />
    </div>
  </div>
</template>

<style scoped>
.bench-showcase {
  margin: 0 auto;
}

/* Description */
.bench-description {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 28px;
}

.bench-description :deep(p) {
  font-size: 17px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0;
}

.bench-description :deep(code) {
  background: var(--vp-c-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 15px;
  color: var(--vp-c-brand-1);
}

/* Tabs — segmented control */
.bench-tabs-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.bench-tabs {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.bench-tabs button {
  padding: 8px 24px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-family: var(--vp-font-family-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.bench-tabs button + button {
  border-left: 1px solid var(--vp-c-divider);
}

.bench-tabs button:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.bench-tabs button.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* Two separate code windows */
.bench-code-split {
  display: flex;
  gap: 16px;
}

.bench-code-block {
  flex: 1;
  min-width: 0;
}

.bench-code-block :deep(div[class*="language-"]) {
  margin: 0 !important;
}

.bench-code-block :deep(span.lang),
.bench-code-block :deep(button.copy) {
  display: none;
}

div.bench-code-panel {
  min-height: 255px;
}

/* Result — centered, minimal */

.bench-result-panel {
  min-height: 255px;
  padding-bottom: 20px;
  display: flex;
  justify-content: center;
}

.bench-result-panel :deep(div[class*="language-"]) {
  margin: 0 !important;
  box-shadow: none !important;
  border: 1px solid var(--vp-c-divider);
}

.bench-result-panel :deep(span.lang),
.bench-result-panel :deep(button.copy) {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .bench-code-split {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
