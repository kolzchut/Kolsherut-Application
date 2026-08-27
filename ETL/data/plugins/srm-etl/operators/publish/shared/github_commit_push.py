"""Commit a set of files to a GitHub repository as ONE commit, via the Git Data
API (create tree -> create commit -> move the branch ref).

Used instead of the Contents API because the audit needs an atomic multi-file
commit, and instead of the git CLI because the ETL container has none. Errors
propagate to the caller (the pipeline orchestrator decides how to handle them).
"""
import requests

GITHUB_API_URL = 'https://api.github.com'
REQUEST_TIMEOUT_SECONDS = 60
GIT_BLOB_FILE_MODE = '100644'


def github_headers(token):
    return {'Authorization': f'token {token}', 'Accept': 'application/vnd.github+json'}


def github_get(url, token):
    response = requests.get(url, headers=github_headers(token), timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()


def github_send(method, url, token, payload):
    response = requests.request(
        method, url, json=payload, headers=github_headers(token), timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def fetch_branch_head(repo_full_name, branch, token):
    """Returns (head commit sha, head tree sha) of the branch."""
    ref = github_get(f'{GITHUB_API_URL}/repos/{repo_full_name}/git/ref/heads/{branch}', token)
    head_commit_sha = ref['object']['sha']
    head_commit = github_get(f'{GITHUB_API_URL}/repos/{repo_full_name}/git/commits/{head_commit_sha}', token)
    return head_commit_sha, head_commit['tree']['sha']


def build_tree_items(files_by_path):
    return [
        {'path': file_path, 'mode': GIT_BLOB_FILE_MODE, 'type': 'blob', 'content': file_content}
        for file_path, file_content in sorted(files_by_path.items())
    ]


def push_files_as_single_commit(repo_full_name, branch, token, files_by_path, commit_message):
    """Commits files_by_path ({repo path: text content}) on top of the branch head."""
    repo_api_url = f'{GITHUB_API_URL}/repos/{repo_full_name}'
    head_commit_sha, head_tree_sha = fetch_branch_head(repo_full_name, branch, token)
    new_tree = github_send('POST', f'{repo_api_url}/git/trees', token,
                           {'base_tree': head_tree_sha, 'tree': build_tree_items(files_by_path)})
    new_commit = github_send('POST', f'{repo_api_url}/git/commits', token,
                             {'message': commit_message, 'tree': new_tree['sha'], 'parents': [head_commit_sha]})
    github_send('PATCH', f'{repo_api_url}/git/refs/heads/{branch}', token, {'sha': new_commit['sha']})
    return new_commit['sha']
