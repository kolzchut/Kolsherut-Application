# syntax=docker/dockerfile:1

# Kolsherut RAG service - single self-contained image bundling the app,
# its Python dependencies, and both local models (retrieval + reranker).
FROM python:3.12-slim

# --- runtime environment ---------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    # Models are baked into the image - never reach out to the HF hub at runtime.
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    RAG_SERVER_HOST=0.0.0.0 \
    RAG_SERVER_PORT=8200

WORKDIR /app

# --- python dependencies ---------------------------------------------------
# Install CPU-only torch first so sentence-transformers reuses it instead of
# pulling the multi-GB CUDA build (this is a CPU deployment). The PyTorch CPU
# index serves both x86_64 and aarch64 wheels, so it covers amd64 and arm64.
# --retries/--timeout ride out transient DNS blips seen during emulated builds.
COPY requirements.txt ./
RUN pip install --retries 5 --timeout 120 --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install --retries 5 --timeout 120 -r requirements.txt

# --- application + models --------------------------------------------------
# .dockerignore keeps the unused backup model, venv, caches and .env out.
COPY app ./app
COPY mock_fe ./mock_fe
COPY artifacts ./artifacts

EXPOSE 8200

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8200/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8200"]
