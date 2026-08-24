import {IService} from "../../types/serviceType";
import type {JsonValue} from "../../services/jsonLd/jsonLd";

const getResultsJsonLd = ({
    searchQuery,
    results,
    pageUrl,
    backendFilters,
}: {
    searchQuery: string;
    results: IService[];
    pageUrl: string;
    backendFilters: { response: string | null; situation: string | null; by: string; serviceName: string };
}) => {
    const templates: JsonValue[] = window.jsonLd.results;
    const defaults = window.jsonLd.defaults;
    const baseUrl = window.environment.currentURL;
    const siteName = window.strings.footer.nameOfWebsite;

    const cleanSearch = searchQuery.replace(/_/g, " ").trim();
    const search = cleanSearch || [backendFilters.response, backendFilters.situation].filter(Boolean).join(" ");
    const resultsDescription = `${defaults.resultsDescriptionPrefix} ${search}`;

    const itemListElements = buildResultsItemList(results.slice(0, 10), baseUrl);

    const breadcrumbs = buildResultsBreadcrumbs(search, pageUrl, baseUrl, siteName, defaults.searchResultsFallback);

    const macrosAndReplacements: Record<string, string> = {
        "%%search%%": search,
        "%%resultsDescription%%": resultsDescription,
        "%%currentUrl%%": pageUrl,
        "%%resultsCount%%": String(results.length),
    };

    const objectReplacements: Record<string, JsonValue> = {
        "%%itemListElements%%": itemListElements,
        "%%breadcrumbs%%": breadcrumbs,
    };

    return {templates, macrosAndReplacements, objectReplacements};
};

function buildResultsItemList(results: IService[], baseUrl: string) {
    const cardRoute = window.config.routes.card;
    return results.map((service, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": service.service_name,
        "url": `${baseUrl}/p${cardRoute.replace("%%cardId%%", service.id)}`
    }));
}

function buildResultsBreadcrumbs(
    search: string,
    pageUrl: string,
    baseUrl: string,
    siteName: string,
    fallbackName: string
) {
    return [
        {
            "@type": "ListItem",
            "position": 1,
            "name": siteName,
            "item": `${baseUrl}/`
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": search || fallbackName,
            "item": pageUrl
        }
    ];
}

export default getResultsJsonLd;
