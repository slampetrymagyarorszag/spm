// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, PUBLIC_SITE_URL } = loadEnv(
  process.env.NODE_ENV || 'development',
  process.cwd(),
  ''
);

// A nyilvános, kanonikus oldal-URL. Élesben a saját domain; felülírható a
// PUBLIC_SITE_URL env változóval (pl. a Vercel preview-domainre).
const site = PUBLIC_SITE_URL || 'https://slampoetry.hu';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: '/admin',
      studioRouterHistory: 'hash',
    }),
    react(),
    // A beágyazott Studio (/admin) ne kerüljön a sitemapbe.
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],

  vite: { plugins: [tailwindcss()] },
  adapter: vercel(),
});