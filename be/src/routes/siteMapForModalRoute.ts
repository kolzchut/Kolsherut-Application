import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import getSiteMap from "../services/db/es/getSiteMap";
import transformSiteMapToListOfResponseAndSituationLinks
    from "../utilities/transformSiteMapToListOfResponseAndSituationLinks";

export default asyncHandler(async (req: Request, res: Response) => {
    const siteMap = await getSiteMap();
    const siteMapText = transformSiteMapToListOfResponseAndSituationLinks(siteMap);
    res.status(200).json({success:true, data:siteMapText});
});
