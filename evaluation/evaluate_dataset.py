from evaluation.strings import LOG_EVALUATING_QUERY
from evaluation.schemas import Example, QueryEvaluation
from evaluation.clients.retrieval_client import fetch_retrieval_ranked_ids
from evaluation.clients.be_ground_truth import build_ground_truth
from evaluation.metrics.evaluate_query import evaluate_query


def evaluate_single_example(example: Example, ground_truth_cache: dict) -> QueryEvaluation:
    ranked_ids = fetch_retrieval_ranked_ids(example.query)
    ground_truth_ids, be_returned_empty = build_ground_truth(example, ground_truth_cache)
    return evaluate_query(example, ranked_ids, ground_truth_ids, be_returned_empty)


def evaluate_dataset(examples: list[Example], logger) -> list[QueryEvaluation]:
    """Run every example through retrieval + BE ground truth, sharing one BE cache."""
    ground_truth_cache = {}
    evaluations = []
    for index, example in enumerate(examples, start=1):
        logger.info(LOG_EVALUATING_QUERY.format(index=index, total=len(examples), query=example.query))
        evaluations.append(evaluate_single_example(example, ground_truth_cache))
    return evaluations
