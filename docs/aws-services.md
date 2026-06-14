# AWS Services

## ECS Fargate

Runs the containerized Fastify API without managing EC2 instances. Fargate is a good fit for this case study because it demonstrates container deployment and service health without introducing Kubernetes.

## ECR

Stores Docker images built by GitHub Actions and pulled by ECS task definitions.

## RDS MySQL

Hosts the relational Smoke Tracker data model: users, refresh tokens, smoke items, smoke logs, goals, and export jobs.

## S3 and CloudFront

S3 stores static React assets and CloudFront serves them globally over HTTPS. The bucket blocks direct public access.

## Application Load Balancer

Provides the public API entry point, health checks, and routing to ECS tasks.

## Secrets Manager

Stores database credentials, database URL, JWT signing secrets, and any future export signing secrets.

## CloudWatch

Collects structured API logs and supports basic operational visibility.

## IAM

Controls deployment, ECS task execution, image pull permissions, secret access, S3/CloudFront deployment actions, and AWS Lambda execution permissions.

## AWS Lambda

Runs the Fastify API containers on-demand in the `serverless-demo` environment, scaling down to zero compute instances when inactive to minimize costs. Also runs a dedicated one-off database migration container.

## AWS API Gateway (HTTP API)

Provides a serverless entry point routing HTTP requests directly to the API Lambda function in the `serverless-demo` environment, completely avoiding ALB idle costs.
