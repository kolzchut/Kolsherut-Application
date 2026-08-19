// Static content pages that live at their own URL and are prerendered by the SSG crawler.
// The redux `page` key is intentionally identical to the URL slug, so urlSelector's
// `if (page != 'home') params.p = page` and setRouteParams work without special casing.
// NOTE: keep this list in sync with scripts/generateStaticPagesSitemap.cjs.
export const staticPageSlugs = ['about', 'missing', 'partners', 'contact'] as const;

export type StaticPageSlug = typeof staticPageSlugs[number];

export const isStaticPageSlug = (value?: string): value is StaticPageSlug =>
    !!value && (staticPageSlugs as readonly string[]).includes(value);
