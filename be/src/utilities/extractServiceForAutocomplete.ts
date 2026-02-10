import {IStructureAutocomplete} from "../types/autocomplete";

export default ({search, autocompleteOptions}: {search:string, autocompleteOptions:any}): IStructureAutocomplete | null=>{
    const cleanSearch = search.trim();
    console.log("Extracting service for autocomplete with search:", cleanSearch);
    console.log("Autocomplete options:", autocompleteOptions);
    const options = autocompleteOptions?.hits?.hits?.map((hit: any) => hit?._source) ?? [];
    const relevantOption =  options.find((option: any) => {
        const serviceName = option?.service_name?.trim() || "";
        return serviceName === cleanSearch;
    })
    if (!relevantOption) return null;
    console.log("Found relevant option for autocomplete:", relevantOption);
    return {
        label: relevantOption.service_name,
        query: relevantOption.service_name,
        serviceName: relevantOption.service_name,
        score: Infinity
    }
}
