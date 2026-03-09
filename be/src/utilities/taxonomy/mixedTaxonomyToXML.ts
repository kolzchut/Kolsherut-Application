import escapeXML from "../escapeXML";
import vars from "../../vars";
import mixedTaxonomyBlackListRaw from "../../assets/mixedTaxonomyBlackList.json";

interface FixedTaxonomy {
    slug: string;
    query: string;
}

const mixedTaxonomyBlackList: Record<string, string[]> = mixedTaxonomyBlackListRaw;

const extractSubSlug = (slug: string): string => slug.split(':').slice(-1)[0];

const buildLoc = ({response, situation}: {response: FixedTaxonomy, situation: FixedTaxonomy}): string => {
    const sitSubSlug = encodeURI(extractSubSlug(situation.slug));
    const respSubSlug = encodeURI(extractSubSlug(response.slug));
    return `${vars.serverSetups.origin}/${sitSubSlug}/${respSubSlug}`;
}

const mixedTaxonomyToXML = ({responses, situations}: {
    responses: FixedTaxonomy[],
    situations: FixedTaxonomy[]
}): string => {
    let xml = '';
    responses.forEach(response => {
        situations.forEach(situation => {
            if (mixedTaxonomyBlackList[response.slug]?.includes(situation.slug)) return;
            xml += `<url>\n`;
            xml += `<loc>${escapeXML(buildLoc({response,situation}))}</loc>\n`;
            xml += `</url>\n`;
        })

    });
    return xml;
}

export default mixedTaxonomyToXML
