import {Router} from "express";
import {cardsSitemap, mixedTaxonomySitemap, organizationsSitemap, taxonomySitemap} from "../controllers/sitemapControllers";

const router = Router();

router.get('/cards', cardsSitemap);
router.get("/taxonomy", taxonomySitemap)
router.get('/mixedtaxonomy', mixedTaxonomySitemap)
router.get('/organizations', organizationsSitemap)

export default router;
