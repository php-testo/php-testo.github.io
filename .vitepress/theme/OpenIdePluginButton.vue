<script setup lang="ts">
const props = defineProps<{
  url: string
}>()
</script>

<template>
  <a :href="props.url" target="_blank" rel="noopener" class="openide-plugin-button">
    <span class="openide-plugin-label">
      Testo for
      <img src="/images/openide-wordmark-white.svg" alt="OpenIDE" class="openide-plugin-logo" />
    </span>
  </a>
</template>

<style scoped>
.openide-plugin-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  /* Mesh gradient after the OpenIDE app icon: navy, violet, coral, a pale corner. */
  background:
    radial-gradient(70% 140% at 0% 0%, #17167a 0%, rgba(23, 22, 122, 0) 70%),
    radial-gradient(55% 130% at 100% 0%, #a28af4 0%, rgba(162, 138, 244, 0) 75%),
    radial-gradient(55% 120% at 45% 120%, #e8524f 0%, rgba(232, 82, 79, 0) 75%),
    radial-gradient(18% 80% at 100% 100%, #fbe4e0 0%, rgba(251, 228, 224, 0) 85%),
    #7a63cc;
  border-radius: 8px;
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(77, 64, 155, 0.35);
}

.openide-plugin-button:hover {
  transform: translateY(-2px);
  color: #fff;
  box-shadow: 0 4px 16px rgba(240, 100, 98, 0.4);
}

.openide-plugin-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.openide-plugin-logo {
  height: 16px;
  width: auto;
}
</style>
