from evaluation.strings import ERROR_MISSING_GROUND_TRUTH, LOG_EVALUATING_QUERY, LOG_SKIPPING_QUERY
from evaluation.schemas import Example, QueryEvaluation, ScrapedPage
from evaluation.clients.retrieval_client import fetch_retrieval_ranked_names
from evaluation.metrics.evaluate_query import evaluate_query


def build_skipped_evaluation(example: Example, scraped: ScrapedPage) -> QueryEvaluation:
    """Unsupported rows carry no ground truth, so aggregation leaves them out of the averages."""
    return QueryEvaluation(
        query=example.query, ground_truth_size=0, empty_ground_truth=True,
        skip_reason=scraped.skip_reason,
    )


def evaluate_single_example(example: Example, scraped: ScrapedPage) -> QueryEvaluation:
    ranked_names = fetch_retrieval_ranked_names(example.query)
    return evaluate_query(example, ranked_names, scraped.service_names)


def resolve_scraped_page(example: Example, ground_truth: dict[str, ScrapedPage]) -> ScrapedPage:
    scraped = ground_truth.get(example.query)
    if scraped is None:
        raise KeyError(ERROR_MISSING_GROUND_TRUTH.format(query=example.query))
    return scraped


def evaluate_dataset(examples: list[Example], ground_truth: dict[str, ScrapedPage],
                     logger) -> list[QueryEvaluation]:
    """Score every supported example's retrieval ranking against its scraped service names."""
    evaluations = []
    for index, example in enumerate(examples, start=1):
        scraped = resolve_scraped_page(example, ground_truth)
        progress = {'index': index, 'total': len(examples), 'query': example.query}
        if scraped.skip_reason:
            logger.info(LOG_SKIPPING_QUERY.format(reason=scraped.skip_reason, **progress))
            evaluations.append(build_skipped_evaluation(example, scraped))
            continue
        logger.info(LOG_EVALUATING_QUERY.format(**progress))
        evaluations.append(evaluate_single_example(example, scraped))
    return evaluations
