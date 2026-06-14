# Cost Notes

## Main Cost Drivers

- RDS is the primary always-on cost.
- ECS Fargate cost depends on CPU, memory, and desired task count (in ECS topologies).
- ALB has an hourly cost even with low traffic (in ECS topologies).
- Interface VPC endpoints have hourly and data processing costs (in production-reference topology).
- CloudFront and S3 are usually low-cost for a small static frontend.
- API Gateway and AWS Lambda (in serverless topology) have zero idle cost and only incur charges per execution.

## Cost-Conscious Choices

- Start with one small Fargate service or run on AWS Lambda.
- Use a small RDS instance class for the dev case study.
- Keep CloudWatch retention at 14 days.
- In the `production-reference` topology, we avoid NAT Gateways by using private VPC endpoints.
- In the `live-demo` topology, we save ~$86/month by completely eliminating Interface VPC endpoints and running ECS tasks on Fargate Spot in public subnets, using the Internet Gateway (free) for egress.
- In the `serverless-demo` topology, we save **~87%** of our total infrastructure costs by completely eliminating the ALB and ECS Fargate. Compute charges scale to zero when not in use, leaving RDS as the only active cost (~$13/month).
- Provide a clear `terraform destroy` path for demo environments.

## Cleanup

```sh
# For the serverless demo environment (Recommended):
cd infra/terraform/environments/serverless-demo
terraform destroy

# OR for the live demo environment:
cd infra/terraform/environments/live-demo
terraform destroy

# OR for the production-reference environment:
cd infra/terraform/environments/production-reference
terraform destroy
```

Before destroying, empty S3 buckets if AWS prevents bucket deletion.
