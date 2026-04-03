FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_SITE_URL=""
ARG RAILWAY_PUBLIC_DOMAIN=""

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN if [ -z "$NEXT_PUBLIC_SITE_URL" ] && [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then \
      export NEXT_PUBLIC_SITE_URL="https://$RAILWAY_PUBLIC_DOMAIN"; \
    fi && \
    export NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" && \
    export NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" && \
    npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY backend /app/backend
COPY --from=frontend-builder /app/frontend/out /app/frontend/out
COPY .env.example /app/.env.example

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
