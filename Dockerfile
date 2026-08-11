# Dockerfile for NEXUS Trading Platform
# Optimized for Render deployment

FROM python:3.11-slim

WORKDIR /app

# Fix UnicodeEncodeError in logs
ENV PYTHONIOENCODING=utf-8

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend-requirements.txt .
RUN pip install --no-cache-dir -r backend-requirements.txt

# Copy application code
COPY . .

# Default port for Render
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# Note: CMD is set in render.yaml for each service
