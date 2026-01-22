import { Request, Response, Router } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { renderPage } from '../services/ssr/ssrService';
import logger from '../services/logger/logger';
import vars from '../vars';

const router = Router();

router.use(asyncHandler(async (req: Request, res: Response) => {
    const requestPath = req.path || '/';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const fullPath = queryString ? `${requestPath}?${queryString}` : requestPath;

    const origin = vars.serverSetups.origin;
    const fullUrl = `${origin}${fullPath}`;

    logger.log({
        service: 'SSR Route',
        message: `Rendering path: ${fullPath} from origin: ${origin}`,
        payload: { fullUrl },
    });

    const html = await renderPage(fullUrl);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}));

export default router;
