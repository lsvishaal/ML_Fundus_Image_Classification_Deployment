# Match CUDA version with installed PyTorch wheels (cu126)
FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu24.04

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install Python 3.12 only — combined in one RUN so cleanup doesn't bloat a separate layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    && rm -rf /var/lib/apt/lists/*

# Copy uv binary from the official image (no pip needed)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Layer caching: copy lockfiles first so this layer is only invalidated
# when dependencies change — not on every source code change
COPY pyproject.toml uv.lock .python-version ./

# --mount=type=cache reuses the uv download cache across Docker builds
# --locked ensures exact versions from uv.lock are used
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# Source code comes last — cache hit above is preserved on code-only changes
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]