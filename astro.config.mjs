// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // The address search engines and link previews are given (the bare domain redirects here), and /sitemap-index.xml
  // lists every page. Pages are addressed without a trailing slash, as vercel.json redirects them.
  site: 'https://www.thequietcalligrapher.com',
  trailingSlash: 'never',
  integrations: [sitemap()],
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
  // `astro dev` doesn't apply it: check changes with `astro build` and `astro preview`. A <meta> policy can't stop other
  // sites framing the page, so vercel.json does that.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://api.web3forms.com https://hcaptcha.com https://*.hcaptcha.com",
        'frame-src https://hcaptcha.com https://*.hcaptcha.com',
        'form-action https://api.web3forms.com',
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
