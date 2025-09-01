import {Request, Response} from "express";
import {asyncHandler} from "../middlewares/errorHandler";
import getSiteMap from "../services/db/es/getSiteMap";
import transformSiteMapFromJSONToXML from "../utilities/transformSiteMapFromJSONToXML";

export default asyncHandler(async (req: Request, res: Response) => {
    const siteMap = await getSiteMap();
    const siteMapXML = transformSiteMapFromJSONToXML(siteMap);
    res.type('application/xml').status(200).send(siteMapXML);
});
