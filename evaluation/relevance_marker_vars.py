from evaluation import relevance_vars

# The judge's WIRE vocabulary and the decode table back to the canonical internal verdicts. A sixth
# focused relevance-side vars file for the same reason as the other five - relevance_vars.py sits at
# exactly 100 lines, so no constant can be added there.
#
# DEVIATION FROM SPEC §11.5, user-directed. The spec's judge contract is
# {"id": <int>, "verdict": "relevant" | "irrelevant" | "unclear", "reason": "<one short sentence>"}.
# This is where that contract is now defined instead: the judge returns ONE single-character marker
# per id and NO reason at all. The deviation is deliberate on both halves - a one-character enum
# leaves a lite-tier model nowhere to write prose where a verdict belongs, and the reason field was
# the only free text in the job, read by nothing that computes a number.
#
# These three markers are the wire format ONLY. Nothing downstream of the parse ever sees one:
# parse_judgement_result.py decodes each marker into relevance_vars' canonical verdict, so the
# judgement cache, relevance_judgements.csv, summary.json's `relevance` block, the human review
# sheet and Cohen's kappa all keep the exact vocabulary they were built and verified against.
VERDICT_MARKER_RELEVANT = 'V'
VERDICT_MARKER_IRRELEVANT = 'X'
VERDICT_MARKER_UNCLEAR = '0'

# The wire field name is deliberately NOT `verdict`: a raw 'V' must never be readable as one, and a
# distinct name means any code that reaches for the marker downstream fails loudly instead of
# writing a single letter into a verdict column.
JUDGEMENT_MARKER_KEY = 'marker'

# The decode table. Text/config, so it lives here rather than inline in the parser - and it is a
# wire-format decode, never a decision: it maps a marker the model chose onto the name we call that
# same verdict internally, and can no more change which verdict a pair gets than a JSON parser can.
VERDICT_BY_MARKER = {
    VERDICT_MARKER_RELEVANT: relevance_vars.VERDICT_RELEVANT,
    VERDICT_MARKER_IRRELEVANT: relevance_vars.VERDICT_IRRELEVANT,
    VERDICT_MARKER_UNCLEAR: relevance_vars.VERDICT_UNCLEAR,
}
# The enum the response schema pins the marker field to, and the set named in the parse error.
VERDICT_MARKERS = list(VERDICT_BY_MARKER)
