import vars from "../../vars";
import Taxonomy from "../../types/taxonomy";
import escapeXML from "../escapeXML";
import encodeForURL from "../encodeForURL";


interface RecursiveTaxonomyToXMLParams {
    taxonomy: Taxonomy[];
    recursive?: number;
    isResponse: boolean;
}

const transformSituationSlugToURL = ({slug,query}:{slug: string, query:string}) :string=> `${vars.serverSetups.origin}/p/results/sq/${encodeForURL(query)}/bsf/${encodeForURL(slug)}`
const transformResponseSlugToURL = ({slug,query}:{slug: string, query:string}) :string=> `${vars.serverSetups.origin}/p/results/sq/${encodeForURL(query)}/brf/${encodeForURL(slug)}`


const transformSlugToURL = ({slug, query, isResponse}:{slug: string, query:string, isResponse: boolean}): string => {
    return isResponse ? transformResponseSlugToURL({slug,query}) : transformSituationSlugToURL({slug,query});
}



const recursiveTaxonomyToXML = ({taxonomy, recursive = 0, isResponse}: RecursiveTaxonomyToXMLParams): string => {
    let xml = '';
    taxonomy.forEach(item => {
        xml += `<url>\n`;
        xml += `<loc>${escapeXML(transformSlugToURL({slug: item.slug, query: item.name.tx.he, isResponse}))}</loc>\n`;
        xml += `</url>\n`;

        if (item.items && item.items.length > 0) {
            xml += recursiveTaxonomyToXML({
                taxonomy: item.items,
                recursive: recursive + 1,
                isResponse
            });
        }
    });
    return xml;
}

export default recursiveTaxonomyToXML;
