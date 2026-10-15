# Kolsherut – Logs & Monitoring

This page lists the logs Kolsherut produces in production, where each one is stored, how long it is kept, and how to read it. It also lists the alerts that are configured in Azure and Cloudflare. [Section 6](#6-restoring-the-configuration) has the exact configuration needed to rebuild the monitoring setup.

Production monitoring is configured by hand in the Azure portal and the Cloudflare dashboard. None of it is managed by code.

---

## 1. Where everything lives

| | |
|---|---|
| Subscription | `Kol-Sherut` |
| Resource group | `Kolsherut-Production` |
| AKS cluster | `Kolsherut-Production-Cluster` |
| **Log Analytics workspace** | **`log-analytics`** (North Europe). Most logs are stored here. |
| Retention | 30 days |
| Daily ingestion cap | 3 GB. When the cap is reached, collection stops until 00:00 UTC. |
| Alert recipients | Action group `kolsherut-prod-alerts` |

---

## 2. Log inventory

### 2.1 In Azure (Log Analytics workspace `log-analytics`)

| What | Answers the question | Table(s) | Source |
|---|---|---|---|
| **Application logs** (BE, FE, ETL/Cronicle, retrieval, Elasticsearch) | What did the service print? Why did it fail? | `ContainerLogV2` | Container Insights (pod stdout/stderr) |
| **Site access log** (every HTTP request through ingress-nginx) | Who requested which URL, with what status and latency? | `ContainerLogV2`, filtered to `PodNamespace == "ingress-nginx"` | Container Insights |
| **ETL job failures** | Which Cronicle job failed, and with what error? | `ContainerLogV2`, rows where `LogMessage.event == "etl_job_failed"` | ETL `error_notifier` |
| **Pod / container state** | Is a pod crashing, restarting, Pending, OOMKilled? | `KubePodInventory`, `ContainerInventory` | Container Insights |
| **Node state** | Is a node NotReady? | `KubeNodeInventory` | Container Insights |
| **Kubernetes warning events** | Evictions, scheduling failures, failed mounts, OOM, failing probes | `KubeEvents` | Container Insights (Warning events only) |
| **CPU / memory / disk usage**, including PVC usage | Is something running out of resources? | `Perf`, `InsightsMetrics` | Container Insights |
| **Node syslog** | Kernel, kubelet and containerd messages on the VMs | `Syslog` | Container Insights (Syslog preset) |
| **Cluster access log** | Who ran apply / delete / exec / port-forward, and from which IP? | `AKSAuditAdmin` | AKS diagnostic setting `kolsherut-prod-control-plane` |
| **Cluster authentication** | Who authenticated to the cluster (Entra ID / RBAC decisions)? | `AKSControlPlane` (`Category == "guard"`) | same |
| **Controller manager / autoscaler** | Why didn't a ReplicaSet create pods? Why did the node count change? | `AKSControlPlane` | same |
| **Container registry access** | Who logged in to `kosherutregistry`, and who pushed or pulled which image? | `ContainerRegistryLoginEvents`, `ContainerRegistryRepositoryEvents` | ACR diagnostic setting `kolsherut-prod-acr` |
| **Azure operations log** | Who created, changed or deleted an Azure resource or a permission? | `AzureActivity` | Subscription diagnostic setting `kolsherut-activity-log` |
| **Monitoring agent health** | Is the log agent itself OK? | `KubeMonAgentEvents` | Container Insights |

**Log formats**

- **BE** writes one JSON object per line: `{"timestamp", "level" (info | warning | error), "service", "message", "payload"}`. `Error` payloads keep `name`, `message` and `stack`. Each field can be queried as `LogMessage.<field>`.
- **ETL job failures** are written as one JSON line to the ETL container's stdout: `{"timestamp", "level": "error", "event": "etl_job_failed", "env", "operation", "error"}`. `error` holds the last 2,000 characters of the traceback. Runs of the `test_email_notifier` job write `"event": "etl_job_failed_test"`. Other ETL job output stays in Cronicle (see [2.2](#22-outside-log-analytics)).
- **Python tracebacks** (retrieval, ETL) are joined into a single record.
- **The access log** uses the default ingress-nginx format. The client address is the **real visitor IP**, taken from Cloudflare's `CF-Connecting-IP` header and trusted only from Cloudflare's IP ranges. See [6.5](#65-ingress-nginx-real-client-ip).
- **Pod environment variables are not collected.** `ContainerInventory.EnvironmentVar` contains only the marker `AZMON_CLUSTER_COLLECT_ENV_VAR`.

### 2.2 Outside Log Analytics

| What | Where | Retention | How to read |
|---|---|---|---|
| **Azure sign-in logs** (who signed in to the Azure account) | Entra admin center (entra.microsoft.com) → **Monitoring & health → Sign-in logs / Audit logs** | 7 days (Entra Free) or 30 days (P1/P2) | Requires a directory role that can read sign-in logs, such as Reports Reader or Security Reader. They are not exported to Log Analytics. |
| **BE log files** | `/app/logs/Logs_<unix-ts>.txt` inside the `kolsherut-be` pod, on PVC `kolsherut-be-logs`. A new file starts every 10 minutes (`LOG_DURATION`). | Until the folder reaches about 4 GiB. The `logs-cleaner` sidecar then deletes the oldest files. | `kubectl exec deploy/kolsherut-be -- ls /app/logs`. This is the same content as `ContainerLogV2`, as pretty-printed JSON. |
| **Retrieval query log** (every `/api/retrieve` call with its results) | Elasticsearch index `srm__retrieval_logs_<ISO-week>_<year>` | Not deleted automatically | Query Elasticsearch, for example `GET srm__retrieval_logs_*/_search` |
| **ETL job history** (every Cronicle run with its full output) | Cronicle UI: https://etl.kolsherut.org.il → *Completed* | Cronicle settings, stored on the ETL PVC (`/opt/cronicle/data`) | Log in with the Cronicle admin user |
| **ETL failure emails** | Email `ETL Task - <env> : <operation> Failed` from `notifier.etl@gmail.com` to `EMAIL_NOTIFIER_RECIPIENT_LIST` | Mailbox | — |
| **BE email digests** (searches with no results, errors) | Email from `notifier.etl@gmail.com` to `EMAIL_NOTIFIER_RECIPIENT_LIST`, every `EMAIL_INTERVAL_HOURS` (6) | Mailbox | — |
| **Edge / security**: WAF, geo-blocks, DDoS, cache | Cloudflare dashboard → `kolsherut.org.il` → **Security → Events**, **Analytics & Logs → Traffic** | According to the Cloudflare plan (Pro) | Managed by hand in the Cloudflare dashboard |
| **Uptime (outside-in)** | Cloudflare dashboard → `kolsherut.org.il` → **Traffic → Health Checks** (current status, failures in the last 24h) and **Traffic → Health Check Analytics** (history, latency, failure reasons) | According to the Cloudflare plan (Pro) | See [5.2](#52-cloudflare) |
| **Front-end analytics** | Google Analytics, Hotjar | — | Their own dashboards |

### 2.3 Not collected

- Kubernetes API server read logs (`kube-apiserver`, `kube-audit`). They were left out because of cost; writes are covered by `AKSAuditAdmin`.
- Entra ID sign-in / audit logs in Log Analytics. They exist only in the Entra admin center, see [2.2](#22-outside-log-analytics).
- Azure Files (FE storage, ETL plugins share) access logs.
- VNet / NSG flow logs.
- Prometheus metrics (Managed Prometheus is off).
- Normal-type Kubernetes events (only Warning events are collected).
- stdout/stderr of the `kube-system` and `gatekeeper-system` namespaces.

---

## 3. How to access the logs

### 3.1 Azure portal, Log Analytics (recommended)

1. Search the portal for **`log-analytics`** and open it. Alternatively, open the cluster and go to **Monitoring → Logs**.
2. Click **Logs** in the left menu.
3. If the screen opens as a chat (**Observability Agent**), switch the **Agent** toggle at the top right **off**.
4. Choose **KQL mode** at the top right.
5. Set the **Time range**, paste a query from [section 4](#4-query-cookbook) and click **Run**.

To keep a query, use **Save → Save as query**. Saved queries appear under **Queries hub → Saved queries**.

> Make sure the page title says **`Kolsherut-Production-Cluster`**. The chatbot clusters in the same subscription (`kz-chatbot-*`) have identical-looking pages.

### 3.2 Built-in dashboards

- **Cluster health at a glance:** `Kolsherut-Production-Cluster` → **Monitoring → Insights**. It has tabs for Cluster, Nodes, Controllers and Containers.
- **Live logs, no query needed:** Insights → **Containers** → select a container → **View live data**.
- **Kubernetes objects and events:** cluster → **Kubernetes resources → Workloads / Events**.
- **Fired alerts:** cluster → **Monitoring → Alerts**, or **Monitor → Alerts** for all resources.

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
// Last logs of one service (kolsherut-be / kolsherut-fe / kolsherut-etl / kolsherut-retrieval / kolsherut-elasticsearch)
ContainerLogV2
| where PodNamespace == "default" and PodName startswith "kolsherut-be"
| project TimeGenerated, PodName, ContainerName, LogSource, LogMessage
| order by TimeGenerated desc
| take 200

// BE warnings and errors, with structured fields
ContainerLogV2
| where PodName startswith "kolsherut-be" and ContainerName == "kolsherut-be"
| extend Level = tostring(LogMessage.level), Service = tostring(LogMessage.service), Message = tostring(LogMessage.message)
| where Level in ("error", "warning")
| project TimeGenerated, Level, Service, Message, Payload = LogMessage.payload
| order by TimeGenerated desc

// Errors across all Kolsherut services, last 24h
ContainerLogV2
| where TimeGenerated > ago(24h) and PodNamespace == "default"
| extend Message = tostring(LogMessage)
| where tostring(LogMessage.level) == "error" or LogSource == "stderr" or Message has_any ("error", "exception", "traceback")
| summarize Count = count(), Sample = take_any(Message) by ContainerName
| order by Count desc

// ETL job failures
ContainerLogV2
| where PodName startswith "kolsherut-etl"
| where tostring(LogMessage.event) startswith "etl_job_failed"
| project TimeGenerated, Event = tostring(LogMessage.event), Operation = tostring(LogMessage.operation), Error = tostring(LogMessage.error)
| order by TimeGenerated desc

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

```kusto
// Top client IPs in the last hour
ContainerLogV2
| where TimeGenerated > ago(1h)
| where PodNamespace == "ingress-nginx" and LogSource == "stdout"
| extend ClientIp = tostring(split(tostring(LogMessage), " ")[0])
| summarize Requests = count() by ClientIp
| order by Requests desc
| take 20
```

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

// Failing readiness / liveness probes (Elasticsearch red shows up here as kolsherut-elasticsearch-0)
KubeEvents
| where TimeGenerated > ago(1d) and Namespace == "default" and Reason == "Unhealthy"
| summarize Reports = count(), LastMessage = take_any(Message) by Pod = Name, bin(TimeGenerated, 15m)
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

// Was the daily cap reached / is ingestion throttled?
_LogOperation
| where Category =~ "Ingestion"
| project TimeGenerated, Level, Operation, Detail
```

---

## 5. Alerts

### 5.1 Azure

All Azure alerts email the `kolsherut-prod-alerts` action group.
- **Fired alerts:** **Monitor → Alerts**.
- **Rule definitions:** **Monitor → Alerts → Alert rules**.

| Rule | Type | Severity | Fires when |
|---|---|---|---|
| `kolsherut-cluster-silent` | Log search | 0 – Critical | No data from the cluster for 15 minutes: the cluster is down or stopped, or the agent is broken. While it fires, the other log alerts are blind. |
| `kolsherut-container-bad-state` | Log search | 1 – Error | A container is in CrashLoopBackOff, ImagePullBackOff or a config error |
| `kolsherut-node-not-ready` | Log search | 1 – Error | A node is NotReady |
| `kolsherut-container-restarts` | Log search | 2 – Warning | A container restarted. `LastReason` gives the cause (`OOMKilled`, `Error`, …). |
| `kolsherut-pod-not-running` | Log search | 2 – Warning | A pod was Pending, Failed or Unknown for 15 minutes |
| `kolsherut-k8s-warning-events` | Log search | 2 – Warning | Eviction, OOM, scheduling, volume or disk-pressure events |
| `kolsherut-pv-usage` | Log search | 2 – Warning | A PVC is above 85% |
| CPU Usage Percentage | Metric (AKS recommended) | 3 – Informational | `node_cpu_usage_percentage` > 90% |
| Memory Working Set Percentage | Metric (AKS recommended) | 3 – Informational | `node_memory_working_set_percentage` > 90% |
| Service Health | Activity log | — | Azure incident or security advisory affecting the subscription |
| AKS Resource Health | Activity log | — | The cluster is Degraded or Unavailable |

There is no alert for the daily ingestion cap. To check it, use the `_LogOperation` query in [section 4](#cost--volume).

### 5.2 Cloudflare

Account `Kol Sherut`, zone `kolsherut.org.il` (Pro plan). Alerts are emailed.
- **Alert definitions:** **Manage account → Alerts**.
- **Health check status:** zone → **Traffic → Health Checks**.

**Health checks.** Cloudflare probes the origin directly, bypassing the zone's WAF and geo-blocking. These are the only outside-in availability checks.

| Name | URL | Expected | Interval | Regions |
|---|---|---|---|---|
| `kolsherut-fe` | `https://www.kolsherut.org.il/` | HTTP 200 | 60 s | Middle East, Eastern Europe |
| `kolsherut-be` | `https://be.kolsherut.org.il/test` | HTTP 200 (`{"message":"Server is running …","success":true}`) | 60 s | Middle East, Eastern Europe |

`/test` confirms only that the BE process is up. It does not query Elasticsearch.

**Alerts**

| Alert | Fires when |
|---|---|
| `kolsherut-health-checks` (Health Checks status notification) | `kolsherut-fe` or `kolsherut-be` changes status (Healthy ⇄ Unhealthy) |
| HTTP DDoS Attack Alert | Cloudflare detects and mitigates an HTTP (L7) DDoS attack on the zone |
| Passive Origin Monitoring | Cloudflare cannot reach the origin (sustained 521/522/523 errors) |
| Universal SSL Alert | Edge certificate validation, issuance, renewal or expiry events |
| Incident alert | A Cloudflare platform incident with **major** or **critical** impact |
| Default budget alert (auto-created) | Billing budget threshold (created by Cloudflare) |

Security Events (WAF / geo-block spike) alerts and Logpush require Business or Enterprise and are not available on this plan.

---

## 6. Restoring the configuration

This section is the full configuration. Use it to rebuild production monitoring if it is lost, or to reproduce it for staging. For staging, use `staging` names and leave out `kolsherut-cluster-silent` and *AKS Resource Health*. The dev and staging clusters are stopped when idle ([docs/azure-environments.md](docs/azure-environments.md#starting-and-stopping-a-cluster)), so those two would fire every time.

### 6.1 Workspace and action group

1. **Log Analytics workspace** `log-analytics` in RG `Kolsherut-Production`, Pay-as-you-go pricing tier. Under **Usage and estimated costs**, set **Data Retention** to 30 days and **Daily cap** to 3 GB.
2. **Action group** `kolsherut-prod-alerts` (Monitor → Alerts → Action groups), with an Email notification for each recipient.

### 6.2 Container Insights

Cluster → **Monitoring → Insights → Configure**:
- **Managed Prometheus:** off. **Grafana:** off.
- **Container logs:** on, workspace `log-analytics`.
- **Logs preset:** **Syslog**. This gives a 1-minute interval, no namespace filter, Syslog collection on and ContainerLogV2 on.

### 6.3 Agent ConfigMap

Name `container-azm-ms-agentconfig`, namespace `kube-system`.
- **New cluster:** cluster → **Kubernetes resources → Workloads → + Create → Apply a YAML**.
- **Existing cluster:** **Configuration → Config maps** → open it → **YAML** → **Review + save**.

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

After saving, restart the agent from cluster → **Kubernetes resources → Run command**:

```bash
kubectl rollout restart daemonset/ama-logs deployment/ama-logs-rs -n kube-system
```

About 10 minutes later, check that environment variables are not collected. The query lists only variable **names**, never values:

```kusto
ContainerInventory
| where TimeGenerated > ago(30m)
| where isnotempty(EnvironmentVar) and EnvironmentVar != "[]"
| mv-expand Var = parse_json(EnvironmentVar)
| extend VarName = tostring(split(tostring(Var), "=")[0])
| summarize Containers = dcount(Name) by VarName
| order by Containers desc
```

The correct result is a single row, `AZMON_CLUSTER_COLLECT_ENV_VAR`. Any other name, such as `PATH`, means the ConfigMap was not applied. Agent errors appear in `KubeMonAgentEvents`.

### 6.4 Diagnostic settings

All three send to workspace `log-analytics`.

| Setting | Where | Categories | Destination table |
|---|---|---|---|
| `kolsherut-prod-control-plane` | Cluster → Monitoring → Diagnostic settings | Kubernetes Audit Admin Logs, Kubernetes Controller Manager, Kubernetes Cluster Autoscaler, guard | Resource specific |
| `kolsherut-prod-acr` | Container registry `kosherutregistry` → Monitoring → Diagnostic settings | Login Events, Repository Events | Resource specific |
| `kolsherut-activity-log` | Monitor → Activity log → Export Activity Logs | All categories | — |

### 6.5 ingress-nginx real client IP

ConfigMap `ingress-nginx-controller` in namespace `ingress-nginx`. The controller is installed with Helm (release `ingress-nginx`, chart `ingress-nginx-4.14.3`), and a `helm upgrade` of that release replaces the ConfigMap. Re-apply the block below afterwards, or pass the same keys under `controller.config` in the Helm values.

Add at the top level of the YAML. `data:` must start in the first column, at the same level as `metadata:`:

```yaml
data:
  use-forwarded-headers: "true"
  forwarded-for-header: "CF-Connecting-IP"
  proxy-real-ip-cidr: "173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32"
```

The ranges are Cloudflare's published lists (https://www.cloudflare.com/ips-v4/ and https://www.cloudflare.com/ips-v6/), as of 2026-10-15.

### 6.6 Alert rules

Settings shared by every log-search rule (**Monitor → Alerts → + Create → Alert rule**):

| Field | Value |
|---|---|
| Scope | `Kolsherut-Production-Cluster` |
| Signal | Custom log search. Paste the query into the **Search query** box. |
| Measure / Aggregation type | Table rows / Count |
| Aggregation granularity | 15 minutes |
| Split by dimensions | The columns listed for the rule, each with *Include all future values* |
| Operator / Threshold | Greater than 0, unless stated otherwise |
| Frequency of evaluation | 5 minutes |
| Action group | `kolsherut-prod-alerts` |
| Resource group | `Kolsherut-Production` |
| Advanced → Automatically resolve alerts | On |

**`kolsherut-container-bad-state`** · Sev 1 · Dimensions: `Namespace`, `PodName`, `Container`, `Reason`
```kusto
KubePodInventory
| where isnotempty(ContainerName)
| extend Container = tostring(split(ContainerName, "/")[1])
| summarize arg_max(TimeGenerated, ContainerStatusReason) by Namespace, PodName = Name, Container
| where ContainerStatusReason in ("CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull", "InvalidImageName",
                                  "CreateContainerConfigError", "CreateContainerError", "RunContainerError")
| project Namespace, PodName, Container, Reason = ContainerStatusReason
```

**`kolsherut-container-restarts`** · Sev 2 · Dimensions: `Namespace`, `PodName`, `Container`, `LastReason`
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

**`kolsherut-pod-not-running`** · Sev 2 · Dimensions: `Namespace`, `PodName`, `Status`
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

**`kolsherut-node-not-ready`** · Sev 1 · Dimensions: `Computer`, `Status`
```kusto
KubeNodeInventory
| summarize arg_max(TimeGenerated, Status) by Computer
| where Status !startswith "Ready"
| project Computer, Status
```

**`kolsherut-cluster-silent`** · Sev 0 · No dimensions · **Operator: Less than, Threshold: 1**
```kusto
KubeNodeInventory
```

**`kolsherut-k8s-warning-events`** · Sev 2 · Dimensions: `Namespace`, `Reason`, `ObjectKind`, `Object`
```kusto
KubeEvents
| where KubeEventType == "Warning"
| where Reason in ("FailedScheduling", "FailedMount", "FailedAttachVolume", "Evicted", "Evicting", "OOMKilling",
                   "SystemOOM", "NodeNotReady", "FailedCreatePodSandBox", "FailedKillPod", "EvictionThresholdMet",
                   "NodeHasDiskPressure", "NodeHasInsufficientMemory", "FreeDiskSpaceFailed", "ImageGCFailed")
| summarize Events = sum(Count), LastMessage = take_any(Message) by Namespace, Reason, ObjectKind, Object = Name
```

**`kolsherut-pv-usage`** · Sev 2 · Dimensions: `PvcNamespace`, `Pvc`
```kusto
InsightsMetrics
| where Namespace == "container.azm.ms/pv" and Name == "pvUsedBytes"
| extend Tags = todynamic(Tags)
| extend PvcNamespace = tostring(Tags.pvcNamespace), Pvc = tostring(Tags.pvcName), Capacity = todouble(Tags.pvCapacityBytes)
| summarize Used = max(Val), Capacity = max(Capacity) by PvcNamespace, Pvc
| extend UsedPercent = round(100.0 * Used / Capacity, 1)
| where UsedPercent > 85
```

**CPU and memory metric alerts:** Cluster → **Alerts → Set up recommended alerts** → **Platform metric alert rules**: `node_cpu_usage_percentage` > 90 and `node_memory_working_set_percentage` > 90. Prometheus rules off. Action group `kolsherut-prod-alerts`.

**Service Health:** Monitor → **Service Health → + Create service health alert**. Subscription `Kol-Sherut`, all services, event types *Service issue* and *Security advisory*. Action group `kolsherut-prod-alerts`.

**AKS Resource Health:** Monitor → **Service Health → Resource health → + Add resource health alert**. Resource `Kolsherut-Production-Cluster`, status *Degraded* or *Unavailable*. Action group `kolsherut-prod-alerts`.

### 6.7 Cloudflare

**Health checks:** zone `kolsherut.org.il` → **Traffic → Health Checks → Create**. Create one per row of the table in [5.2](#52-cloudflare), with Type HTTPS, the listed path and expected code, and Check regions *Middle East* and *Eastern Europe*.

**Alerts:** **Manage account → Alerts → Create an alert**. Add an email recipient to each:
- **Health Checks status notification**, named `kolsherut-health-checks`, covering `kolsherut-be` and `kolsherut-fe`.
- **HTTP DDoS Attack Alert**
- **Passive Origin Monitoring**
- **Universal SSL Alert**
- **Incident alert**, with impact filtered to *Major* and *Critical*
