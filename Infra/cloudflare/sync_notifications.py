"""Sync Cloudflare notification policies from notifications.json.

Usage:
    python sync_notifications.py            # dry run: show what would change
    python sync_notifications.py --apply    # create / update policies
    python sync_notifications.py --list     # print current policies as a markdown table

Environment:
    CLOUDFLARE_API_TOKEN   token with Account > Notifications: Edit and Zone > Zone: Read
    CLOUDFLARE_ACCOUNT_ID  optional, overrides account_id in notifications.json

Policies are matched by name (name_prefix + name). Alert types the account's plan
does not offer are skipped. Policies not defined in the config are never deleted.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.cloudflare.com/client/v4"
CONFIG_PATH = Path(__file__).with_name("notifications.json")


def call(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as e:
        payload = json.loads(e.read() or b"{}")
        raise SystemExit(f"{method} {path} failed ({e.code}): {payload.get('errors')}")
    if not payload.get("success"):
        raise SystemExit(f"{method} {path} failed: {payload.get('errors')}")
    return payload["result"]


def available_alert_types(token, account_id):
    result = call(token, "GET", f"/accounts/{account_id}/alerting/v3/available_alerts")
    return {alert["type"] for alerts in result.values() for alert in alerts}


def resolve_zone_ids(token, zone_names):
    ids = []
    for name in zone_names:
        zones = call(token, "GET", f"/zones?name={urllib.parse.quote(name)}")
        if not zones:
            raise SystemExit(f"Zone not found or not visible to token: {name}")
        ids.append(zones[0]["id"])
    return ids


def build_body(policy, config, zone_ids):
    filters = {
        key: (zone_ids if value == "$zones" else value)
        for key, value in policy.get("filters", {}).items()
    }
    return {
        "name": config["name_prefix"] + policy["name"],
        "description": policy.get("description", ""),
        "alert_type": policy["alert_type"],
        "enabled": policy.get("enabled", True),
        "mechanisms": {"email": [{"id": r} for r in config["recipients"]]},
        "filters": filters,
    }


def differs(existing, desired):
    for key in ("description", "alert_type", "enabled"):
        if existing.get(key) != desired[key]:
            return True
    existing_emails = sorted(m["id"] for m in existing.get("mechanisms", {}).get("email", []))
    desired_emails = sorted(m["id"] for m in desired["mechanisms"]["email"])
    if existing_emails != desired_emails or set(existing.get("mechanisms", {})) - {"email"}:
        return True
    existing_filters = {k: sorted(v) for k, v in (existing.get("filters") or {}).items()}
    desired_filters = {k: sorted(v) for k, v in desired["filters"].items()}
    return existing_filters != desired_filters


def print_markdown(policies):
    print("| Name | Alert type | Enabled | Email recipients | Filters |")
    print("|---|---|---|---|---|")
    for p in sorted(policies, key=lambda p: p["name"]):
        emails = ", ".join(m["id"] for m in p.get("mechanisms", {}).get("email", []))
        filters = json.dumps(p.get("filters") or {}, ensure_ascii=False)
        print(f"| {p['name']} | `{p['alert_type']}` | {p['enabled']} | {emails} | `{filters}` |")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="create / update policies")
    mode.add_argument("--list", action="store_true", help="print current policies as markdown")
    args = parser.parse_args()

    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or config["account_id"]
    if not token or not account_id:
        raise SystemExit("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID (or account_id in notifications.json)")

    existing = call(token, "GET", f"/accounts/{account_id}/alerting/v3/policies")
    if args.list:
        print_markdown(existing)
        return

    if args.apply and any("CHANGE_ME" in r for r in config["recipients"]):
        raise SystemExit("Replace the CHANGE_ME recipient in notifications.json before --apply")

    available = available_alert_types(token, account_id)
    by_name = {p["name"]: p for p in existing}
    needs_zones = any(v == "$zones" for p in config["policies"] for v in p.get("filters", {}).values())
    zone_ids = resolve_zone_ids(token, config["zones"]) if needs_zones else []
    managed_names = set()

    for policy in config["policies"]:
        desired = build_body(policy, config, zone_ids)
        managed_names.add(desired["name"])
        if policy["alert_type"] not in available:
            print(f"SKIP    {desired['name']}  ({policy['alert_type']} not available on this plan)")
            continue
        current = by_name.get(desired["name"])
        if current is None:
            print(f"CREATE  {desired['name']}")
            if args.apply:
                call(token, "POST", f"/accounts/{account_id}/alerting/v3/policies", desired)
        elif differs(current, desired):
            print(f"UPDATE  {desired['name']}")
            if args.apply:
                call(token, "PUT", f"/accounts/{account_id}/alerting/v3/policies/{current['id']}", desired)
        else:
            print(f"OK      {desired['name']}")

    for name in sorted(set(by_name) - managed_names):
        print(f"UNMANAGED  {name}  (exists in Cloudflare, not in notifications.json)")

    if not args.apply:
        print("\nDry run. Re-run with --apply to make changes.")


if __name__ == "__main__":
    sys.exit(main())
