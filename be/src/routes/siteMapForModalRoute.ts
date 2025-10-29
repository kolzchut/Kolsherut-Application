import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import transformSiteMapToListOfResponseAndSituationLinks
    from "../utilities/transformSiteMapToListOfResponseAndSituationLinks";
import getProcessedTaxonomies from "../utilities/taxonomy/getProcessedTaxonomies";

export default asyncHandler(async (req: Request, res: Response) => {
    const {situations, responses} = await getProcessedTaxonomies();
    const siteMapText = transformSiteMapToListOfResponseAndSituationLinks({situations, responses});
    res.status(200).json({success:true, data:siteMapText});
});
