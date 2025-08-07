import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import getSiteMap from "../services/db/es/getSiteMap";
import transformSiteMapFromJSONToText from "../utilities/transformSiteMapFromJSONToText";

export default asyncHandler(async (req: Request, res: Response) => {
    const siteMap =await getSiteMap();
    const siteMapText = transformSiteMapFromJSONToText(siteMap);
    res.status(200).send(siteMapText);
});
