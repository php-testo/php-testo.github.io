<script setup lang="ts">
const pluginUrl = 'https://marketplace.openide.ru/plugin/testo/461/'
</script>

<template>
  <a :href="pluginUrl" target="_blank" rel="noopener" class="openide-plugin-card">
    <span class="openide-plugin-card-gradient"></span>
    <span class="openide-plugin-card-body">
      <span class="openide-plugin-card-icon">
        <img src="/images/openide-icon.svg" alt="OpenIDE" width="40" height="40" />
      </span>
      <span class="openide-plugin-card-content">
        <span class="openide-plugin-card-title">Testo for OpenIDE</span>
        <span class="openide-plugin-card-meta">OpenIDE Marketplace</span>
      </span>
      <span class="openide-plugin-card-arrow">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </span>
    </span>
  </a>
</template>

<style scoped>
.openide-plugin-card {
  display: block;
  position: relative;
  margin: 24px 0;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
}

.openide-plugin-card:hover {
  border-color: var(--vp-c-divider);
  box-shadow: 0 8px 24px rgba(77, 64, 155, 0.12), 0 4px 12px rgba(232, 82, 79, 0.08);
  transform: translateY(-2px);
}

.openide-plugin-card-gradient {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #17167a, #9b84e7, #e8524f);
}

.openide-plugin-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px 16px 24px;
}

.openide-plugin-card-icon {
  flex-shrink: 0;
  display: flex;
}

.openide-plugin-card-content {
  flex: 1;
  min-width: 0;
}

.openide-plugin-card-title {
  display: block;
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.openide-plugin-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
}



.openide-plugin-card-arrow {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.openide-plugin-card:hover .openide-plugin-card-arrow {
  color: var(--vp-c-brand-1);
}
</style>
