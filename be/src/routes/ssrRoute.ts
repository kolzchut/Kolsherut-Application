import { Request, Response, Router } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { renderPage } from '../services/ssr/ssrService';
import logger from '../services/logger/logger';

const router = Router();

router.use(asyncHandler(async (req: Request, res: Response) => {
    const fullPath = req.originalUrl || '/';

    const forwardedHost = req.headers['x-forwarded-host'] || req.get('host');
    const forwardedProto = req.headers['x-forwarded-proto'] || req.protocol;

    const host = typeof forwardedHost === 'string' ? forwardedHost.split(',')[0].trim() : forwardedHost;
    const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : 'http';

    const fullUrl = `${protocol}://${host}${fullPath}`;

    logger.log({
        service: 'SSR Route',
        message: `Rendering path: ${fullPath} from original host: ${host}`,
        payload: { fullUrl },
    });

    const page = await renderPage(fullUrl);

    if (page.fail) {
        res.status(404).end();
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(page.html);
}));

export default router;
