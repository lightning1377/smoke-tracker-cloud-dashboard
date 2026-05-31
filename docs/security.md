# Security

## Implemented in the Design

- No secrets committed to GitHub
- Runtime secrets stored in AWS Secrets Manager
- GitHub Actions designed for AWS OIDC
- RDS not publicly accessible
- MySQL security group allows traffic only from ECS tasks
- Frontend S3 bucket blocks public access
- CloudFront Origin Access Control for frontend assets
- Private exports bucket planned for generated files
- Rate limiting registered in the Fastify API
- HTTP security headers registered through Fastify Helmet

## Auth Model

The API is designed around:

- Argon2 password hashing
- Short-lived JWT access tokens
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
- Signed URLs for export downloads
