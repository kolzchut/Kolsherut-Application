import {buildUrl} from "../../services/url/route";
import {StaticPageSlug} from "../../services/url/staticPages";

// metaTags.json is fetched at runtime and can lag behind a deploy, while MetaTags maps over
// properties/names unguarded - so a missing entry must yield null rather than throw.
const getStaticPageMetaTags = (slug: StaticPageSlug) => {
    const metaTags = window.metaTags?.[slug];
    if (!metaTags?.properties || !metaTags?.names) return null;
    return {metaTags, macrosAndReplacements: {}, pageUrl: buildUrl({p: slug})};
};

export default getStaticPageMetaTags;
