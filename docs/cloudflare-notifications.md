# Cloudflare Notifications

Kolsherut sits behind Cloudflare (zone `kolsherut.org.il`) with WAF rules, geo blocks and other protections.
This document lists the notification (alert) policies configured on the Cloudflare account and how to maintain them.

**Source of truth:** [`Infra/cloudflare/notifications.json`](../Infra/cloudflare/notifications.json).
Changes made by hand in the dashboard will show up as `UPDATE` / `UNMANAGED` the next time the sync script runs — reflect them in the JSON and in this file.

## Configured notifications

All policies are named with the `[kolsherut] ` prefix and are delivered by **email** to the `recipients` list in `notifications.json`.

| Key | Policy name | Alert type (API) | Plan required | Fires when | Filters |
|---|---|---|---|---|---|
| `http-ddos` | HTTP DDoS attack | `dos_attack_l7` | All | Cloudflare detects and mitigates an L7 DDoS attack | — |
| `security-events-spike` | Security events spike (WAF / geo blocks / rate limit) | `clickhouse_alert_fw_anomaly` | Business+ | Spike in Security Events: custom WAF rules (incl. geo blocks), managed rules, rate limiting, bot protection | zone `kolsherut.org.il` |
| `advanced-security-events-spike` | Advanced security events spike | `clickhouse_alert_fw_ent_anomaly` | Enterprise | Same as above, with per-service breakdown | zone `kolsherut.org.il` |
| `origin-unreachable` | Origin unreachable (passive origin monitoring) | `real_origin_monitoring` | Per account eligibility | Cloudflare cannot reach the origin (sustained 521/522/523) | — |
| `universal-ssl` | Universal SSL certificate events | `universal_ssl_event_type` | All | Edge certificate validation / issuance / renewal / expiration | — |
| `cloudflare-incidents` | Cloudflare incidents (major / critical) | `incident_alert` | All | Cloudflare platform incident with major or critical impact | impact: major, critical |
| `content-blocked` | Content blocked by Cloudflare | `block_notification_new_block` | All | Cloudflare Trust & Safety blocks a URL on the zone | — |
| `abuse-report` | Abuse report received | `abuse_report_alert` | All | A new abuse report is filed against the zone | — |

Policies whose alert type is not available on the account's plan are **skipped** by the sync script (it prints `SKIP`). Update the table below after each sync so it reflects what is actually live.

### Live status

_Last synced: not yet — fill in after the first `--apply` run._

| Key | Status (created / skipped – plan) |
|---|---|
| `http-ddos` | |
| `security-events-spike` | |
| `advanced-security-events-spike` | |
| `origin-unreachable` | |
| `universal-ssl` | |
| `cloudflare-incidents` | |
| `content-blocked` | |
| `abuse-report` | |

## Known gaps

- **Geo-block / WAF hit spikes on Free or Pro plans:** Cloudflare offers WAF event alerts (`Security events spike`) only on Business and above. On lower plans, review **Security → Analytics / Events** manually, or add a scheduled job that queries the GraphQL Analytics API (`firewallEventsAdaptiveGroups`) and emails on thresholds.
- **Origin 5xx error rate** (`http_alert_origin_error`) and **traffic anomalies** (`traffic_anomalies_alert`) are Enterprise-only and are not configured.
- **Health checks** (`health_check_status_notification`, Pro+) need a Cloudflare Health Check to exist first; none is defined today.

## How to apply changes

1. Create an API token (**My Profile → API Tokens → Create Token → Custom token**) with:
   - Account → **Notifications: Edit**
   - Zone → **Zone: Read** (for `kolsherut.org.il`, used to resolve the zone ID)

   A user with the *Super Administrator* or *Administrator* role on the account can create it.
2. Get the account ID from the zone's **Overview** page (right column) and put it in `account_id` in `notifications.json` (or export `CLOUDFLARE_ACCOUNT_ID`).
3. Set the real recipient emails in `recipients` (the script refuses to apply while `CHANGE_ME` is present).
4. Run from the repo root (any Python 3.8+, no dependencies):

   ```bash
   export CLOUDFLARE_API_TOKEN=...            # never commit the token
   python Infra/cloudflare/sync_notifications.py           # dry run
   python Infra/cloudflare/sync_notifications.py --apply   # create / update
   python Infra/cloudflare/sync_notifications.py --list    # dump live policies as markdown
   ```

5. Update the **Live status** table above and commit.

The script matches policies by name, creates missing ones, updates ones that drifted, and never deletes anything. Policies that exist in Cloudflare but not in the JSON are reported as `UNMANAGED`.

## Adding a new notification

1. Add an entry under `policies` in `notifications.json` (`key`, `name`, `alert_type`, `description`, optional `filters`; use `"$zones"` to target the zones listed in `zones`).
2. Valid `alert_type` values and their filter options for this account: `GET /accounts/{account_id}/alerting/v3/available_alerts` ([API docs](https://developers.cloudflare.com/api/resources/alerting/subresources/available_alerts/methods/list/), [notification catalog](https://developers.cloudflare.com/notifications/notification-available/)).
3. Add a row to the tables in this document, run the script, commit.
