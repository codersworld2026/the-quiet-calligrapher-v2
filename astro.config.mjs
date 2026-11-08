// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://www.thequietcalligrapher.com';

// https://astro.build/config
export default defineConfig({
  // The address search engines and link previews are given (the bare domain redirects here), and /sitemap-index.xml
  // lists every page. Pages are addressed without a trailing slash, as vercel.json redirects them.
  site,
  trailingSlash: 'never',
  // Every page is built ahead of time except The Collection's, which read Aliya's latest photos when they're visited
  // (each marks itself with `prerender = false`). Her photos live in Vercel Blob; visitors get them resized through
  // Vercel's image service at /_vercel/image, which may fetch only from the live store's photos folder.
  adapter: vercel({
    imagesConfig: {
      sizes: [400, 640, 800, 1200, 1600, 2000],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 31536000,
      remotePatterns: [
        { protocol: 'https', hostname: 'btqrui3ldfhfkbpr.public.blob.vercel-storage.com', pathname: '/collection/photos/**' }
      ]
    }
  }),
  // The Collection's settings, read when a page is visited rather than built into the code. The store's token comes
  // from Vercel's link to the Blob store; the others are set in the project's environment variables.
  env: {
    schema: {
      BLOB_READ_WRITE_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Signs sessions, and names the store's private folder.
      COLLECTION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      // The email address Aliya signs in with.
      COLLECTION_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Her password, scrambled with scrypt (see scripts/collection-password.mjs). The password itself is stored nowhere.
      COLLECTION_PASSWORD_HASH: envField.string({ context: 'server', access: 'secret', optional: true })
    }
  },
  // The Collection is listed for search engines; Aliya's sign-in page (/collection/admin) isn't.
  integrations: [
    sitemap({ customPages: [`${site}/collection`], filter: (page) => !page.startsWith(`${site}/collection/admin`) })
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant-garamond',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      fallbacks: ['serif']
    },
    {
      provider: fontProviders.google(),
      name: 'Jost',
      cssVariable: '--font-jost',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['sans-serif']
    }
  ],
  // The Content Security Policy, which Astro writes into each page as a <meta> tag with the hashes of its own inline
  // scripts and styles. Beyond those, the page may run only hCaptcha's code (the "I am human" box) and send enquiries
  // only to Web3Forms, so code slipped into the page couldn't load anything else or post visitors' details elsewhere.
  // Forms may also post to the site itself (The Collection's sign-in and Aliya's page), and images may be `blob:`
  // addresses, which her page uses to preview photos before they're uploaded.
  // `astro dev` doesn't apply it: check changes with `astro build` and `astro preview`. A <meta> policy can't stop other
  // sites framing the page, so vercel.json does that.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' blob:",
        "connect-src 'self' https://api.web3forms.com https://hcaptcha.com https://*.hcaptcha.com",
        'frame-src https://hcaptcha.com https://*.hcaptcha.com',
        "form-action 'self' https://api.web3forms.com",
        "base-uri 'self'",
        "object-src 'none'"
      ],
      scriptDirective: { resources: ["'self'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'] },
      styleDirective: { resources: ["'self'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'] }
    }
  },
  // The site has no code samples, and Shiki's inline styles would break the policy above.
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()]
  }
});
