<script setup lang="ts">
import { data as jbPlugin } from './jetbrains-plugin.data'

const pluginUrl = `https://plugins.jetbrains.com/plugin/${jbPlugin.pluginId}`

const formatDownloads = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>

<template>
  <a :href="pluginUrl" target="_blank" rel="noopener" class="jb-plugin-card">
    <span class="jb-plugin-card-gradient"></span>
    <span class="jb-plugin-card-body">
      <span class="jb-plugin-card-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
          <rect width="24" height="24" rx="4" fill="#000"/>
          <rect x="4" y="17" width="8" height="2" fill="#fff"/>
          <text x="4" y="14" font-size="10" font-weight="700" font-family="system-ui, sans-serif" fill="#fff">PS</text>
        </svg>
      </span>
      <span class="jb-plugin-card-content">
        <span class="jb-plugin-card-title">Testo for PhpStorm</span>
        <span class="jb-plugin-card-meta">
          JetBrains Marketplace
          <span v-if="jbPlugin.rating" class="jb-plugin-card-rating">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {{ jbPlugin.rating.toFixed(1) }}
          </span>
          <span v-if="jbPlugin.downloads" class="jb-plugin-card-downloads">
            {{ formatDownloads(jbPlugin.downloads) }} downloads
          </span>
        </span>
      </span>
      <span class="jb-plugin-card-arrow">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </span>
    </span>
  </a>
</template>

<style scoped>
.jb-plugin-card {
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

.jb-plugin-card:hover {
  border-color: var(--vp-c-divider);
  box-shadow: 0 8px 24px rgba(255, 49, 140, 0.1), 0 4px 12px rgba(254, 121, 64, 0.08);
  transform: translateY(-2px);
}

.jb-plugin-card-gradient {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #ff318c, #fe7940, #f5df36);
}

.jb-plugin-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px 16px 24px;
}

.jb-plugin-card-icon {
  flex-shrink: 0;
  display: flex;
}

.jb-plugin-card-content {
  flex: 1;
  min-width: 0;
}

.jb-plugin-card-title {
  display: block;
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.jb-plugin-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
}

.jb-plugin-card-rating,
.jb-plugin-card-downloads {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.jb-plugin-card-rating svg {
  color: #f5a623;
}

.jb-plugin-card-arrow {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease;
}

.jb-plugin-card:hover .jb-plugin-card-arrow {
  color: var(--vp-c-brand-1);
}
</style>
