# Deployment

## Prerequisites

- AWS account with permissions for ECS, ECR, RDS, S3, CloudFront, IAM, ALB, VPC, CloudWatch, and Secrets Manager
- Terraform 1.8 or newer
- GitHub repository configured with AWS OIDC
- `pnpm`
- Docker

## Infrastructure

```sh
cd infra/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

The first apply creates the ECR repository, network, database, ECS service, frontend bucket, CloudFront distribution, and secrets placeholders.

## API Deployment

The `deploy-api.yml` workflow:

1. Builds the API Docker image.
2. Pushes `latest` and commit-SHA tags to ECR.
3. Forces an ECS service deployment.
4. Waits for the service to stabilize.

To enable deployments to AWS, set the repository variable `ENABLE_AWS_DEPLOY` to `true` in the GitHub repository settings.

## Web Deployment

The `deploy-web.yml` workflow:

1. Builds the React app with `VITE_API_BASE_URL`.
2. Syncs `apps/web/dist` to the S3 frontend bucket.
3. Invalidates the CloudFront cache.

## Environment Variables

Runtime secrets should live in AWS Secrets Manager. Local values are documented in `.env.example`.
