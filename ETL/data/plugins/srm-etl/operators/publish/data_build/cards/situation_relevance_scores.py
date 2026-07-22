"""Situation relevance scores per card (legacy RSScoreCalc; "RS" = response-situation.
The output card fields keep their legacy/ES names: 'rs_score', 'situation_scores').

Phase 1 - collect (situation, response) co-occurrence frequencies across all cards.
Phase 2 - score table: score(s, r) = ln(total(r) / freq(s, r)) - an IDF where a
          rarer situation for a response scores higher.
Phase 3 - per card: each situation scores the sum over the card's responses of
          score(s, r) / len(responses), forced to 0 for auto-tagged situations;
          situations re-sorted by score (desc); while the card total exceeds
          MAX_TOTAL_SCORE the highest-scoring situations are dropped.
"""
import math

MAX_TOTAL_SCORE = 30


def collect_pair_frequencies(cards):
    frequencies = {}
    for card in cards:
        for situation_id in card['situation_ids']:
            for response_id in card['response_ids']:
                pair = (situation_id, response_id)
                frequencies[pair] = frequencies.get(pair, 0) + 1
    return frequencies


def build_pair_scores(cards):
    frequencies = collect_pair_frequencies(cards)
    response_totals = {}
    for (_, response_id), count in frequencies.items():
        response_totals[response_id] = response_totals.get(response_id, 0) + count
    return {
        pair: math.log(response_totals[pair[1]] / count)
        for pair, count in frequencies.items()
    }


def trim_over_tagged_situations(situations, situation_scores, total_score):
    """Drop the highest-scoring situations while the card total exceeds MAX_TOTAL_SCORE."""
    situations = list(situations)
    situation_scores = list(situation_scores)
    while total_score > MAX_TOTAL_SCORE:
        total_score -= situation_scores.pop(0)
        situations.pop(0)
    return situations, situation_scores, total_score


def collect_card_situation_scores(card, score_per_response_situation_pair):
    total_score = 0
    score_by_situation = {}
    for response in card['responses']:
        for situation in card['situations']:
            score = score_per_response_situation_pair.get(
                (situation['id'], response['id']), 0,
            ) / len(card['responses'])
            if situation['id'] in card['auto_tagged']:
                score = 0
            total_score += score
            score_by_situation[situation['id']] = score_by_situation.get(situation['id'], 0) + score
    return score_by_situation, total_score


def add_situation_scores_to_card(card, score_per_response_situation_pair):
    if not card['responses']:
        return {**card, 'rs_score': None, 'situation_scores': None}
    score_by_situation, total_score = collect_card_situation_scores(card, score_per_response_situation_pair)
    sorted_situations = sorted(
        card['situations'], key=lambda situation: score_by_situation[situation['id']], reverse=True,
    )
    sorted_scores = [score_by_situation[situation['id']] for situation in sorted_situations]
    situations, situation_scores, total_score = trim_over_tagged_situations(
        sorted_situations, sorted_scores, total_score,
    )
    return {
        **card,
        'situations': situations,
        'situation_scores': situation_scores,
        'situation_ids': [situation['id'] for situation in situations],
        'rs_score': total_score,
    }


def add_situation_relevance_scores(cards):
    score_per_response_situation_pair = build_pair_scores(cards)
    return [add_situation_scores_to_card(card, score_per_response_situation_pair) for card in cards]
