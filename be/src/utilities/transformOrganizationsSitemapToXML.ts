import vars from "../vars";
import escapeXML from "./escapeXML";
import { OrganizationFields } from "../services/db/es/getOrganizations";

const buildOrganizationUrlXML = (org: OrganizationFields) => {
    const name = org.organization_short_name || org.organization_name;
    const loc = `${vars.serverSetups.canonicalOrigin}/by-${encodeURI(name)}`;
    return `<url>
    <loc>${escapeXML(loc)}</loc>
</url>`;
};

const transformOrganizationsSitemapToXML = (organizations: OrganizationFields[]): string => {
    const xmlDecl = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlStart = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const urls = organizations
        .filter(org => org.organization_short_name || org.organization_name)
        .map(buildOrganizationUrlXML)
        .join("\n");

    const xmlEnd = `</urlset>`;
    return `${xmlDecl}\n${xmlStart}\n${urls}\n${xmlEnd}`;
};

export default transformOrganizationsSitemapToXML;
