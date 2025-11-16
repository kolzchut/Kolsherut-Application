import vars from "../vars";
import escapeXML from "./escapeXML";

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

const minimumDate = ({minimum, compareTo}: {minimum: string; compareTo: string}): string => {
    const minDate = new Date(minimum);
    const compDate = new Date(compareTo);
    return isNaN(minDate.getTime()) ? compareTo : isNaN(compDate.getTime()) ? minimum : (minDate > compDate ? minimum : compareTo);
}

const buildCardXML = (card: { card_id: string; service_boost: number; last_modified: string }) => {
    const loc = `${vars.serverSetups.origin}/p/card/c/${encodeURI(card.card_id)}`;
    const date = minimumDate({minimum: vars.sitemap.minimumLastModifiedForCards, compareTo: card.last_modified});
    return buildUrlXML(loc,date);
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
