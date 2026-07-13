# Kolsherut Helm Deployment Guide

This guide explains how to deploy the Kolsherut application across different environments (Development, Staging, Production) using the structured Helm configuration.

## Pre-requisites

1.  **Helm** installed.
2.  **Kubectl** configured to point to the correct cluster.
3.  **Local Secrets File**: You must have a `secrets-<env>.yaml` file locally. If not, copy `secrets.template.yaml` and fill in the credentials.

## Deployment Command Structure

To install or upgrade the release, you need to combine three configuration files:
1.  `values.yaml` (Base configuration)
2.  `values-<env>.yaml` (Environment overrides)
3.  `secrets-<env>.yaml` (Local secrets)

**Note:** The command `helm upgrade --install` handles both initial installation (if the release doesn't exist) and updating an existing release. You run the exact same command to push updates.

### 1. Development

Run the following command from the chart directory:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-dev.yaml -f secrets-dev.yaml
```

*   **Release Name:** `kolsherut`
*   **Path:** `.` (Current directory)
*   **Files:** Base + Dev Overrides + Dev Secrets

### 2. Staging

Switch your kubectl context to the staging cluster (if applicable) and run:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-staging.yaml -f secrets-staging.yaml
```

### 3. Production

Switch your kubectl context to the production cluster and run:

```bash
helm upgrade --install kolsherut . -f values.yaml -f values-prod.yaml -f secrets-prod.yaml
```

---

## Troubleshooting

*   **Secrets Missing?** Ensure `secrets-<env>.yaml` exists and is filled out. It is ignored by git for security.
*   **Wrong Values?** Helm merges files from left to right. If a value is defined in multiple files, the file specified *last* in the command takes precedence.
