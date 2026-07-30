import json
import time
from functools import lru_cache
from pathlib import Path
from typing import Iterator

from google import genai
from google.genai import types

from evaluation import relevance_strings, relevance_vars

JSONL_LINE_SEPARATOR = '\n'


@lru_cache(maxsize=1)
def get_judge_client() -> genai.Client:
    """The key is passed explicitly: GEMINI_JUDGE_API_KEY is purpose-scoped, so genai.Client()'s
    no-argument lookup of its own generic default names would never find it. The check lives here,
    not at import time, so a run that never judges does not trip it."""
    if not relevance_vars.GEMINI_JUDGE_API_KEY:
        raise ValueError(relevance_strings.ERROR_MISSING_GEMINI_JUDGE_API_KEY)
    return genai.Client(api_key=relevance_vars.GEMINI_JUDGE_API_KEY)


def write_batch_requests_jsonl(requests: list[dict], jsonl_path: Path) -> Path:
    """One request object per line, exactly as the Batch API's file input expects."""
    jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(request, ensure_ascii=False) for request in requests]
    jsonl_path.write_text(JSONL_LINE_SEPARATOR.join(lines) + JSONL_LINE_SEPARATOR,
                          encoding='utf-8')
    return jsonl_path


def submit_judgement_batch(requests: list[dict]) -> types.BatchJob:
    """Upload the requests as a JSONL file and start a batch job over it.

    The file path is used rather than src=[inline dicts] deliberately: inline requests carry no
    `key` and are correlated back to their responses by position, which is the failure this
    whole design avoids.
    """
    client = get_judge_client()
    jsonl_path = write_batch_requests_jsonl(requests, relevance_vars.BATCH_REQUESTS_JSONL_PATH)
    uploaded_file = client.files.upload(
        file=jsonl_path,
        config=types.UploadFileConfig(mime_type=relevance_vars.BATCH_INPUT_MIME_TYPE,
                                      display_name=relevance_strings.BATCH_JOB_DISPLAY_NAME))
    return client.batches.create(
        model=relevance_vars.JUDGE_MODEL, src=uploaded_file.name,
        config=types.CreateBatchJobConfig(
            display_name=relevance_strings.BATCH_JOB_DISPLAY_NAME))


def raise_for_unsuccessful_state(job: types.BatchJob) -> None:
    """Anything that is neither succeeded nor still running is terminal and unusable."""
    state = job.state.name
    if state == relevance_vars.JOB_STATE_SUCCEEDED:
        return
    if state not in relevance_vars.JOB_STATES_STILL_RUNNING:
        raise RuntimeError(relevance_strings.ERROR_BATCH_JOB_NOT_SUCCEEDED.format(
            name=job.name, state=state, error=job.error))


def wait_for_batch(job_name: str) -> types.BatchJob:
    """Poll until the job succeeds, raising on any terminal non-success state or on timeout."""
    client = get_judge_client()
    started_at = time.monotonic()
    while True:
        job = client.batches.get(name=job_name)
        raise_for_unsuccessful_state(job)
        if job.state.name == relevance_vars.JOB_STATE_SUCCEEDED:
            return job
        elapsed_seconds = time.monotonic() - started_at
        if elapsed_seconds > relevance_vars.BATCH_POLL_TIMEOUT_SECONDS:
            raise TimeoutError(relevance_strings.ERROR_BATCH_POLL_TIMED_OUT.format(
                name=job_name, state=job.state.name, seconds=elapsed_seconds))
        time.sleep(relevance_vars.BATCH_POLL_INTERVAL_SECONDS)


def read_batch_results(job: types.BatchJob) -> Iterator[dict]:
    """Download the result file and yield one parsed JSONL line at a time.

    Callers must join each line back to its request by its `key` field. Result order is not
    documented as matching input order, so it is treated as arbitrary.
    """
    if job.dest is None or job.dest.file_name is None:
        raise RuntimeError(
            relevance_strings.ERROR_BATCH_HAS_NO_RESULT_FILE.format(name=job.name))
    client = get_judge_client()
    downloaded_bytes = client.files.download(file=job.dest.file_name)
    for line in downloaded_bytes.decode('utf-8').splitlines():
        if line.strip():
            yield json.loads(line)
