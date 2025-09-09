import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import recursiveTaxonomyToXML from "../utilities/taxonomy/recursiveTaxonomyToXML";
import getTaxonomy from "../utilities/taxonomy/getTaxonomy";
import breakdownTaxonomy from "../utilities/taxonomy/breakdownTaxonomy";
import mixedTaxonomyToXML from "../utilities/taxonomy/mixedTaxonomyToXML";
import {fetchAllCardFields} from "../services/db/es/getAllCardIds";
import transformSiteMapFromJSONToXML from "../utilities/transformSiteMapFromJSONToXML";


export const cardsSitemap = asyncHandler(async (req: Request, res: Response) => {
    const siteMap = await fetchAllCardFields();
    const siteMapXML = transformSiteMapFromJSONToXML(siteMap);
    res.type('application/xml').status(200).send(siteMapXML);
});


export const taxonomySitemap = asyncHandler(async (req: Request, res: Response) => {
    const {responses, situations} = await getTaxonomy();
    const responsesXML = recursiveTaxonomyToXML({taxonomy: responses.items, isResponse: true});
    const situationsXML = recursiveTaxonomyToXML({taxonomy: situations.items, isResponse: false});

    const fullXML = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${responsesXML}
    ${situationsXML}
    </urlset>`;
    res.type('application/xml').send(fullXML);

});


export const mixedTaxonomySitemap = asyncHandler(async (req: Request, res: Response) => {
    try {
        const {responses, situations} = await getTaxonomy();
        const fixedResponses = breakdownTaxonomy(responses.items);
        const fixedSituations = breakdownTaxonomy(situations.items);
        const mixedXML = mixedTaxonomyToXML({responses: fixedResponses, situations: fixedSituations});
        const fullXML = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${mixedXML}
        </urlset>`;
        res.type('application/xml').send(fullXML);

    } catch (error) {
        res.status(500).json({message: "Error fetching taxonomy", error});
    }
});

