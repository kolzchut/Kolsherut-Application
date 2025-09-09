import {Router} from "express";
import {cardsSitemap, mixedTaxonomySitemap, taxonomySitemap} from "../controllers/sitemapControllers";

const router = Router();

router.get('/cards', cardsSitemap);
router.get("/taxonomy", taxonomySitemap)
router.get('/mixedtaxonomy', mixedTaxonomySitemap)

export default router;

