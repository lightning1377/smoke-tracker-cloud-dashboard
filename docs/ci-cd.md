# CI/CD

## Pull Requests

`ci.yml` runs type checking, linting, tests, and builds for all workspace packages.

`terraform-plan.yml` runs when infrastructure files change and performs:

- `terraform fmt -check`
- `terraform init`
- `terraform validate`
- `terraform plan`

## Main Branch

- **ECS Deployments**: `deploy-api.yml` deploys the containerized API to ECS Fargate by updating the ECS Fargate service (for `live-demo` or `production-reference`).
- **Serverless Deployments**: Builds the container, pushes it to ECR, invokes the Migration Lambda function to apply Prisma migrations, and triggers an update-function-code command on the main API Lambda function (for `serverless-demo`).
- **Frontend Deployments**: `deploy-web.yml` deploys static frontend assets to S3 and invalidates CloudFront.

To enable deployments to AWS, set the repository variable `ENABLE_AWS_DEPLOY` to `true` in the GitHub repository settings.

## Authentication

Use GitHub OIDC with `aws-actions/configure-aws-credentials` instead of long-lived AWS access keys. The deployment role should be scoped to the resources created by this project.
