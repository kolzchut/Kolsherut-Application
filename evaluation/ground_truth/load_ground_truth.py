from evaluation import vars
from evaluation.schemas import Example, ScrapedPage
from evaluation.strings import (
    LOG_GROUND_TRUTH_CACHE_HIT, LOG_SCRAPING_GROUND_TRUTH, LOG_WROTE_GROUND_TRUTH,
)
from evaluation.ground_truth.ground_truth_cache import read_ground_truth, write_ground_truth
from evaluation.ground_truth.scrape_all_examples import scrape_all_examples


def build_ground_truth(examples: list[Example], source_checksum: str, logger,
                       persist: bool) -> dict[str, ScrapedPage]:
    logger.info(LOG_SCRAPING_GROUND_TRUTH.format(
        base_url=vars.STAGING_BASE_URL, count=len(examples)))
    scraped_by_query = scrape_all_examples(examples, logger)
    if not persist:
        return scraped_by_query
    write_ground_truth(examples, scraped_by_query, source_checksum)
    skipped = sum(1 for scraped in scraped_by_query.values() if scraped.skip_reason)
    logger.info(LOG_WROTE_GROUND_TRUTH.format(
        path=vars.GROUND_TRUTH_PATH, scraped=len(scraped_by_query) - skipped, skipped=skipped))
    return scraped_by_query


def load_ground_truth(examples: list[Example], source_checksum: str, logger,
                      rescrape: bool = False, persist: bool = True) -> dict[str, ScrapedPage]:
    """Scraped service names per query: reuse the cache unless the golden set or host changed."""
    cached = None if rescrape else read_ground_truth(source_checksum)
    if cached is not None:
        logger.info(LOG_GROUND_TRUTH_CACHE_HIT.format(
            path=vars.GROUND_TRUTH_PATH, count=len(cached)))
        return cached
    return build_ground_truth(examples, source_checksum, logger, persist)
