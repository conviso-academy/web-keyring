# Stage 1: Builder
FROM python:3.11-slim@sha256:ff05d1a05204fb9f7444c435db8e8ec104e587a413280dc9ffc27a4797554182 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim@sha256:ff05d1a05204fb9f7444c435db8e8ec104e587a413280dc9ffc27a4797554182 AS runtime

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create the non-root user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup \
            --no-create-home \
            --shell /sbin/nologin \
            --comment "Application Service Account" \
            appuser

WORKDIR /app

# Copy ONLY installed dependencies from the builder
COPY --from=builder --chown=appuser:appgroup /root/.local /home/appuser/.local

# Ensure the user's bin is on the PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy application code
COPY --chown=appuser:appgroup . .

RUN chmod +x entrypoint.sh

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

CMD ["./entrypoint.sh"]
