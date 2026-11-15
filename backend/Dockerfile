# Build from the REPOSITORY ROOT:  docker build -f backend/Dockerfile -t fieldshift-api .
# Run:                              docker run -p 8000:8000 --env-file backend/.env fieldshift-api
FROM python:3.11-slim
WORKDIR /srv
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend backend
ENV PORT=8000 ENV=prod
# Several workers share nothing but the cache directory, so use the disk cache in production if you run more than one.
CMD ["sh", "-c", "gunicorn backend.wsgi:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 30"]
