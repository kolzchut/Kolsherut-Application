import vars from "../../vars";
import Taxonomy from "../../types/taxonomy";
import escapeXML from "../escapeXML";


interface RecursiveTaxonomyToXMLParams {
    taxonomy: Taxonomy[];
    recursive?: number;
}

const extractSubSlug = (slug: string): string => slug.split(':').slice(-1)[0];

const transformSlugToURL = (slug: string): string => {
    return `${vars.serverSetups.canonicalOrigin}/${encodeURI(extractSubSlug(slug))}`;
}


const recursiveTaxonomyToXML = ({taxonomy, recursive = 0}: RecursiveTaxonomyToXMLParams): string => {
    let xml = '';
    taxonomy.forEach(item => {
        xml += `<url>\n`;
        xml += `<loc>${escapeXML(transformSlugToURL(item.slug))}</loc>\n`;
        xml += `</url>\n`;

        if (item.items && item.items.length > 0) {
            xml += recursiveTaxonomyToXML({
                taxonomy: item.items,
                recursive: recursive + 1,
            });
        }
    });
    return xml;
}

export default recursiveTaxonomyToXML;
