#!/usr/bin/env bash
# One-time copy of the `srm_services` index: local :9200  ->  port-forward :9201
# Usage:  TARGET_PASS=yourpass ./copy-srm-services.sh
set -euo pipefail

INDEX="srm_services"
SOURCE="http://127.0.0.1:9200"                 # local ES (no auth)
TARGET="http://127.0.0.1:9201"                 # port-forwarded remote ES
TARGET_USER="${TARGET_USER:-elastic}"
TARGET_PASS="${TARGET_PASS:?set TARGET_PASS to the remote ES password}"
BATCH=1000
SCROLL="2m"

TAUTH=(-u "${TARGET_USER}:${TARGET_PASS}")

echo "==> Reading settings + mappings from ${SOURCE}/${INDEX}"
# Strip the read-only settings ES refuses on create (uuid, creation_date, version, provided_name).
BODY=$(curl -sf "${SOURCE}/${INDEX}" | python -c '
import json,sys
src = list(json.load(sys.stdin).values())[0]
s = src.get("settings",{}).get("index",{})
for k in ("uuid","creation_date","version","provided_name","routing"):
    s.pop(k, None)
print(json.dumps({"settings":{"index":s}, "mappings":src.get("mappings",{})}))')

echo "==> Recreating ${TARGET}/${INDEX}"
curl -sf "${TAUTH[@]}" -X DELETE "${TARGET}/${INDEX}" >/dev/null 2>&1 || true
curl -sf "${TAUTH[@]}" -X PUT "${TARGET}/${INDEX}" \
     -H 'Content-Type: application/json' -d "${BODY}" >/dev/null
echo "    created."

echo "==> Copying documents (scroll ${SOURCE} -> bulk ${TARGET})"
resp=$(curl -sf "${SOURCE}/${INDEX}/_search?scroll=${SCROLL}" \
       -H 'Content-Type: application/json' \
       -d "{\"size\":${BATCH},\"query\":{\"match_all\":{}}}")
total=0
while :; do
  hits=$(echo "$resp" | python -c 'import json,sys;print(len(json.load(sys.stdin)["hits"]["hits"]))')
  [ "$hits" -eq 0 ] && break

  # Build NDJSON bulk body (action + source per hit), then index into target.
  echo "$resp" | python -c '
import json,sys
out=[]
for h in json.load(sys.stdin)["hits"]["hits"]:
    out.append(json.dumps({"index":{"_index":"'"${INDEX}"'","_id":h["_id"]}}))
    out.append(json.dumps(h["_source"]))
sys.stdout.write("\n".join(out)+"\n")' \
  | curl -sf "${TAUTH[@]}" -X POST "${TARGET}/_bulk" \
         -H 'Content-Type: application/x-ndjson' --data-binary @- \
  | python -c 'import json,sys;d=json.load(sys.stdin);sys.exit(1) if d.get("errors") else None' \
      || { echo "    WARNING: bulk reported item errors"; }

  total=$((total + hits))
  echo "    copied ${total} docs"

  sid=$(echo "$resp" | python -c 'import json,sys;print(json.load(sys.stdin)["_scroll_id"])')
  resp=$(curl -sf "${SOURCE}/_search/scroll" -H 'Content-Type: application/json' \
         -d "{\"scroll\":\"${SCROLL}\",\"scroll_id\":\"${sid}\"}")
done

# Release the scroll context.
sid=$(echo "$resp" | python -c 'import json,sys;print(json.load(sys.stdin).get("_scroll_id",""))')
[ -n "$sid" ] && curl -sf "${SOURCE}/_search/scroll" -X DELETE \
    -H 'Content-Type: application/json' -d "{\"scroll_id\":\"${sid}\"}" >/dev/null || true

curl -sf "${TAUTH[@]}" -X POST "${TARGET}/${INDEX}/_refresh" >/dev/null
src_n=$(curl -sf "${SOURCE}/${INDEX}/_count" | python -c 'import json,sys;print(json.load(sys.stdin)["count"])')
tgt_n=$(curl -sf "${TAUTH[@]}" "${TARGET}/${INDEX}/_count" | python -c 'import json,sys;print(json.load(sys.stdin)["count"])')
echo "==> Done. ${INDEX}: source ${src_n} -> target ${tgt_n}"