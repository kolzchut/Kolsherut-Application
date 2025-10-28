import situationsSynonyms from "../../assets/synonyms/Situations-synonyms.json";
import responsesSynonyms from "../../assets/synonyms/Responses-synonyms.json";

type Synonyms ={
    id: string;
    synonyms: string[];
    name:string;
}

const getResultsMetaTags = ({searchQuery, locationFilter, backendFilters}:{searchQuery:string, locationFilter:string, backendFilters:{response:string | null,situation:string | null, by:string}}) =>{


    const metaTags = window.metaTags.results
    const situationSynonyms:Synonyms | undefined = situationsSynonyms.find((synonymsObj:Synonyms) => synonymsObj.id === backendFilters.situation);
    const responseSynonyms:Synonyms | undefined = responsesSynonyms.find((synonymsObj:Synonyms) => synonymsObj.id === backendFilters.response);
    let response = "";
    let situation = "";
    let by = "";
    let location = "";
    if(situationSynonyms) situation = "עבור " +situationSynonyms.name +" " +situationSynonyms.synonyms.join(', ') +" ";
    if (responseSynonyms) response = "המענים " +responseSynonyms.name +" " +responseSynonyms.synonyms.join(', ') +" ";
    if(backendFilters.by) by = "של " +backendFilters.by +" ";
    if(locationFilter) location = "ב" +locationFilter +" ";

    const search = searchQuery.replace(/_/g, " ").trim();
    const macrosAndReplacements: { [key: string]: string } = {
        "%%search%%":search,
        "%%currentUrl%%": window.location.href,
        "%%situations%%": situation,
        "%%responses%%": response,
        "%%by%%": by,
        "%%location%%": location
    };
    return {metaTags, macrosAndReplacements}
}

export default getResultsMetaTags;
