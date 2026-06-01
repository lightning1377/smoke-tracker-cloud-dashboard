# Security

## Implemented in the Design

- No secrets committed to GitHub
- Runtime secrets stored in AWS Secrets Manager
- GitHub Actions designed for AWS OIDC
- ECS tasks run in private subnets without public IP addresses
- ECS tasks have no general internet egress or NAT Gateway route
- VPC endpoints provide private access to ECR, S3, Secrets Manager, and CloudWatch Logs
- RDS not publicly accessible
- MySQL security group allows traffic only from ECS tasks
- ECS security group egress is limited to RDS, VPC endpoints, and S3
- Frontend S3 bucket blocks public access
- CloudFront Origin Access Control for frontend assets
- Signed URLs for export downloads
- Rate limiting registered in the Fastify API
- HTTP security headers registered through Fastify Helmet

## Auth Model

The API is designed around:

- Argon2 password hashing
- Short-lived JWT access tokens stored in HTTP-only cookies
- HTTP-only refresh cookie
- Refresh token rotation
- Revocation via the `refresh_tokens` table

## Future Hardening

- WAF in front of the ALB and CloudFront
- ACM certificates and custom domains
- Blue/green deployments
- OpenTelemetry traces
- Multi-AZ RDS
- Automated backup restore testing
