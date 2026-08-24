import situationsSynonyms from "../../assets/synonyms/Situations-synonyms.json";
import responsesSynonymsRaw from "../../assets/synonyms/Responses-synonyms.json";
import israelLocation from "../../constants/israelLocation.ts";

type Synonyms = {
    id: string;
    synonyms: string[];
    name: string;
}

const responsesSynonyms = responsesSynonymsRaw as Synonyms[];

const getResultsMetaTags = ({searchQuery, locationFilter, backendFilters, pageUrl, }: {
    searchQuery: string,
    locationFilter: string,
    backendFilters: { response: string | null, situation: string | null, by: string, serviceName: string },
    pageUrl: string,
}) => {


    const metaTags = window.metaTags.results
    const situationSynonyms: Synonyms | undefined = situationsSynonyms.find((synonymsObj: Synonyms) => synonymsObj.id === backendFilters.situation);
    const responseSynonyms: Synonyms | undefined = responsesSynonyms.find((synonymsObj: Synonyms) => synonymsObj.id === backendFilters.response);
    let response = "";
    let situation = "";
    let by = "";
    let serviceName = "";
    let location = "";
    if (situationSynonyms) situation = "עבור " + situationSynonyms.name + " " + situationSynonyms.synonyms.join(', ') + " ";
    if (responseSynonyms) response = "המענים " + responseSynonyms.name + " " + responseSynonyms.synonyms.join(', ') + " ";
    if (backendFilters.by) by = "של " + backendFilters.by + " ";
    if (backendFilters.serviceName) serviceName = "של " + backendFilters.serviceName + " ";
    if (locationFilter) location = "ב" + locationFilter + " ";
    const taxonomyAlternative = [response, response ? situation : situationSynonyms?.name].filter(Boolean).join(" ").trim();
    const byAlternative = taxonomyAlternative.length ? by : backendFilters.by ?? "";
    const serviceNameAlternative = taxonomyAlternative.length || byAlternative.length ? serviceName : backendFilters.serviceName ?? "";
    const locationText = taxonomyAlternative.length || byAlternative.length || serviceNameAlternative.length ? location : locationFilter;
    const locationAlternative = locationFilter !== israelLocation.key ? locationText:"";
    const searchAlternative = [taxonomyAlternative, byAlternative, serviceNameAlternative, locationAlternative].filter(Boolean).join(" ").trim();

    const cleanSearchQuery = searchQuery.replace(/_/g, " ").trim();
    const search = cleanSearchQuery ? cleanSearchQuery : searchAlternative;

    const macrosAndReplacements: { [key: string]: string } = {
        "%%search%%": search,
        "%%currentUrl%%": window.location.href,
        "%%situations%%": situation,
        "%%responses%%": response,
        "%%by%%": by,
        "%%serviceName%%": serviceName,
        "%%location%%": location
    };
    return {metaTags, macrosAndReplacements, pageUrl}
}

export default getResultsMetaTags;
