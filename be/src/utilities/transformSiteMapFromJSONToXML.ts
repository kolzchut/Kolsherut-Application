import vars from "../vars";
import escapeXML from "./escapeXML";
import encodeForURL from "./encodeForURL";

const formatLastMod = (lastmod?: string): string => {
    if (!lastmod || lastmod === "unknown") return "";
    const date = new Date(lastmod);
    if (isNaN(date.getTime())) return "";
    return `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`; // YYYY-MM-DD
};

const buildUrlXML = (loc: string, lastmod?: string) =>
    `<url>
    <loc>${escapeXML(loc)}</loc>
    ${formatLastMod(lastmod)}
</url>`;

const buildCardXML = (card: { card_id: string; service_boost: number; last_modified: string }) => {
    const loc = `${vars.serverSetups.origin}/p/card/c/${encodeForURL(card.card_id)}`;
    return buildUrlXML(loc, card.last_modified);
};

const transformSiteMapFromJSONToXML = (cards: {
    card_id: string,
    service_boost: number,
    last_modified: string
}[]): string => {
    const xmlDecl = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlStart = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;


    const urls = [
        ...cards.map(buildCardXML),
    ].join("\n");

    const xmlEnd = `</urlset>`;
    return `${xmlDecl}\n${xmlStart}\n${urls}\n${xmlEnd}`;
};

export default transformSiteMapFromJSONToXML;
