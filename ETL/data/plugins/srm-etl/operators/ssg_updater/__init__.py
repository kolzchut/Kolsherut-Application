"""Redeploy the currently released FE by dispatching the deploy orchestrator at
the latest GitHub release tag.

Dispatching `deploy.yml` at `refs/tags/vX.Y.Z` with scope=fe makes its `detect`
job resolve is_prod=true, fe_env=production and version=X.Y.Z, then rebuild the
FE with its production SSG and deploy that alone - BE, ETL and retrieval are left
untouched. Nothing new is created - no tag, no release, no commit - so the
deployed code is exactly what the latest release already contains.

Production only, by construction: `deploy.yml` derives is_prod from a
`refs/tags/v*` ref, which is what the latest release resolves to.

Errors propagate to `invoke_on`, which emails the failure. Do not swallow them:
the previous version logged and returned, so a broken token went unnoticed.
"""
import os

import requests

from srm_tools.logger import logger
from srm_tools.error_notifier import invoke_on

REPO_OWNER = 'kolzchut'
REPO_NAME = 'Kolsherut-Application'
WORKFLOW_FILENAME = 'deploy.yml'
API_BASE = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}'
GITHUB_TOKEN_ENV_VAR = 'KZ_KOLSHERUT_APPLICATION_GITHUB_TOKEN'
DISPATCH_SCOPE = 'fe'
PRODUCTION_TAG_PREFIX = 'v'
REQUEST_TIMEOUT_SECONDS = 30


def request_headers():
    return {
        'Authorization': f"token {os.getenv(GITHUB_TOKEN_ENV_VAR)}",
        'Accept': 'application/vnd.github+json',
    }


def fetch_latest_release_tag(headers):
    """The tag deploy.yml will check out; also what its `version` output becomes."""
    response = requests.get(f'{API_BASE}/releases/latest', headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()['tag_name']


def dispatch_deploy_workflow(headers, release_tag):
    """A 204 means accepted; the workflow file must exist on the dispatched tag."""
    url = f'{API_BASE}/actions/workflows/{WORKFLOW_FILENAME}/dispatches'
    payload = {'ref': release_tag, 'inputs': {'scope': DISPATCH_SCOPE}}
    response = requests.post(url, json=payload, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()


def run(*_):
    logger.info('Starting FE redeploy from the latest release')
    if not os.getenv(GITHUB_TOKEN_ENV_VAR):
        raise RuntimeError(f'{GITHUB_TOKEN_ENV_VAR} is not set; cannot dispatch {WORKFLOW_FILENAME}')
    headers = request_headers()
    release_tag = fetch_latest_release_tag(headers)
    if not release_tag.startswith(PRODUCTION_TAG_PREFIX):
        # deploy.yml only resolves is_prod from refs/tags/v*; any other tag would
        # deploy nothing at all rather than fail, so refuse it here instead.
        raise RuntimeError(f'Latest release tag {release_tag!r} is not a production tag; refusing to dispatch')
    logger.info('Latest release is %s; dispatching %s (scope=%s) at that tag',
                release_tag, WORKFLOW_FILENAME, DISPATCH_SCOPE)
    dispatch_deploy_workflow(headers, release_tag)
    logger.info('Dispatched %s at %s - FE only, production', WORKFLOW_FILENAME, release_tag)


def operator(*_):
    invoke_on(run, 'SSG Updater Operator')


if __name__ == '__main__':
    run()
