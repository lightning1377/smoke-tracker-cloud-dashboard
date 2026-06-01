# API Design

## Auth

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `DELETE /v1/me`

## Smoke Items

- `GET /v1/smoke-items`
- `POST /v1/smoke-items`
- `GET /v1/smoke-items/:id`
- `PATCH /v1/smoke-items/:id`
- `DELETE /v1/smoke-items/:id`

Deletes should archive items instead of hard-deleting them because logs and analytics reference item history.

## Smoke Logs

- `GET /v1/smoke-logs?from=2026-05-01&to=2026-05-31&itemId=...&limit=50&cursor=...`
- `POST /v1/smoke-logs`
- `GET /v1/smoke-logs/:id`
- `PATCH /v1/smoke-logs/:id`
- `DELETE /v1/smoke-logs/:id`

## Goals

- `GET /v1/goals`
- `POST /v1/goals`
- `GET /v1/goals/active`
- `PATCH /v1/goals/:id`
- `DELETE /v1/goals/:id`

## Analytics

- `GET /v1/analytics/summary`
- `GET /v1/analytics/daily-stats`
- `GET /v1/analytics/daily-target-progress`
- `GET /v1/analytics/hourly-progress`
- `GET /v1/analytics/trends?range=30d`

## Exports

- `POST /v1/exports`
- `GET /v1/exports`
- `GET /v1/exports/:id/download-url`

`POST /v1/exports` creates an export job, writes the generated file to the private S3 exports bucket, and persists the object key on the job. `GET /v1/exports/:id/download-url` returns a short-lived presigned S3 URL for completed jobs.
