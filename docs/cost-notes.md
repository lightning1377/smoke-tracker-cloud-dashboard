# Cost Notes

## Main Cost Drivers

- RDS is the primary always-on cost.
- ECS Fargate cost depends on CPU, memory, and desired task count.
- ALB has an hourly cost even with low traffic.
- Interface VPC endpoints have hourly and data processing costs.
- CloudFront and S3 are usually low-cost for a small static frontend.

## Cost-Conscious Choices

- Start with one small Fargate service.
- Use a small RDS instance class for the dev case study.
- Keep CloudWatch retention at 14 days.
- In the `production-reference` topology, we avoid NAT Gateways by using private VPC endpoints.
- In the `live-demo` topology, we save ~$86/month by completely eliminating Interface VPC endpoints and running ECS tasks on Fargate Spot in public subnets, using the Internet Gateway (free) for egress.
- Provide a clear `terraform destroy` path for demo environments.

## Cleanup

```sh
# For the live demo environment:
cd infra/terraform/environments/live-demo
terraform destroy

# OR for the production-reference environment:
cd infra/terraform/environments/production-reference
terraform destroy
```

Before destroying, empty S3 buckets if AWS prevents bucket deletion.
