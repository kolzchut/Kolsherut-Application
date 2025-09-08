import {Router} from "express";
import {generalSitemap, mixedTaxonomySitemap, taxonomySitemap} from "../controllers/sitemapControllers";

const router = Router();

router.get('/', generalSitemap);
router.get("/taxonomy", taxonomySitemap)
router.get('/mixedtaxonomy', mixedTaxonomySitemap)

export default router;

