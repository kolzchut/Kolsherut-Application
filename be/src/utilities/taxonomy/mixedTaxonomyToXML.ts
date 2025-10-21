import escapeXML from "../escapeXML";
import vars from "../../vars";
import mixedTaxonomyBlackListRaw from "../../assets/mixedTaxonomyBlackList.json";
import encodeForURL from "../encodeForURL";

interface FixedTaxonomy {
    slug: string;
    query: string;
}

const mixedTaxonomyBlackList: Record<string, string[]> = mixedTaxonomyBlackListRaw;

const buildLoc = ({response,situation}:{response: FixedTaxonomy,situation: FixedTaxonomy}): string => {
    return `${vars.serverSetups.origin}/p/results/sq/${encodeForURL(response.query+ " "+situation.query)}/bsf/${encodeForURL(situation.slug)}/brf/${encodeForURL(response.slug)}`;
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
