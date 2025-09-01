
const getResultsMetaTags = ({searchQuery}:{searchQuery:string}) =>{
    const metaTags = window.metaTags.results

    const search = searchQuery.replace(/_/g, " ").trim();
    const macrosAndReplacements: { [key: string]: string } = {
        "%%search%%":search,
        "%%currentUrl%%": window.location.href,
    };
    return {metaTags, macrosAndReplacements}
}

export default getResultsMetaTags;
