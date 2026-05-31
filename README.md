# Smoke Tracker Cloud Dashboard

A production-style AWS deployment case study for an optional cloud dashboard companion to a mobile smoke tracking app.

Built with React, TypeScript, Node.js, MySQL, Terraform, GitHub Actions, ECS Fargate, RDS, S3, CloudFront, Secrets Manager, and CloudWatch.

## Product Scope

The dashboard is an opt-in cloud companion for users who want to sync Smoke Tracker data, view long-term analytics, export history, and track reduction or limit goals across devices.

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Query, React Router, Recharts
- Backend: Node.js, TypeScript, Fastify, Prisma, Zod
- Database: MySQL 8 on Amazon RDS
- Auth: JWT access tokens with refresh token rotation
- Runtime: Docker, ECS Fargate, Application Load Balancer
- Frontend hosting: S3 and CloudFront
- Infrastructure: Terraform
- CI/CD: GitHub Actions
- Secrets and logs: AWS Secrets Manager and CloudWatch

## Repository Layout

```txt
apps/
  api/       Fastify API, Prisma schema, Dockerfile
  web/       React dashboard app
packages/
  shared/    Shared TypeScript types and Zod schemas
infra/
  terraform/ AWS infrastructure modules and dev environment
docs/        Architecture, deployment, security, cost, and readiness notes
```

## Local Development

```sh
pnpm install
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The API runs on `http://localhost:4000` and the web app runs on `http://localhost:5173`.

## API Surface

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `DELETE /v1/me`
- `GET|POST|PATCH|DELETE /v1/smoke-items`
- `GET|POST|PATCH|DELETE /v1/smoke-logs`
- `GET|POST|PATCH|DELETE /v1/goals`
- `GET /v1/analytics/summary`
- `GET /v1/analytics/daily-stats`
- `GET /v1/analytics/daily-target-progress`
- `POST /v1/exports`
- `GET /health`
- `GET /ready`

## AWS Case Study

See the `docs/` directory for the production architecture, deployment flow, security notes, cost notes, and production-readiness checklist.
