import vars from "../vars";
import escapeXML from "./escapeXML";

export const sigmoid = (value: number): number => {
    if (!Number.isFinite(value)) return 0.5;
    const p = 1 / (1 + Math.exp(-value));
    return Math.min(1, Math.max(0, p));
};

const formatLastMod = (lastmod?: string): string => {
    if (!lastmod || lastmod === "unknown") return "";
    const date = new Date(lastmod);
    if (isNaN(date.getTime())) return "";
    return `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`; // YYYY-MM-DD
};

const buildUrlXML = (loc: string, lastmod?: string, changefreq = "monthly", priority = 0.5) =>
    `<url>
    <loc>${escapeXML(loc)}</loc>
    ${formatLastMod(lastmod)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
</url>`;

const buildCardXML = (card: { card_id: string; service_boost: number; last_modified: string }) => {
    const loc = `${vars.serverSetups.origin}/?p=card&c=${encodeURIComponent(card.card_id)}`;
    return buildUrlXML(loc, card.last_modified, "monthly", sigmoid(card.service_boost));
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
