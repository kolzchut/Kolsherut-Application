import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import transformSiteMapToListOfResponseAndSituationLinks
    from "../utilities/transformSiteMapToListOfResponseAndSituationLinks";
import getTaxonomiesFromElastic from "../utilities/taxonomy/getTaxonomiesFromElastic";

export default asyncHandler(async (req: Request, res: Response) => {
    const {situations, responses} = await getTaxonomiesFromElastic();
    const siteMapText = transformSiteMapToListOfResponseAndSituationLinks({situations, responses});
    res.status(200).json({success:true, data:siteMapText});
});
