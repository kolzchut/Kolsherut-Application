from evaluation.schemas import JudgementItem, ServiceJudgement


def build_identity(query: str, side: str, rank: int) -> tuple[str, str, int]:
    """The join key shared by service_diff.csv, the two diff JSON files and every relevance
    artifact: (query, side, rank)."""
    return query, side, rank


def index_judgements_by_identity(judgements: list[ServiceJudgement]
                                 ) -> dict[tuple[str, str, int], ServiceJudgement]:
    return {build_identity(j.query, j.side, j.rank): j for j in judgements}


def pair_items_with_judgements(items: list[JudgementItem], judgements: list[ServiceJudgement]
                               ) -> list[tuple[JudgementItem, ServiceJudgement]]:
    """Every judged pair, in the frozen files' own order.

    Items-driven rather than judgement-driven on purpose: batch results come back in an order that
    is not documented as anything, so a judgement-driven table would change row order run to run.
    Items whose chunk came back unjudged simply have no row - they are counted in the log instead,
    never written with an empty verdict.
    """
    judgements_by_identity = index_judgements_by_identity(judgements)
    paired = []
    for item in items:
        judgement = judgements_by_identity.get(
            build_identity(item.query, item.side, item.rank))
        if judgement is not None:
            paired.append((item, judgement))
    return paired
