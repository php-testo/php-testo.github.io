<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="blog-post-header" v-if="frontmatter.image || frontmatter.date || frontmatter.author">
    <img
      v-if="frontmatter.image"
      :src="frontmatter.image"
      :alt="frontmatter.title"
      class="post-hero-image"
    />
    <div class="post-meta" v-if="frontmatter.date || frontmatter.author">
      <span v-if="frontmatter.date" class="post-date">{{ formatDate(frontmatter.date) }}</span>
      <span v-if="frontmatter.author" class="post-author">{{ frontmatter.author }}</span>
    </div>
  </div>
</template>

<style scoped>
.blog-post-header {
  margin-bottom: 1.5rem;
}

.post-hero-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.post-meta {
  display: flex;
  gap: 1rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
</style>
