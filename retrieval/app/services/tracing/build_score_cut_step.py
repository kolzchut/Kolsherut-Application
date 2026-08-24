from app.services.retrieval.select_documents_by_semantic_score import (
    collect_cosine_similarities,
    compute_effective_semantic_floor,
    compute_imputed_similarity,
)
from app.services.tracing.build_pipeline_step import build_pipeline_step
from app.services.tracing.summarize_pipeline_io import summarize_scored_documents
from app.strings import PIPELINE_STEP_SCORE_CUT
from app.vars import (
    KEEP_LEXICAL_ONLY_DOCUMENTS,
    MAX_RETURNED_SERVICES,
    MIN_FUSED_SCORE,
    MIN_SEMANTIC_SCORE,
    SEMANTIC_SCORE_RATIO,
)


def build_score_cut_input(fused_documents: list[dict]) -> dict:
    """Recompute the floors from the fused pool - they are pure functions of it, so this
    reports exactly what the cut used without threading the values through the pipeline."""
    cosine_similarities = collect_cosine_similarities(fused_documents)
    return {
        'fused_count': len(fused_documents),
        'top_cosine_similarity': max(cosine_similarities) if cosine_similarities else None,
        'imputed_cosine_similarity': compute_imputed_similarity(cosine_similarities),
        'effective_semantic_floor': compute_effective_semantic_floor(cosine_similarities),
        'min_fused_score': MIN_FUSED_SCORE,
        'min_semantic_score': MIN_SEMANTIC_SCORE,
        'semantic_score_ratio': SEMANTIC_SCORE_RATIO,
        'keep_lexical_only_documents': KEEP_LEXICAL_ONLY_DOCUMENTS,
        'max_returned_services': MAX_RETURNED_SERVICES,
    }


def build_score_cut_output(
    fused_documents: list[dict],
    score_selected_documents: list[dict],
    retrieved_documents: list[dict],
) -> dict:
    return {
        'kept_count': len(retrieved_documents),
        'dropped_by_floor': len(fused_documents) - len(score_selected_documents),
        'dropped_by_cap': len(score_selected_documents) - len(retrieved_documents),
        'documents': summarize_scored_documents(retrieved_documents),
    }


def build_score_cut_step(
    fused_documents: list[dict],
    score_selected_documents: list[dict],
    retrieved_documents: list[dict],
    duration_ms: float,
) -> dict:
    return build_pipeline_step(
        PIPELINE_STEP_SCORE_CUT,
        build_score_cut_input(fused_documents),
        build_score_cut_output(fused_documents, score_selected_documents, retrieved_documents),
        duration_ms,
    )
