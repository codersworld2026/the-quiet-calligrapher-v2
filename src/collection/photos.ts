// The addresses visitors load Aliya's photos from. On Vercel they come through its image service (set up in
// astro.config.mjs), which resizes them to the width asked for, picks AVIF or WebP for the browser, and serves them
// from the site's own address. Locally there's no image service, so the store's address is used as it is.
const widths = [400, 800, 1200, 1600, 2000];

export function photoSrc(url: string, width: number) {
  return import.meta.env.PROD ? `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=80` : url;
}

// The widths up to the photo's own, so a small photo isn't asked for at sizes it doesn't have.
export function photoSrcset(url: string, photoWidth: number) {
  const fitting = widths.filter((width) => width <= photoWidth);
  const usable = fitting.length ? fitting : [widths[0]];
  return usable.map((width) => `${photoSrc(url, width)} ${width}w`).join(', ');
}
