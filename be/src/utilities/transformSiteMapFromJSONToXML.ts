import SiteMapSets from "../types/siteMapSets";
import vars from "../vars";

export const sigmoid = (value: number): number => {
    if (!Number.isFinite(value)) return 0.5;
    const p = 1 / (1 + Math.exp(-value));
    return Math.min(1, Math.max(0, p));
};

const xmlEscape = (s: string): string =>
    s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const formatLastMod = (lastmod?: string): string => {
    if (!lastmod || lastmod === "unknown") return "";
    const date = new Date(lastmod);
    if (isNaN(date.getTime())) return "";
    return `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`; // YYYY-MM-DD
};

const buildUrlXML = (loc: string, lastmod?: string, changefreq = "monthly", priority = 0.5) =>
    `<url>
    <loc>${xmlEscape(loc)}</loc>
    ${formatLastMod(lastmod)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
</url>`;

const buildCardXML = (card: { id: string; service_boost: number; last_modified: string }) => {
    const loc = `${vars.serverSetups.origin}/?p=card&c=${encodeURIComponent(card.id)}`;
    return buildUrlXML(loc, card.last_modified, "monthly", sigmoid(card.service_boost));
};

const buildResponseXML = (response: { id: string; name: string; last_modified?: string }) => {
    const loc = `${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(response.name || response.id)}&brf=${encodeURIComponent(response.id)}`;
    return buildUrlXML(loc, response.last_modified, "monthly", 0.5);
};

const buildSituationXML = (situation: { id: string; name: string; last_modified?: string }) => {
    const loc = `${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(situation.name || situation.id)}&bsf=${encodeURIComponent(situation.id)}`;
    return buildUrlXML(loc, situation.last_modified, "monthly", 0.5);
};

const transformSiteMapFromJSONToXML = (sitemap: SiteMapSets): string => {
    const { cards, responses, situations } = sitemap;
    const xmlDecl = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlStart = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    const homeUrl = buildUrlXML(`${vars.serverSetups.origin}/`, undefined, "never", 1.0);


    const urls = [
        homeUrl,
        ...cards.map(buildCardXML),
        ...responses.map(buildResponseXML),
        ...situations.map(buildSituationXML),
    ].join("\n");

    const xmlEnd = `</urlset>`;
    return `${xmlDecl}\n${xmlStart}\n${urls}\n${xmlEnd}`;
};

export default transformSiteMapFromJSONToXML;
