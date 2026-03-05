<script lang="ts" setup>
import { useWindowScroll } from '@vueuse/core'
import { onContentUpdated, useData, useRoute } from 'vitepress'
import { computed, inject, onMounted, ref } from 'vue'
import { useLocalNav } from 'vitepress/dist/client/theme-default/composables/local-nav'
import { getHeaders } from 'vitepress/dist/client/theme-default/composables/outline'
import { useSidebar } from 'vitepress/dist/client/theme-default/composables/sidebar'
import VPLocalNavOutlineDropdown from 'vitepress/dist/client/theme-default/components/VPLocalNavOutlineDropdown.vue'
import { localNavBackKey } from '../locales'

defineProps<{
  open: boolean
}>()

defineEmits<{
  (e: 'open-menu'): void
}>()

const { theme, frontmatter } = useData()
const route = useRoute()
const { hasSidebar } = useSidebar()
const { headers } = useLocalNav()
const { y } = useWindowScroll()

const navHeight = ref(0)

onMounted(() => {
  navHeight.value = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--vp-nav-height'
    )
  )
})

onContentUpdated(() => {
  headers.value = getHeaders(frontmatter.value.outline ?? theme.value.outline)
})

const empty = computed(() => {
  return headers.value.length === 0
})

const emptyAndNoSidebar = computed(() => {
  return empty.value && !hasSidebar.value
})

const classes = computed(() => {
  return {
    VPLocalNav: true,
    'has-sidebar': hasSidebar.value,
    empty: empty.value,
    fixed: emptyAndNoSidebar.value
  }
})

// Back navigation (provided by Layout)
const backLink = inject(localNavBackKey, null)
</script>

<template>
  <div
    v-if="frontmatter.layout !== 'home' && (!emptyAndNoSidebar || y >= navHeight)"
    :class="classes"
  >
    <div class="container">
      <button
        v-if="hasSidebar"
        class="menu"
        :aria-expanded="open"
        aria-controls="VPSidebarNav"
        @click="$emit('open-menu')"
      >
        <span class="vpi-align-left menu-icon"></span>
        <span class="menu-text">
          {{ theme.sidebarMenuLabel || 'Menu' }}
        </span>
      </button>

      <a
        v-if="backLink"
        :href="backLink.url"
        :title="backLink.label"
        class="back-link"
      >
        <span class="vpi-chevron-left back-link-icon" />
        <span class="back-link-text">{{ backLink.label }}</span>
      </a>

      <VPLocalNavOutlineDropdown :headers="headers" :navHeight="navHeight" />
    </div>
  </div>
</template>

<style scoped>
.VPLocalNav {
  position: sticky;
  top: 0;
  /*rtl:ignore*/
  left: 0;
  z-index: var(--vp-z-index-local-nav);
  border-bottom: 1px solid var(--vp-c-gutter);
  padding-top: var(--vp-layout-top-height, 0px);
  width: 100%;
  background-color: var(--vp-local-nav-bg-color);
}

.VPLocalNav.fixed {
  position: fixed;
}

@media (min-width: 960px) {
  .VPLocalNav {
    top: var(--vp-nav-height);
  }

  .VPLocalNav.has-sidebar {
    padding-left: var(--vp-sidebar-width);
  }

  .VPLocalNav.empty {
    display: none;
  }
}

@media (min-width: 1280px) {
  .VPLocalNav {
    display: none;
  }
}

@media (min-width: 1440px) {
  .VPLocalNav.has-sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
  }
}

.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu {
  display: flex;
  align-items: center;
  padding: 12px 24px 11px;
  line-height: 24px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}

.menu:hover {
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

@media (min-width: 768px) {
  .menu {
    padding: 0 32px;
  }
}

@media (min-width: 960px) {
  .menu {
    display: none;
  }
}

.menu-icon {
  margin-right: 8px;
  font-size: 14px;
}

.back-link {
  display: flex;
  align-items: center;
  padding: 12px 24px 11px;
  line-height: 24px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.5s;
}

.back-link:hover {
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.back-link-icon {
  margin-right: 4px;
  font-size: 14px;
}

@media (min-width: 768px) {
  .back-link {
    padding: 12px 32px 11px;
  }
}

@media (min-width: 960px) {
  .back-link {
    font-size: 14px;
  }

  .back-link-icon {
    font-size: 16px;
  }
}

.VPOutlineDropdown {
  padding: 12px 24px 11px;
}

@media (min-width: 768px) {
  .VPOutlineDropdown {
    padding: 12px 32px 11px;
  }
}

.VPLocalNav:not(.has-sidebar) :deep(.items) {
  left: auto;
  right: 16px;
  width: 320px;
}

@media (min-width: 960px) {
  .VPLocalNav:not(.has-sidebar) :deep(.items) {
    right: 32px;
  }
}
</style>
