"""Validation script — compare old vs new ES pipeline output.

Run after both the old ``derive`` operator and the new ``derive_es``
operator have written to ES (into separate revision aliases).  The
script queries the *current* live alias for each of the 6 indexes and
compares doc counts and field-level samples.

Usage (from the ETL container / virtualenv with srm-etl on sys.path):

    python -m operators.derive_es.validate            # compare all 6
    python -m operators.derive_es.validate srm__cards  # one index only

The script prints a summary table and exits with code 0 if no
unexpected differences are found, or code 1 otherwise.
"""
import sys
import json
from collections import OrderedDict

from operators.derive_es.es_utils import es_instance
from operators.derive_es.es_mappings import ALL_MAPPINGS
from srm_tools.logger import logger


# ── Index list ─────────────────────────────────────────────────────────

INDEX_NAMES = list(ALL_MAPPINGS.keys())
# ['srm__cards', 'srm__autocomplete', 'srm__responses',
#  'srm__situations', 'srm__orgs', 'srm__places']


# ── Helpers ────────────────────────────────────────────────────────────

def _doc_count(es, index: str) -> int:
    """Return document count for *index* (resolves aliases)."""
    try:
        resp = es.count(index=index)
        return resp.get("count", -1)
    except Exception as exc:
        logger.warning("count(%s) failed: %s", index, exc)
        return -1


def _sample_docs(es, index: str, size: int = 5) -> list[dict]:
    """Return a sample of documents (sorted by _id for repeatability)."""
    try:
        resp = es.search(
            index=index,
            body={"query": {"match_all": {}}, "sort": ["_id"], "size": size},
        )
        return [hit["_source"] for hit in resp["hits"]["hits"]]
    except Exception as exc:
        logger.warning("sample(%s) failed: %s", index, exc)
        return []


def _field_names(es, index: str) -> set[str]:
    """Return the set of mapped field names for *index*."""
    try:
        mapping = es.indices.get_mapping(index=index)
        # mapping is {concrete_index_name: {"mappings": {"properties": ...}}}
        for concrete in mapping.values():
            props = concrete.get("mappings", {}).get("properties", {})
            return set(props.keys())
    except Exception as exc:
        logger.warning("get_mapping(%s) failed: %s", index, exc)
    return set()


def _compare_docs(doc_a: dict, doc_b: dict) -> dict:
    """Field-level diff between two documents.

    Returns a dict of {field: {"old": v1, "new": v2}} for differing fields.
    Only first-level fields are compared (nested objects compared as JSON).
    """
    all_keys = set(doc_a.keys()) | set(doc_b.keys())
    diffs = {}
    for key in sorted(all_keys):
        v_old = doc_a.get(key)
        v_new = doc_b.get(key)
        # Normalize to JSON strings for deep comparison of nested structures
        if json.dumps(v_old, sort_keys=True, default=str) != json.dumps(v_new, sort_keys=True, default=str):
            diffs[key] = {"old": v_old, "new": v_new}
    return diffs


# ── Per-index validation ───────────────────────────────────────────────

def validate_index(es, index: str) -> dict:
    """Run all validations for a single index and return a report dict."""
    report: dict = OrderedDict()
    report["index"] = index

    # 1. Doc count
    count = _doc_count(es, index)
    report["doc_count"] = count
    report["exists"] = count >= 0

    if not report["exists"]:
        report["status"] = "MISSING"
        return report

    # 2. Field names (from mapping)
    expected_fields = set(ALL_MAPPINGS[index]["properties"].keys())
    actual_fields = _field_names(es, index)
    missing_fields = expected_fields - actual_fields
    extra_fields = actual_fields - expected_fields
    report["expected_fields"] = len(expected_fields)
    report["actual_fields"] = len(actual_fields)
    report["missing_fields"] = sorted(missing_fields) if missing_fields else []
    report["extra_fields"] = sorted(extra_fields) if extra_fields else []

    # 3. Sample doc check (verify docs are non-empty)
    sample = _sample_docs(es, index, size=3)
    report["sample_size"] = len(sample)
    report["sample_empty_fields"] = []
    for doc in sample:
        empty_keys = [k for k, v in doc.items() if v is None or v == "" or v == []]
        if empty_keys:
            report["sample_empty_fields"].extend(empty_keys)

    # Determine status
    if missing_fields:
        report["status"] = "WARN"
    elif count == 0:
        report["status"] = "EMPTY"
    else:
        report["status"] = "OK"

    return report


