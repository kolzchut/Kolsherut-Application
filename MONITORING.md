# Kolsherut – Logs & Monitoring

This page lists every log Kolsherut produces, where each one is stored, how long it is kept, and how to read it.

> Production monitoring was configured by hand in the Azure portal in October 2026.
> **This file is the single source of truth.** It covers what exists, how to access it, how it was set up ([section 7](#7-configuration-reference-how-it-was-set-up)), the exact agent ConfigMap ([Appendix A](#appendix-a--agent-configmap)), and every alert rule with its query ([Appendix B](#appendix-b--alert-rule-definitions)).
> When anything is changed in the portal, update this file in the same week.

---

## 1. Where everything lives

| | |
|---|---|
| Subscription | `Kol-Sherut` |
| Resource group | `Kolsherut-Production` |
| AKS cluster | `Kolsherut-Production-Cluster` |
| **Log Analytics workspace** | **`log-analytics`** (North Europe). Most logs end up here. |
| Retention | 30 days |
| Daily ingestion cap | 3 GB. When the cap is reached, collection stops until 00:00 UTC. |
| Alert recipients | Action group `kolsherut-prod-alerts` |

---

## 2. Log inventory

### 2.1 In Azure (Log Analytics workspace `log-analytics`)

| What | Answers the question | Table(s) | Source |
|---|---|---|---|
| **Application logs** (BE, FE, ETL/Cronicle, retrieval, Elasticsearch) | What did the service print? Why did it fail? | `ContainerLogV2` | Container Insights (pod stdout/stderr) |
| **Site access log** (every HTTP request through ingress-nginx) | Who hit which URL, with what status and latency? | `ContainerLogV2`, filtered to `PodNamespace == "ingress-nginx"` | Container Insights |
| **Pod / container state** | Is a pod crashing, restarting, Pending, OOMKilled? | `KubePodInventory`, `ContainerInventory` | Container Insights |
| **Node state** | Is a node NotReady? | `KubeNodeInventory` | Container Insights |
| **Kubernetes warning events** | Evictions, scheduling failures, failed mounts, OOM | `KubeEvents` | Container Insights (Warning events only) |
| **CPU / memory / disk usage**, including PVC usage | Is something running out of resources? | `Perf`, `InsightsMetrics` | Container Insights |
| **Node syslog** | Kernel, kubelet and containerd messages on the VMs | `Syslog` | Container Insights (Syslog preset) |
| **Cluster access log**: who ran apply / delete / exec / port-forward | Who changed the cluster, and from which IP? | `AKSAuditAdmin` | AKS diagnostic setting `kolsherut-prod-control-plane` |
| **Cluster authentication** (Entra ID / RBAC decisions) | Who authenticated to the cluster? | `AKSControlPlane` (`Category == "guard"`) | same |
| **Controller manager / autoscaler** | Why didn't a ReplicaSet create pods? Why did the node count change? | `AKSControlPlane` | same |
| **Container registry access** | Who logged in to `kosherutregistry`, and who pushed or pulled which image? | `ContainerRegistryLoginEvents`, `ContainerRegistryRepositoryEvents` | ACR diagnostic setting `kolsherut-prod-acr` |
| **Azure operations log** | Who created, changed or deleted an Azure resource or a permission? | `AzureActivity` | Subscription diagnostic setting `kolsherut-activity-log` |
| **Monitoring agent health** | Is the log agent itself OK? | `KubeMonAgentEvents` | Container Insights |

### 2.2 Outside Log Analytics

| What | Where | Retention | How to read |
|---|---|---|---|
| **BE log files** | `/app/logs/Logs_<unix-ts>.txt` inside the `kolsherut-be` pod, on PVC `kolsherut-be-logs`. A new file starts every 10 minutes (`LOG_DURATION`). | Until the folder reaches about 4 GiB. The `logs-cleaner` sidecar then deletes the oldest files. | `kubectl exec deploy/kolsherut-be -- ls /app/logs`. This is the same content as `ContainerLogV2`, written as pretty-printed JSON. |
| **Retrieval query log** (every `/api/retrieve` call with its results) | Elasticsearch index `srm__retrieval_logs_<ISO-week>_<year>` | No automatic deletion | Query Elasticsearch, for example `GET srm__retrieval_logs_*/_search` |
| **ETL job history** (each Cronicle run and its output) | Cronicle UI: https://etl.kolsherut.org.il → *Completed* | Cronicle settings, stored on the ETL PVC (`/opt/cronicle/data`) | Log in with the Cronicle admin user |
| **BE email digests** (searches with no results, errors) | Email from `notifier.etl@gmail.com` to `EMAIL_NOTIFIER_RECIPIENT_LIST`, every `EMAIL_INTERVAL_HOURS` (6) | Mailbox | — |
| **Edge / security**: WAF, geo-blocks, DDoS, origin unreachable | Cloudflare dashboard → `kolsherut.org.il` → Security → Events / Analytics | According to the Cloudflare plan | Configured by hand in the Cloudflare dashboard, see [6.6](#66-cloudflare-manual-in-the-cloudflare-dashboard) |
| **Front-end analytics** | Google Analytics, Hotjar | — | Their own dashboards |

---

## 3. How to access the logs

### 3.1 Azure portal, Log Analytics (recommended)

1. Search the portal for **`log-analytics`** and open it. Alternatively, open the cluster and go to **Monitoring → Logs**.
2. Click **Logs** in the left menu.
3. If the screen opens as a chat (**Observability Agent**), switch the **Agent** toggle at the top right **off**.
4. Choose **KQL mode** at the top right.
5. Set the **Time range**, paste a query from [section 4](#4-query-cookbook) and click **Run**.

To keep a query, use **Save → Save as query**. Saved queries appear under **Queries hub → Saved queries**.

### 3.2 Built-in dashboards

- **Cluster health at a glance:** `Kolsherut-Production-Cluster` → **Monitoring → Insights**. It has tabs for Cluster, Nodes, Controllers and Containers. Click a container to open its live log.
- **Live logs, no query needed:** Insights → **Containers** → select a container → **View live data**.
- **Kubernetes objects and events:** cluster → **Kubernetes resources → Workloads / Events**.

### 3.3 kubectl (real-time and BE files)

```bash
kubectl logs deploy/kolsherut-be -f --tail=200
kubectl logs deploy/kolsherut-retrieval --since=1h
kubectl logs deploy/ingress-nginx-controller -n ingress-nginx --tail=100
kubectl get events -A --sort-by=.lastTimestamp | tail -30
```

Without a local kubeconfig, run these from the portal: cluster → **Kubernetes resources → Run command**.

### 3.4 Permissions

Reading the workspace requires the **Log Analytics Reader** role on `log-analytics`, or **Reader** on the resource group. The workspace uses resource-context access, so someone with Reader on just the cluster can read that cluster's logs from **cluster → Logs**.

---

## 4. Query cookbook

All queries run in the `log-analytics` workspace.

### Application logs

```kusto
// Last logs of one service (kolsherut-be / kolsherut-fe / kolsherut-etl / kolsherut-retrieval / ...-elasticsearch)
ContainerLogV2
| where PodNamespace == "default" and PodName startswith "kolsherut-be"
| project TimeGenerated, PodName, ContainerName, LogSource, LogMessage
| order by TimeGenerated desc
| take 200

// Errors across all Kolsherut services, last 24h
ContainerLogV2
| where TimeGenerated > ago(24h) and PodNamespace == "default"
| extend Message = tostring(LogMessage)
| where tostring(LogMessage.level) == "error" or LogSource == "stderr" or Message has_any ("error", "exception", "traceback")
| summarize Count = count(), Sample = take_any(Message) by ContainerName
| order by Count desc

// Free-text search in all logs
ContainerLogV2
| where TimeGenerated > ago(6h)
| where tostring(LogMessage) has "srm_services"
| project TimeGenerated, PodName, LogMessage
```

### Site traffic (ingress-nginx access log)

```kusto
ContainerLogV2
| where PodNamespace == "ingress-nginx" and LogSource == "stdout"
| extend Line = tostring(LogMessage)
| parse kind=relaxed Line with ClientIp ' - ' * '"' Method ' ' Path ' HTTP/' * '" ' Status:int ' ' Bytes:long ' "' Referer '" "' UserAgent '" ' * ' ' RequestTime:real ' [' Upstream '] ' *
| where isnotnull(Status)
// Requests per upstream with error rate and p95 latency:
| summarize Requests = count(), Errors5xx = countif(Status >= 500), p95_sec = percentile(RequestTime, 95)
          by bin(TimeGenerated, 15m), Upstream
| order by TimeGenerated desc
```

Replace the last `summarize` with `| project TimeGenerated, ClientIp, Method, Path, Status, RequestTime, Upstream, UserAgent` to see individual requests. Upstream names look like `default-kolsherut-be-5000`.

> `ClientIp` is currently a **Cloudflare** IP, not the visitor's. See [section 6](#6-known-gaps).

### Kubernetes failures

```kusto
// Restarts in the last day and why (OOMKilled / Error / ...)
KubePodInventory
| where TimeGenerated > ago(1d) and isnotempty(ContainerName)
| extend Container = tostring(split(ContainerName, "/")[1])
| summarize Restarts = max(ContainerRestartCount) - min(ContainerRestartCount),
            LastStatus = take_anyif(ContainerLastStatus, isnotempty(ContainerLastStatus))
            by Namespace, Pod = Name, Container
| where Restarts > 0
| extend Reason = tostring(parse_json(LastStatus).reason), FinishedAt = tostring(parse_json(LastStatus).finishedAt)

// Current state of every pod
KubePodInventory
| where TimeGenerated > ago(15m)
| summarize arg_max(TimeGenerated, PodStatus, ContainerStatusReason, ContainerRestartCount) by Namespace, Pod = Name
| order by Namespace, Pod

// Kubernetes warning events
KubeEvents
| where TimeGenerated > ago(1d)
| project TimeGenerated, Namespace, ObjectKind, Name, Reason, Message, Count
| order by TimeGenerated desc

// PVC usage (Elasticsearch data, BE logs, ETL, FE storage)
InsightsMetrics
| where TimeGenerated > ago(1h) and Namespace == "container.azm.ms/pv" and Name == "pvUsedBytes"
| extend Tags = todynamic(Tags)
| summarize Used = max(Val), Capacity = max(todouble(Tags.pvCapacityBytes)) by Pvc = tostring(Tags.pvcName)
| extend UsedPercent = round(100.0 * Used / Capacity, 1), UsedGB = round(Used / 1e9, 2)
| order by UsedPercent desc

// Node syslog, errors and above
Syslog
| where TimeGenerated > ago(1d) and SeverityLevel in ("emerg", "alert", "crit", "err")
| project TimeGenerated, Computer, Facility, SeverityLevel, ProcessName, SyslogMessage
| order by TimeGenerated desc
```

### Access and connections

```kusto
// Who ran kubectl exec / attach / port-forward
AKSAuditAdmin
| where ObjectRef.subresource in ("exec", "attach", "portforward")
| project TimeGenerated, User = tostring(User.username), SourceIps, Verb,
          Namespace = tostring(ObjectRef.namespace), Pod = tostring(ObjectRef.name)
| order by TimeGenerated desc

// Every human change to the cluster (apply / patch / delete / scale ...)
AKSAuditAdmin
| where Verb in ("create", "update", "patch", "delete") and tostring(User.username) !startswith "system:"
| project TimeGenerated, User = tostring(User.username), SourceIps, Verb,
          Resource = tostring(ObjectRef.resource), Namespace = tostring(ObjectRef.namespace),
          Name = tostring(ObjectRef.name), Code = toint(ResponseStatus.code)
| order by TimeGenerated desc

// Who changed what in Azure
AzureActivity
| where CategoryValue == "Administrative" and ActivityStatusValue in ("Success", "Succeeded")
| project TimeGenerated, Caller, CallerIpAddress, OperationNameValue, ResourceGroup, Resource = _ResourceId
| order by TimeGenerated desc

// Registry: logins and image pushes
ContainerRegistryLoginEvents
| project TimeGenerated, Identity, CallerIpAddress, ResultDescription
ContainerRegistryRepositoryEvents
| where OperationName == "Push"
| project TimeGenerated, Repository, Tag, Identity, CallerIpAddress
```

### Cost / volume

```kusto
// What is filling the workspace (GB per table, last 7 days)
Usage
| where TimeGenerated > ago(7d) and IsBillable
| summarize GB = round(sum(Quantity) / 1024, 2) by DataType
| order by GB desc

// Did we hit the daily cap / is ingestion throttled?
_LogOperation
| where Category =~ "Ingestion"
| project TimeGenerated, Level, Operation, Detail
```

---

## 5. Alerts

All alerts email the `kolsherut-prod-alerts` action group. To see fired alerts, go to **Monitor → Alerts**. To edit the rules, go to **Monitor → Alerts → Alert rules**.

| Rule | Type | Fires when | Status |
|---|---|---|---|
| Node CPU | Metric (AKS recommended) | `node_cpu_usage_percentage` > 90% (Sev 3) | ✅ configured |
| Node memory | Metric (AKS recommended) | `node_memory_working_set_percentage` > 90% (Sev 3) | ✅ configured |
| Service Health | Activity log | Azure incident or security advisory affecting the subscription | ✅ configured |
| AKS Resource Health | Activity log | The cluster is Degraded or Unavailable | ✅ configured |
| `kolsherut-container-bad-state` | Log search | A container is in CrashLoopBackOff, ImagePullBackOff or a config error | ✅ configured |
| `kolsherut-container-restarts` | Log search | A container restarted (the reason is included) | ✅ configured |
| `kolsherut-node-not-ready` | Log search | A node is NotReady | ✅ configured |
| `kolsherut-cluster-silent` | Log search | No data from the cluster for 15 minutes | ✅ configured |
| `kolsherut-pod-not-running` | Log search | A pod was Pending, Failed or Unknown for 15 minutes | ✅ configured |
| `kolsherut-k8s-warning-events` | Log search | Eviction, OOM, scheduling, volume or disk-pressure events | ✅ configured |
| `kolsherut-pv-usage` | Log search | A PVC is above 85% | ✅ configured |
| `kolsherut-ingress-5xx` | Log search | 5% or more of requests to an upstream returned 5xx | ➖ not configured (optional) |
| `kolsherut-app-errors` | Log search | 10 or more error lines from a Kolsherut container in 15 minutes | ➖ not configured (optional) |
| `kolsherut-node-syslog-critical` | Log search | Critical syslog, kernel OOM or disk I/O errors on a node | ➖ not configured (optional) |
| `kolsherut-workspace-ingestion` | Log search (workspace) | The daily cap was reached or ingestion is throttled | ➖ not configured (optional) |
| `kolsherut-node-disk` | Metric | Node OS disk above 85% | ➖ not configured (optional) |
| `kolsherut-etl-job-failed` | Log search | An ETL (Cronicle) job failed | ➖ not configured (optional, needs the ETL deploy) |
| `kolsherut-probe-failing` | Log search | Readiness/liveness probe failing, for example Elasticsearch red | ➖ not configured (optional) |

The query and settings for every rule are in [Appendix B](#appendix-b--alert-rule-definitions). Rules marked *not configured* were deliberately left out on 2026-10-15 to keep alert noise low. Their definitions stay in Appendix B so they can be added later. Update the status column whenever rules change.

---

## 6. Additions and open items

| # | Item | Done by | Status |
|---|---|---|---|
| 6.1 | Real visitor IP in the ingress access log | Azure portal (ingress-nginx ConfigMap) | ⏳ to do |
| 6.2 | Entra ID sign-in / audit logs | Tenant admin | ⏳ waiting for admin |
| 6.3 | ETL job failures reach Azure | Code (in repo) + ETL deploy | ⏳ code ready, needs deploy. Alert B.13 is optional and not configured. |
| 6.4 | Failing health probes (Elasticsearch red, BE/FE/retrieval not ready) | Alert B.14 | ➖ not configured (optional) |
| 6.5 | BE logs as one JSON line per entry | Code (in repo) + BE deploy | ⏳ code ready, needs deploy |
| 6.6 | Cloudflare notifications | Cloudflare dashboard (manual) | See below |
| — | Azure Files (FE storage) access logs, VNet flow logs | — | Not collected. Add only if an investigation needs them. |

### 6.1 Real visitor IP in the access log

**Why:** All traffic arrives through Cloudflare, so ingress-nginx logs Cloudflare's IP as the client, and the site's connection log doesn't show who connected.

**How (Azure portal):**
1. Cluster → **Kubernetes resources → Configuration → Config maps**, namespace **`ingress-nginx`**.
2. Open the controller's ConfigMap, usually **`ingress-nginx-controller`**. It is the one whose **Data** count isn't 0, or whose name matches the deployment.
3. **YAML** tab. Under `data:` add the following, keeping any keys that are already there:
   ```yaml
   data:
     use-forwarded-headers: "true"
     forwarded-for-header: "CF-Connecting-IP"
     proxy-real-ip-cidr: "173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32"
   ```
   Check the ranges against https://www.cloudflare.com/ips/ before saving. Only requests coming from these ranges are trusted to set `CF-Connecting-IP`.
4. **Review + save**. ingress-nginx reloads the configuration on its own, with no downtime.

**Verify:** run the access-log query in [section 4](#site-traffic-ingress-nginx-access-log). `ClientIp` should now show varied, mostly Israeli addresses instead of the `162.158.x` / `172.64.x` / `104.x` Cloudflare ranges.

**Caveat:** if ingress-nginx was installed with Helm, a later `helm upgrade` of the controller can overwrite this ConfigMap. Repeat the step if `ClientIp` goes back to Cloudflare IPs.

### 6.2 Entra ID sign-in / audit logs

**Why:** These record who signed in to the Azure account and what changed in users and permissions. Entra keeps them for only 7 (Free) to 30 (P1) days, and they can't be queried together with the rest of the logs.

**Who:** someone with **Global Administrator** or **Security Administrator** in the tenant. Send them this:

> In the Entra admin center (entra.microsoft.com): **Monitoring & health → Diagnostic settings → + Add diagnostic setting**.
> - Name: `kolsherut-entra`
> - Check: **AuditLogs, SignInLogs, NonInteractiveUserSignInLogs, ServicePrincipalSignInLogs, ManagedIdentitySignInLogs**
> - Destination: **Send to Log Analytics workspace**, subscription `Kol-Sherut`, workspace `log-analytics`
> - Save. Sign-in categories need an Entra ID P1/P2 license. Without one, check only AuditLogs.

**Afterwards** the logs land in the tables `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AADServicePrincipalSignInLogs` and `AuditLogs`:
```kusto
SigninLogs
| project TimeGenerated, UserPrincipalName, IPAddress, Country = tostring(LocationDetails.countryOrRegion),
          AppDisplayName, ResultType, ResultDescription
| order by TimeGenerated desc
```
Until then, look at **Entra admin center → Monitoring & health → Sign-in logs** directly.

### 6.3 ETL job failures

**Why:** Cronicle captures each job's output into its own job log. A failed ETL job therefore never appeared in `kubectl logs` or in Log Analytics, only in the Cronicle UI and the failure email.

**What changed (code):** [`ETL/data/plugins/srm-etl/srm_tools/error_notifier.py`](ETL/data/plugins/srm-etl/srm_tools/error_notifier.py). Every operator reports failures through `invoke_on` → `send_failure_email`. That function now first writes one JSON line to the **container's** stdout (PID 1):
```json
{"timestamp": "...", "level": "error", "event": "etl_job_failed", "env": "production", "operation": "Geocode", "error": "<last 2000 chars of the traceback>"}
```
Test runs (the `test_email_notifier` operator) write `"event": "etl_job_failed_test"` instead, which the alert ignores. The same change also stopped the "failed to send email" log line from printing the sender's email password.

**To activate:** no image rebuild is needed. `srm_tools/` is plugin code, so the **Deploy** workflow's `sync-etl-plugins` job copies it to the `etl-plugins` file share ([docs/azure-environments.md](docs/azure-environments.md#etl-plugins-share)). Merging to `main` deploys to staging, and a push to `production` or a release deploys to production ([README → CI CD](README.md#ci-cd)). Alert **B.13** ([Appendix B](#b13-kolsherut-etl-job-failed-sev-2)) is optional.

**Verify:** in Cronicle, run the **test_email_notifier** job once, then query:
```kusto
ContainerLogV2
| where PodName startswith "kolsherut-etl"
| where tostring(LogMessage.event) startswith "etl_job_failed"
| project TimeGenerated, Event = tostring(LogMessage.event), Operation = tostring(LogMessage.operation), Error = tostring(LogMessage.error)
| order by TimeGenerated desc
```

### 6.4 Failing health probes

**Why:** The Elasticsearch readiness probe passes only while `_cluster/health` is green or yellow. When the cluster goes **red**, the pod stays `Running` but becomes not-ready, so none of the pod-state alerts fire. The same applies to BE, FE and retrieval when their probes fail.

**How:** create alert **B.14** ([Appendix B](#b14-kolsherut-probe-failing-sev-2)). It fires when a Kolsherut pod's probes keep failing for most of 15 minutes.

### 6.5 BE structured logs

**Why:** BE logs were multi-line text (`<time> - <service>\n  <message>`). Each entry split into several `ContainerLogV2` records, and level and service couldn't be filtered.

**What changed (code):** [`be/src/services/logger/logger.ts`](be/src/services/logger/logger.ts). Every `logger.log / logAlways / warning / error` call now prints one JSON line:
```json
{"timestamp": "2026-10-15T08:00:00.000Z", "level": "error", "service": "autocomplete", "message": "...", "payload": {...}}
```
- `level` is `info`, `warning` or `error`.
- `warning` and `error` now include `payload`, which was previously only written to the log file.
- `Error` objects are logged with `name`, `message` and `stack` instead of `{}`.

The log files under `/app/logs` are unchanged.

**To activate:** the **Deploy** workflow rebuilds and deploys the BE when `be/` changes. Merging to `main` deploys to staging, and a push to `production` or a release deploys to production ([README → CI CD](README.md#ci-cd)).

**Query:**
```kusto
ContainerLogV2
| where PodName startswith "kolsherut-be" and ContainerName == "kolsherut-be"
| extend Level = tostring(LogMessage.level), Service = tostring(LogMessage.service), Message = tostring(LogMessage.message)
| where Level in ("error", "warning")
| project TimeGenerated, Level, Service, Message, Payload = LogMessage.payload
| order by TimeGenerated desc
```

### 6.6 Cloudflare (manual, in the Cloudflare dashboard)

Cloudflare for `kolsherut.org.il` is managed by hand in the dashboard. Nothing for this project lives in the repo. Recommended settings:
- **Notifications** (account → Notifications → Add): HTTP DDoS attack, Universal SSL certificate events, Passive origin monitoring (origin unreachable, if offered on the plan), Cloudflare incidents.
- **Investigating traffic:** zone → **Security → Events** for WAF and geo-blocks, and **Analytics & Logs → Traffic**.
- Whenever a notification is added or changed, update this list.

---

## 7. Configuration reference (how it was set up)

Repeat these steps for staging with `staging` names. **Note:** the dev and staging clusters are stopped when idle ([docs/azure-environments.md](docs/azure-environments.md#starting-and-stopping-a-cluster)). On those clusters, `kolsherut-cluster-silent` and *AKS Resource Health* would fire every time the cluster is stopped, so leave them out there.

1. **Workspace:** Log Analytics workspace `log-analytics` in RG `Kolsherut-Production`, Pay-as-you-go. Under **Usage and estimated costs**: Data Retention 30 days, Daily cap 3 GB.
2. **Action group:** Monitor → Alerts → Action groups → `kolsherut-prod-alerts`, with email receivers.
3. **Container Insights:** cluster → Monitoring → Insights → Configure.
   - Managed Prometheus **off**, Grafana **off**, Container logs **on** → `log-analytics`.
   - Logs preset **Syslog**: 1-minute interval, no namespace filter, Syslog on, ContainerLogV2 on.
4. **Agent ConfigMap:** `kube-system/container-azm-ms-agentconfig`. The exact contents and how to apply them are in [Appendix A](#appendix-a--agent-configmap).
5. **AKS diagnostic setting** `kolsherut-prod-control-plane` → `log-analytics`, Resource specific. Categories: Kubernetes Audit Admin Logs, Kubernetes Controller Manager, Kubernetes Cluster Autoscaler, guard. *API Server and Audit stay off because of cost.*
6. **ACR diagnostic setting** `kolsherut-prod-acr` on `kosherutregistry` → `log-analytics`, Resource specific. Categories: Login Events, Repository Events.
7. **Activity Log export** `kolsherut-activity-log`: Monitor → Activity log → Export Activity Logs. All categories → `log-analytics`.
8. **Alerts:** see [section 5](#5-alerts) and [Appendix B](#appendix-b--alert-rule-definitions).

---

## Appendix A – Agent ConfigMap

Name `container-azm-ms-agentconfig`, namespace `kube-system`.

- **First time:** cluster → **Kubernetes resources → Workloads → + Create → Apply a YAML**.
- **To change it:** cluster → **Kubernetes resources → Configuration → Config maps** (namespace `kube-system`) → open it → **YAML** → edit → **Review + save**. Then restart the agent, as described below.

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: container-azm-ms-agentconfig
  namespace: kube-system
data:
  schema-version: v1
  config-version: kolsherut-v1
  log-data-collection-settings: |-
    [log_collection_settings]
       [log_collection_settings.stdout]
          enabled = true
          exclude_namespaces = ["kube-system", "gatekeeper-system"]
       [log_collection_settings.stderr]
          enabled = true
          exclude_namespaces = ["kube-system", "gatekeeper-system"]
       # MUST stay false: the Kolsherut pods load their secrets with envFrom, and the
       # default (true) copies every environment variable into ContainerInventory.
       [log_collection_settings.env_var]
          enabled = false
       [log_collection_settings.enrich_container_logs]
          enabled = false
       # Warning events only (Normal events are high-volume and rarely useful).
       [log_collection_settings.collect_all_kube_events]
          enabled = false
       [log_collection_settings.schema]
          containerlog_schema_version = "v2"
       # Join Python tracebacks (retrieval, ETL) into a single log record.
       [log_collection_settings.enable_multiline_logs]
          enabled = "true"
          stacktrace_languages = ["python"]
```

**Restart the agent** after any change, from cluster → **Kubernetes resources → Run command**:

```bash
kubectl rollout restart daemonset/ama-logs deployment/ama-logs-rs -n kube-system
```

Alternatively, go to **Workloads → Pods**, filter namespace `kube-system`, select every `ama-logs-*` pod and click **Delete**. They are recreated automatically and the app is not affected.

**Verify** about 10 minutes later. The query lists only variable **names**, never values, so its output is safe to share:

```kusto
ContainerInventory
| where TimeGenerated > ago(30m)
| where isnotempty(EnvironmentVar) and EnvironmentVar != "[]"
| mv-expand Var = parse_json(EnvironmentVar)
| extend VarName = tostring(split(tostring(Var), "=")[0])
| summarize Containers = dcount(Name) by VarName
| order by Containers desc
```

The expected result is a **single row, `AZMON_CLUSTER_COLLECT_ENV_VAR`**. This is the marker the agent writes in place of the real variables when collection is off, so `EnvironmentVar` is never empty. Any other name, such as `PATH` or `ELASTIC_URL`, means environment variables are being collected again. If that happens, check `KubeMonAgentEvents` for ConfigMap errors.

*Verified on 2026-10-15: only the marker was present, in 88 containers, and none of the Kolsherut secret names were found in the previous 2 days.*

Agent errors, including a ConfigMap it could not parse, appear in `KubeMonAgentEvents`.

---

## Appendix B – Alert rule definitions

### Common settings for every log-search rule

**Monitor → Alerts → + Create → Alert rule**

| Field | Value |
|---|---|
| Scope | `Kolsherut-Production-Cluster`, the cluster, **not** the workspace |
| Signal | Custom log search, using the query below |
| Measure / Aggregation | Table rows / Count |
| Aggregation granularity | 15 minutes |
| Split by dimensions | The columns listed for the rule, each with *Include all future values* |
| Operator / Threshold | Greater than 0, unless the rule says otherwise |
| Frequency of evaluation | 5 minutes |
| Action group | `kolsherut-prod-alerts` |
| Resource group | `Kolsherut-Production` |
| Advanced → Automatically resolve alerts | ✅ |

### B.1 `kolsherut-container-bad-state` (Sev 1)
A container is stuck in a failure state. **Dimensions:** `Namespace`, `PodName`, `Container`, `Reason`
```kusto
KubePodInventory
| where isnotempty(ContainerName)
| extend Container = tostring(split(ContainerName, "/")[1])
| summarize arg_max(TimeGenerated, ContainerStatusReason) by Namespace, PodName = Name, Container
| where ContainerStatusReason in ("CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull", "InvalidImageName",
                                  "CreateContainerConfigError", "CreateContainerError", "RunContainerError")
| project Namespace, PodName, Container, Reason = ContainerStatusReason
```

### B.2 `kolsherut-container-restarts` (Sev 2)
A container restarted. `LastReason` is `OOMKilled`, `Error` and so on. **Dimensions:** `Namespace`, `PodName`, `Container`, `LastReason`
```kusto
KubePodInventory
| where isnotempty(ContainerName)
| extend Container = tostring(split(ContainerName, "/")[1])
| summarize Restarts = max(ContainerRestartCount) - min(ContainerRestartCount),
            LastStatus = take_anyif(ContainerLastStatus, isnotempty(ContainerLastStatus))
            by Namespace, PodName = Name, Container
| where Restarts > 0
| extend LastReason = coalesce(tostring(parse_json(LastStatus).reason), "unknown")
| project Namespace, PodName, Container, Restarts, LastReason
```

### B.3 `kolsherut-pod-not-running` (Sev 2)
A pod was Pending, Failed or Unknown for the whole 15 minutes. **Dimensions:** `Namespace`, `PodName`, `Status`
```kusto
KubePodInventory
| where PodStatus != "Succeeded"
| summarize Samples = count(),
            BadSamples = countif(PodStatus in ("Pending", "Failed", "Unknown")),
            Status = take_anyif(PodStatus, PodStatus in ("Pending", "Failed", "Unknown"))
            by Namespace, PodName = Name
| where Samples == BadSamples
| project Namespace, PodName, Status
```

### B.4 `kolsherut-node-not-ready` (Sev 1)
**Dimensions:** `Computer`, `Status`
```kusto
KubeNodeInventory
| summarize arg_max(TimeGenerated, Status) by Computer
| where Status !startswith "Ready"
| project Computer, Status
```

### B.5 `kolsherut-cluster-silent` (Sev 0)
There has been no data from the cluster for 15 minutes. Either the cluster is down or stopped, or the agent is broken. While this alert fires, every other cluster alert is blind. **No dimensions.** **Operator: Less than, Threshold: 1.**
```kusto
KubeNodeInventory
```

### B.6 `kolsherut-k8s-warning-events` (Sev 2)
Evictions, OOM, scheduling and volume failures, disk pressure. **Dimensions:** `Namespace`, `Reason`, `ObjectKind`, `Object`
```kusto
KubeEvents
| where KubeEventType == "Warning"
| where Reason in ("FailedScheduling", "FailedMount", "FailedAttachVolume", "Evicted", "Evicting", "OOMKilling",
                   "SystemOOM", "NodeNotReady", "FailedCreatePodSandBox", "FailedKillPod", "EvictionThresholdMet",
                   "NodeHasDiskPressure", "NodeHasInsufficientMemory", "FreeDiskSpaceFailed", "ImageGCFailed")
| summarize Events = sum(Count), LastMessage = take_any(Message) by Namespace, Reason, ObjectKind, Object = Name
```

### B.7 `kolsherut-pv-usage` (Sev 2)
A PVC is above 85%. This covers Elasticsearch data, BE logs, ETL and FE storage. **Dimensions:** `PvcNamespace`, `Pvc`
```kusto
InsightsMetrics
| where Namespace == "container.azm.ms/pv" and Name == "pvUsedBytes"
| extend Tags = todynamic(Tags)
| extend PvcNamespace = tostring(Tags.pvcNamespace), Pvc = tostring(Tags.pvcName), Capacity = todouble(Tags.pvCapacityBytes)
| summarize Used = max(Val), Capacity = max(Capacity) by PvcNamespace, Pvc
| extend UsedPercent = round(100.0 * Used / Capacity, 1)
| where UsedPercent > 85
```

### B.8 `kolsherut-ingress-5xx` (Sev 1)
At least 5% of requests to an upstream returned 5xx in 15 minutes, with a minimum of 20 requests. **Dimensions:** `Upstream`
```kusto
ContainerLogV2
| where PodNamespace == "ingress-nginx" and LogSource == "stdout"
| extend Line = tostring(LogMessage)
| parse kind=relaxed Line with * '"' Method ' ' Path ' HTTP/' * '" ' Status:int ' ' * ' [' Upstream '] ' *
| where isnotnull(Status) and isnotempty(Upstream)
| summarize Requests = count(), Errors = countif(Status >= 500) by Upstream
| where Requests >= 20
| extend ErrorPercent = round(100.0 * Errors / Requests, 1)
| where ErrorPercent >= 5
```

### B.9 `kolsherut-app-errors` (Sev 3)
A Kolsherut container logged 10 or more error lines in 15 minutes. **Dimensions:** `PodNamespace`, `ContainerName`
```kusto
ContainerLogV2
| where PodNamespace == "default"
| extend Message = tostring(LogMessage)
| where LogLevel in~ ("error", "critical", "fatal")
    or tostring(LogMessage.level) == "error"
    or (LogSource == "stderr" and Message has_any ("error", "exception", "traceback", "fail"))
| summarize Errors = count(), Sample = take_any(Message) by PodNamespace, ContainerName
| where Errors >= 10
```

### B.10 `kolsherut-node-syslog-critical` (Sev 2)
**Dimensions:** `Computer`, `ProcessName`
```kusto
Syslog
| where SeverityLevel in ("emerg", "alert", "crit")
    or (Facility == "kern" and SyslogMessage has_any ("Out of memory", "oom-kill", "I/O error", "EXT4-fs error", "hung_task"))
| summarize Lines = count(), Sample = take_any(SyslogMessage) by Computer, ProcessName = coalesce(ProcessName, Facility)
```

### B.11 `kolsherut-workspace-ingestion` (Sev 1)
The daily cap was reached or ingestion is throttled, so logs are being dropped. **Scope: the `log-analytics` workspace**, not the cluster. Evaluate every 15 minutes over 15 minutes. **No dimensions.** Turn **off** *Automatically resolve*.
```kusto
_LogOperation
| where Category =~ "Ingestion"
| where Level =~ "Warning" or Level =~ "Error"
| project TimeGenerated, Operation, Detail
```

### B.12 `kolsherut-node-disk` (Sev 2, metric alert)
Signal: **`node_disk_usage_percentage`** (platform metric on the cluster). Aggregation: Average over 15 minutes. Condition: greater than 85. Split by dimension `node`.

### B.13 `kolsherut-etl-job-failed` (Sev 2)
An ETL (Cronicle) job failed. This requires the ETL change from [6.3](#63-etl-job-failures) to be deployed. **Dimensions:** `Operation`
```kusto
ContainerLogV2
| where PodName startswith "kolsherut-etl"
| where tostring(LogMessage.event) == "etl_job_failed"
| summarize Failures = count(), LastError = take_any(tostring(LogMessage.error)) by Operation = tostring(LogMessage.operation)
```

### B.14 `kolsherut-probe-failing` (Sev 2)
A Kolsherut pod's readiness or liveness probe has been failing for most of the window. For `kolsherut-elasticsearch-0` this means the Elasticsearch cluster is **red** or not responding. **Dimensions:** `PodName`, `Probe`
```kusto
KubeEvents
| where Namespace == "default" and Name startswith "kolsherut-"
| where KubeEventType == "Warning" and Reason == "Unhealthy"
| extend Probe = case(Message startswith "Readiness", "readiness", Message startswith "Liveness", "liveness",
                      Message startswith "Startup", "startup", "other")
| summarize Reports = count(), LastMessage = take_any(Message) by PodName = Name, Probe
| where Reports >= 5
```
Note: probes failing briefly during a rollout or restart are normal. `Reports >= 5`, about 5 of the 15 minutes, filters those out.

### Already configured (not log search)
- **Node CPU** > 90% and **Node memory** > 90%: created with *Set up recommended alert rules* on the cluster.
- **Service Health:** Monitor → Service Health → alert on *Service issue* and *Security advisory*.
- **AKS Resource Health:** Monitor → Service Health → Resource health → alert when `Kolsherut-Production-Cluster` is Degraded or Unavailable.
