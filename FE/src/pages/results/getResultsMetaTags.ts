import ILocation from "../../types/locationType.ts";

const getResultsMetaTags = ({searchQuery, location}:{searchQuery:string, location:ILocation}) =>{
    const metaTags = window.metaTags.results
    const search = `${location.key && "ב" + location.key} ${searchQuery && "עבור " + searchQuery}`.trim();
    const macrosAndReplacements: { [key: string]: string } = {
        "%%search%%":search,
        "%%currentUrl%%": window.location.href,
    };
    return {metaTags, macrosAndReplacements}
}

export default getResultsMetaTags;
