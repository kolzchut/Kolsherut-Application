#!/usr/bin/env bash
# Copy the Elasticsearch indices the `retrieval` service depends on
# from a local ES on :9200  ->  a (port-forwarded) ES on :9201.
#
# Indices are the ones read by retrieval/app (see retrieval/app/vars.py):
#   srm_services                         - source services
#   srm__services_retrieval_embeddings   - kNN embeddings index
# srm__cards is intentionally NOT copied: the target already holds a larger/newer
# copy that must stay untouched. The weekly srm__retrieval_logs_* indices are
# write-only output and are not copied either.
#
# Usage (source ES on :9200 requires auth, so pass SOURCE_PASS too):
#   SOURCE_PASS=srcpass TARGET_PASS=tgtpass ./copy_retrieval_indices.sh
set -euo pipefail

# Force UTF-8 for every python invocation below. Without this, piped python on
# Windows decodes stdin/stdout as the ANSI codepage (cp1252) with surrogateescape,
# which mojibakes the Hebrew ES documents (utf-8 bytes read as cp1252) and turns
# stray bytes into lone surrogates. UTF-8 mode makes the scroll->bulk copy faithful.
export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8

INDICES=("srm_services" "srm__services_retrieval_embeddings")

SOURCE="http://127.0.0.1:9200"                 # local ES
TARGET="http://127.0.0.1:9201"                 # port-forwarded remote ES

SOURCE_USER="${SOURCE_USER:-elastic}"
SOURCE_PASS="${SOURCE_PASS:-}"                  # unset/empty => source is queried without auth
TARGET_USER="${TARGET_USER:-elastic}"
TARGET_PASS="${TARGET_PASS:?set TARGET_PASS to the remote ES password}"
BATCH=1000
SCROLL="2m"

# Build curl auth arg arrays (empty when no password given, so no -u flag is sent).
SAUTH=()
[ -n "${SOURCE_PASS}" ] && SAUTH=(-u "${SOURCE_USER}:${SOURCE_PASS}")
TAUTH=(-u "${TARGET_USER}:${TARGET_PASS}")

copy_index() {
  local INDEX="$1"

  echo "==> [${INDEX}] reading settings + mappings from ${SOURCE}"
  # Strip the read-only settings ES refuses on create (uuid, creation_date, version, provided_name).
  local BODY
  BODY=$(curl -sf "${SAUTH[@]}" "${SOURCE}/${INDEX}" | python -c '
import json,sys
src = list(json.load(sys.stdin).values())[0]
s = src.get("settings",{}).get("index",{})
for k in ("uuid","creation_date","version","provided_name","routing"):
    s.pop(k, None)
print(json.dumps({"settings":{"index":s}, "mappings":src.get("mappings",{})}))')

  echo "==> [${INDEX}] recreating on ${TARGET}"
  curl -sf "${TAUTH[@]}" -X DELETE "${TARGET}/${INDEX}" >/dev/null 2>&1 || true
  curl -sf "${TAUTH[@]}" -X PUT "${TARGET}/${INDEX}" \
       -H 'Content-Type: application/json' -d "${BODY}" >/dev/null
  echo "    created."

  echo "==> [${INDEX}] copying documents (scroll -> bulk)"
  local resp hits total=0 sid
  resp=$(curl -sf "${SAUTH[@]}" "${SOURCE}/${INDEX}/_search?scroll=${SCROLL}" \
         -H 'Content-Type: application/json' \
         -d "{\"size\":${BATCH},\"query\":{\"match_all\":{}}}")
  while :; do
    hits=$(echo "$resp" | python -c 'import json,sys;print(len(json.load(sys.stdin)["hits"]["hits"]))')
    [ "$hits" -eq 0 ] && break

    # Build NDJSON bulk body (action + source per hit), then index into target.
    echo "$resp" | INDEX="$INDEX" python -c '
import json,os,sys
index=os.environ["INDEX"]
out=[]
for h in json.load(sys.stdin)["hits"]["hits"]:
    out.append(json.dumps({"index":{"_index":index,"_id":h["_id"]}}))
    out.append(json.dumps(h["_source"]))
sys.stdout.write("\n".join(out)+"\n")' \
    | curl -sf "${TAUTH[@]}" -X POST "${TARGET}/_bulk" \
           -H 'Content-Type: application/x-ndjson' --data-binary @- \
    | python -c 'import json,sys;d=json.load(sys.stdin);sys.exit(1) if d.get("errors") else None' \
        || { echo "    WARNING: bulk reported item errors"; }

    total=$((total + hits))
    echo "    copied ${total} docs"

    sid=$(echo "$resp" | python -c 'import json,sys;print(json.load(sys.stdin)["_scroll_id"])')
    resp=$(curl -sf "${SAUTH[@]}" "${SOURCE}/_search/scroll" -H 'Content-Type: application/json' \
           -d "{\"scroll\":\"${SCROLL}\",\"scroll_id\":\"${sid}\"}")
  done

  # Release the scroll context.
  sid=$(echo "$resp" | python -c 'import json,sys;print(json.load(sys.stdin).get("_scroll_id",""))')
  [ -n "$sid" ] && curl -sf "${SAUTH[@]}" "${SOURCE}/_search/scroll" -X DELETE \
      -H 'Content-Type: application/json' -d "{\"scroll_id\":\"${sid}\"}" >/dev/null || true

  curl -sf "${TAUTH[@]}" -X POST "${TARGET}/${INDEX}/_refresh" >/dev/null
  local src_n tgt_n
  src_n=$(curl -sf "${SAUTH[@]}" "${SOURCE}/${INDEX}/_count" | python -c 'import json,sys;print(json.load(sys.stdin)["count"])')
  tgt_n=$(curl -sf "${TAUTH[@]}" "${TARGET}/${INDEX}/_count" | python -c 'import json,sys;print(json.load(sys.stdin)["count"])')
  echo "==> [${INDEX}] done. source ${src_n} -> target ${tgt_n}"
  echo
}

for index in "${INDICES[@]}"; do
  copy_index "$index"
done

echo "==> All indices copied."
