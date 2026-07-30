import json

from evaluation import relevance_input_vars

# The two content hashes are mandatory - they are what identifies the judged dataset. The scrape
# date and the retrieval configuration are context only, so they are copied when the manifest
# happens to carry them and simply omitted when it does not. Neither is ever invented here.
PROVENANCE_CONTEXT_KEYS = (relevance_input_vars.MANIFEST_SCRAPE_DATE_KEY,
                           relevance_input_vars.MANIFEST_RETRIEVAL_CONFIG_KEY)


def read_judge_input_provenance() -> dict:
    """What the committed labels were produced from, read out of judge_input_manifest.json.

    Read from the manifest rather than re-hashed here on purpose: the manifest is the single place
    the frozen snapshot's identity is written down, so copying its values makes it impossible for
    `data/relevance-judgements.json` and the manifest to disagree about which bytes were judged.
    A missing manifest raises - the caller owns that, and labels without their dataset's identity
    are exactly what Step 4.3.3.4 exists to prevent.
    """
    manifest = json.loads(
        relevance_input_vars.JUDGE_INPUT_MANIFEST_PATH.read_text(encoding='utf-8'))
    hashes_key = relevance_input_vars.MANIFEST_INPUT_HASHES_KEY
    provenance = {hashes_key: manifest[hashes_key]}
    provenance.update(
        {key: manifest[key] for key in PROVENANCE_CONTEXT_KEYS if key in manifest})
    return provenance
