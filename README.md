# Testo Documentation

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
docs/
├── .vitepress/
│   └── config.mts       # VitePress configuration
├── pages/
│   ├── en/              # Landing page (English)  -> /
│   └── ru/              # Landing page (Russian)  -> /ru/
├── docs/
│   ├── en/              # Documentation (English)
│   └── ru/              # Documentation (Russian)
├── blog/
│   ├── en/              # Blog articles (English)
│   └── ru/              # Blog articles (Russian)
└── public/              # Static assets (logo, images)
```

## Adding Content

### New documentation page

1. Create `docs/en/my-page.md` and `docs/ru/my-page.md`
2. Add to sidebar in `.vitepress/config.mts`

### New blog post

1. Create `blog/en/my-post.md` and `blog/ru/my-post.md`
2. Add link to `blog/en/index.md` and `blog/ru/index.md`

## Deployment

```bash
npm run build
```

Output is in `.vitepress/dist/` - deploy to any static hosting.
