<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from './posts.data'

const props = defineProps<{
  folder: string
}>()

const filteredPosts = computed(() => {
  return posts.filter((post) => post.url.startsWith(props.folder))
})
</script>

<template>
  <ul class="blog-posts">
    <li v-for="post in filteredPosts" :key="post.url">
      <div class="post-header">
        <a :href="post.url">{{ post.title }}</a>
      </div>
      <p class="post-description">{{ post.description }}</p>
      <div class="timestamp">{{ post.date }}</div>
    </li>
  </ul>
</template>

<style scoped>
.blog-posts {
  list-style: none;
  padding: 0;
}

.blog-posts .post-header a {
  text-decoration: none !important;
}

.blog-posts li {
  margin: 1.5em 0;
}

.blog-posts .timestamp {
  margin-right: 0.5em;
  color: var(--vp-c-text-2);
  font-size: 0.8em;
}

.post-description {
  margin: 0.25em 0 0 0;
  color: var(--vp-c-text-1);
  font-size: 0.9em;
}
</style>
