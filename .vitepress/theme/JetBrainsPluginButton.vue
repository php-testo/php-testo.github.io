<script setup lang="ts">
const props = defineProps<{
  pluginId: string | number
  downloads?: number | null
  rating?: number | null
}>()

const pluginUrl = `https://plugins.jetbrains.com/plugin/${props.pluginId}`

const formatDownloads = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatRating = (num: number): string => {
  return num.toFixed(1)
}
</script>

<template>
  <a :href="pluginUrl" target="_blank" rel="noopener" class="jb-plugin-button">
    <span class="jb-plugin-label">Get Plugin</span>
    <span v-if="rating || downloads" class="jb-plugin-stats">
      <span v-if="rating" class="jb-plugin-rating">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {{ formatRating(rating) }}
      </span>
      <span v-if="downloads" class="jb-plugin-downloads visually-hidden">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        {{ formatDownloads(downloads) }}
      </span>
    </span>
  </a>
</template>

<style scoped>
.jb-plugin-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff318c 0%, #fe7940 50%, #f5df36 100%);
  border-radius: 8px;
  text-decoration: none;
  color: #000;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 49, 140, 0.3);
}

.jb-plugin-button:hover {
  transform: translateY(-2px);
  color: #000;
  box-shadow: 0 4px 16px rgba(255, 49, 140, 0.4);
}

.jb-plugin-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
}

.jb-plugin-rating,
.jb-plugin-downloads {
  display: flex;
  align-items: center;
  gap: 3px;
}
</style>
