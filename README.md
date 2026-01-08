<p align="center">
    <a href="#get-started"><img alt="TESTO"
         src="https://github.com/php-testo/.github/blob/1.x/resources/logo-full.svg?raw=true"
         style="width: 2in; display: block"
    /></a>
</p>

<p align="center">
    <a href="https://php-testo.github.io">
        <img src="https://img.shields.io/badge/Documentation-Live-blue?style=for-the-badge&logo=gitbook&logoColor=white" alt="Documentation">
    </a>
</p>

Documentation site for [Testo](https://github.com/php-testo/testo) - Modern PHP Testing Framework.

Built with [VitePress](https://vitepress.dev/).

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Dev server runs at `http://localhost:5173/`

## Project Structure

```
/
├── .vitepress/
│   └── config.mts       # VitePress configuration
├── docs/                # Documentation (English)
├── blog/                # Blog articles (English)
├── ru/
│   ├── docs/            # Documentation (Russian)
│   └── blog/            # Blog articles (Russian)
├── index.md             # Landing page (English)
├── ru/index.md          # Landing page (Russian)
└── public/              # Static assets (logo, images)
```

## Adding Content

### New documentation page

1. Create `docs/my-page.md` and `ru/docs/my-page.md`
2. Add to sidebar in `.vitepress/config.mts`

### New blog post

1. Create `blog/my-post.md` and `ru/blog/my-post.md`
2. Add link to `blog/index.md` and `ru/blog/index.md`

## Deployment

```bash
npm run build
```

Output is in `.vitepress/dist/` - deploy to any static hosting.