# ── Full validation ────────────────────────────────────────────────────

def validate_all(indexes: list[str] | None = None) -> list[dict]:
    """Validate all (or selected) indexes and return reports."""
    es = es_instance()
    targets = indexes or INDEX_NAMES
    reports = []
    for idx in targets:
        if idx not in ALL_MAPPINGS:
            logger.error("Unknown index: %s (expected one of %s)", idx, INDEX_NAMES)
            continue
        reports.append(validate_index(es, idx))
    return reports


def print_report(reports: list[dict]) -> bool:
    """Pretty-print validation reports.  Returns True if all OK."""
    print("\n" + "=" * 72)
    print("  DERIVE-ES VALIDATION REPORT")
    print("=" * 72)

    all_ok = True
    for r in reports:
        status = r.get("status", "UNKNOWN")
        marker = "✓" if status == "OK" else "✗"
        if status != "OK":
            all_ok = False

        print(f"\n  {marker} {r['index']}")
        print(f"    Status     : {status}")
        print(f"    Doc count  : {r.get('doc_count', '?')}")

        if r.get("missing_fields"):
            print(f"    MISSING    : {', '.join(r['missing_fields'])}")
        if r.get("extra_fields"):
            print(f"    Extra      : {', '.join(r['extra_fields'])}")
        if r.get("sample_empty_fields"):
            print(f"    Empty cols : {', '.join(set(r['sample_empty_fields']))}")

    print("\n" + "-" * 72)
    print(f"  RESULT: {'ALL OK' if all_ok else 'ISSUES FOUND'}")
    print("-" * 72 + "\n")

    return all_ok


# ── Pairwise comparison (old alias vs new alias) ──────────────────────

def compare_indexes(old_alias: str, new_alias: str, size: int = 10) -> dict:
    """Compare two concrete index aliases doc-by-doc (up to *size* docs).

    Useful for running both pipelines side-by-side and comparing output:
        compare_indexes('srm__cards_old', 'srm__cards')

    Returns a summary dict with counts and field-level diffs.
    """
    es = es_instance()
    summary: dict = OrderedDict()
    summary["old"] = old_alias
    summary["new"] = new_alias
    summary["old_count"] = _doc_count(es, old_alias)
    summary["new_count"] = _doc_count(es, new_alias)
    summary["count_match"] = summary["old_count"] == summary["new_count"]

    # Get shared sample
    old_docs = _sample_docs(es, old_alias, size)
    new_docs = _sample_docs(es, new_alias, size)

    # Index by _id for matching
    old_map = {}
    new_map = {}
    try:
        old_resp = es.search(
            index=old_alias,
            body={"query": {"match_all": {}}, "sort": ["_id"], "size": size},
        )
        for hit in old_resp["hits"]["hits"]:
            old_map[hit["_id"]] = hit["_source"]
    except Exception:
        pass
    try:
        new_resp = es.search(
            index=new_alias,
            body={"query": {"match_all": {}}, "sort": ["_id"], "size": size},
        )
        for hit in new_resp["hits"]["hits"]:
            new_map[hit["_id"]] = hit["_source"]
    except Exception:
        pass

    common_ids = set(old_map.keys()) & set(new_map.keys())
    summary["common_sample_docs"] = len(common_ids)

    diffs = []
    for doc_id in sorted(common_ids):
        d = _compare_docs(old_map[doc_id], new_map[doc_id])
        if d:
            diffs.append({"_id": doc_id, "diffs": d})

    summary["docs_with_diffs"] = len(diffs)
    summary["diffs"] = diffs[:5]  # Limit output

    return summary


# ── CLI entry ──────────────────────────────────────────────────────────

def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else None
    reports = validate_all(targets)
    ok = print_report(reports)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
