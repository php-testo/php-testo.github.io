<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()
const isBlog = () => route.path.includes('/blog/')
</script>

<template>
  <div v-if="isBlog()" class="blog-sponsor">
    <div class="sponsor-box">
      <span class="sponsor-icon">❤️</span>
      <div class="sponsor-content">
        <p>
          <template v-if="route.path.startsWith('/ru/')">
            Вы можете стать спонсором <a href="https://github.com/php-testo" target="_blank">Testo</a>
            или поддержать автора на <a href="https://boosty.to/roxblnfk" target="_blank">boosty.to/roxblnfk</a>
          </template>
          <template v-else>
            You can become a sponsor of <a href="https://github.com/php-testo" target="_blank">Testo</a>
            or support the author at <a href="https://boosty.to/roxblnfk" target="_blank">boosty.to/roxblnfk</a>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-sponsor {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.sponsor-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.sponsor-icon {
  font-size: 1.25rem;
  line-height: 1.5;
}

.sponsor-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.sponsor-content a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.sponsor-content a:hover {
  text-decoration: underline;
}
</style>
