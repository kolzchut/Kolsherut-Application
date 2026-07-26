from evaluation.schemas import Example, ScrapedPage
from evaluation.strings import LOG_SCRAPED_PAGE, LOG_SKIPPED_PAGE
from evaluation.scraper.browser_session import browser_session
from evaluation.scraper.scrape_service_names import scrape_service_names


def log_scraped_page(logger, index: int, total: int, example: Example, scraped: ScrapedPage) -> None:
    progress = {'index': index, 'total': total, 'query': example.query}
    if scraped.skip_reason:
        logger.info(LOG_SKIPPED_PAGE.format(reason=scraped.skip_reason, **progress))
        return
    logger.info(LOG_SCRAPED_PAGE.format(count=len(scraped.service_names), **progress))


def scrape_all_examples(examples: list[Example], logger) -> dict[str, ScrapedPage]:
    """Render every golden-set URL in one browser, serially, and collect its service names."""
    scraped_by_query = {}
    with browser_session() as (page, recorded_searches):
        for index, example in enumerate(examples, start=1):
            scraped = scrape_service_names(page, recorded_searches, example.staging_url)
            log_scraped_page(logger, index, len(examples), example, scraped)
            scraped_by_query[example.query] = scraped
    return scraped_by_query
