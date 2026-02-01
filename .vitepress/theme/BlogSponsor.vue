<script setup>
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { lang } = useData()
const isBlog = () => route.path.includes('/blog/')
</script>

<template>
  <div v-if="isBlog()" class="blog-sponsor">
    <div class="sponsor-box">
      <span class="sponsor-icon">❤️</span>
      <div class="sponsor-content">
        <p>
          <template v-if="lang === 'ru'">
            Хотите поддержать проект? <a href="/ru/sponsor">Станьте спонсором</a> или <a href="https://github.com/php-testo/testo" target="_blank">поставьте звёздочку</a>.
          </template>
          <template v-else-if="lang === 'es'">
            ¿Quieres apoyar el proyecto? <a href="/es/sponsor">Conviértete en patrocinador</a> o <a href="https://github.com/php-testo/testo" target="_blank">danos una estrella</a>.
          </template>
          <template v-else-if="lang === 'zh' || lang === 'zh-CN'">
            想支持这个项目吗？<a href="/zh/sponsor">成为赞助商</a>或<a href="https://github.com/php-testo/testo" target="_blank">给我们一个星标</a>。
          </template>
          <template v-else-if="lang === 'de'">
            Möchten Sie das Projekt unterstützen? <a href="/de/sponsor">Werden Sie Sponsor</a> oder <a href="https://github.com/php-testo/testo" target="_blank">geben Sie uns einen Stern</a>.
          </template>
          <template v-else-if="lang === 'fr'">
            Vous voulez soutenir le projet ? <a href="/fr/sponsor">Devenez sponsor</a> ou <a href="https://github.com/php-testo/testo" target="_blank">donnez-nous une étoile</a>.
          </template>
          <template v-else-if="lang === 'pt'">
            Quer apoiar o projeto? <a href="/pt/sponsor">Torne-se um patrocinador</a> ou <a href="https://github.com/php-testo/testo" target="_blank">dê-nos uma estrela</a>.
          </template>
          <template v-else-if="lang === 'ja'">
            プロジェクトを支援しませんか？<a href="/ja/sponsor">スポンサーになる</a>か<a href="https://github.com/php-testo/testo" target="_blank">スターを付けてください</a>。
          </template>
          <template v-else-if="lang === 'ko'">
            프로젝트를 지원하시겠습니까? <a href="/ko/sponsor">스폰서가 되세요</a> 또는 <a href="https://github.com/php-testo/testo" target="_blank">별을 눌러주세요</a>.
          </template>
          <template v-else>
            Want to support the project? <a href="/sponsor">Become a sponsor</a> or <a href="https://github.com/php-testo/testo" target="_blank">give us a star</a>.
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
