import vars from "../vars";
import escapeXML from "./escapeXML";
import { ServiceFields } from "../services/db/es/getServices";

const buildServiceUrlXML = (service: ServiceFields) => {
    const loc = `${vars.serverSetups.canonicalOrigin}/bsnf-${encodeURI(service.service_name)}`;
    return `<url>
    <loc>${escapeXML(loc)}</loc>
</url>`;
};

const transformServicesSitemapToXML = (services: ServiceFields[]): string => {
    const xmlDecl = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlStart = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const urls = services
        .filter(s => s.service_name)
        .map(buildServiceUrlXML)
        .join("\n");

    const xmlEnd = `</urlset>`;
    return `${xmlDecl}\n${xmlStart}\n${urls}\n${xmlEnd}`;
};

export default transformServicesSitemapToXML;
