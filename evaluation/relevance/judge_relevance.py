from logging import Logger

from evaluation import relevance_strings, relevance_vars
from evaluation.clients.llm_client import (
    read_batch_results, submit_judgement_batch, wait_for_batch,
)
from evaluation.relevance.build_judgement_request import build_judgement_requests
from evaluation.relevance.chunk_judgement_items import chunk_judgement_items
from evaluation.relevance.judgement_cache import load_judgement_cache, save_judgement_cache
from evaluation.relevance.parse_judgement_result import parse_judgement_results
from evaluation.relevance.read_cached_judgement import split_items_by_cache
from evaluation.schemas import JudgementChunk, JudgementItem, ServiceJudgement


def log_unjudged_chunks(unjudged_chunks: list[tuple[JudgementChunk, str]],
                        chunk_count: int, logger: Logger) -> None:
    """Every chunk that produced no verdict, named individually so its pairs are identifiable
    rather than merely absent, then counted so partial coverage cannot read as full."""
    for chunk, reason in unjudged_chunks:
        logger.warning(relevance_strings.LOG_UNJUDGED_CHUNK.format(
            key=chunk.key, count=len(chunk.items), reason=reason))
    if unjudged_chunks:
        logger.warning(relevance_strings.LOG_UNJUDGED_CHUNK_TOTAL.format(
            chunks=len(unjudged_chunks), total_chunks=chunk_count,
            pairs=sum(len(chunk.items) for chunk, _ in unjudged_chunks)))


def submit_and_parse_chunks(chunks: list[JudgementChunk], logger: Logger) -> list[ServiceJudgement]:
    """One batch job over every chunk: submit, wait, parse, log what came back unjudged."""
    job = submit_judgement_batch(build_judgement_requests(chunks))
    logger.info(relevance_strings.LOG_SUBMITTED_BATCH.format(
        name=job.name, model=relevance_vars.JUDGE_MODEL))
    finished_job = wait_for_batch(job.name)
    judgements, unjudged_chunks = parse_judgement_results(chunks,
                                                          read_batch_results(finished_job))
    log_unjudged_chunks(unjudged_chunks, len(chunks), logger)
    return judgements


def judge_relevance(items: list[JudgementItem], logger: Logger) -> list[ServiceJudgement]:
    """Every item's verdict: reused from the cache where possible, judged where not.

    The cache is keyed on (query, service_name) alone, so a pair judged under any earlier
    retrieval configuration is reused here, and the saved cache holds the union.
    """
    cache = load_judgement_cache() or {}
    cached_judgements, pending_items = split_items_by_cache(items, cache)
    logger.info(relevance_strings.LOG_JUDGEMENT_ITEMS_CACHED.format(
        cached=len(cached_judgements), total=len(items), pending=len(pending_items)))
    if not pending_items:
        logger.info(relevance_strings.LOG_NOTHING_LEFT_TO_JUDGE)
        return cached_judgements
    chunks = chunk_judgement_items(pending_items)
    logger.info(relevance_strings.LOG_CHUNKED_JUDGEMENT_ITEMS.format(
        items=len(pending_items), chunks=len(chunks),
        size=relevance_vars.JUDGEMENT_CHUNK_SIZE))
    judgements = [*cached_judgements, *submit_and_parse_chunks(chunks, logger)]
    save_judgement_cache(judgements)
    logger.info(relevance_strings.LOG_WROTE_JUDGEMENT_CACHE.format(
        count=len(judgements), path=relevance_vars.JUDGEMENT_CACHE_PATH))
    return judgements
