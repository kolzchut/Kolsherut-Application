import escapeXML from "../escapeXML";
import vars from "../../vars";

interface FixedTaxonomy {
    slug: string;
    query: string;
}

const buildLoc = ({response,situation}:{response: FixedTaxonomy,situation: FixedTaxonomy}): string => {
    return `${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(response.query+ " "+situation.query)}&bsf=${encodeURIComponent(situation.slug)}&brf=${encodeURIComponent(response.slug)}`;
}

const mixedTaxonomyToXML = ({responses, situations}: {
    responses: FixedTaxonomy[],
    situations: FixedTaxonomy[]
}): string => {
    let xml = '';
    responses.forEach(response => {
        situations.forEach(situation => {
            xml += `<url>\n`;
            xml += `<loc>${escapeXML(buildLoc({response,situation}))}</loc>\n`;
            xml += `<priority>0.4</priority>\n`;
            xml += `<changefreq>monthly</changefreq>\n`;
            xml += `</url>\n`;
        })

    });
    return xml;
}

export default mixedTaxonomyToXML
