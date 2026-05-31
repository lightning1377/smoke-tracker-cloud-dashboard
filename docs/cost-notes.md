# Cost Notes

## Main Cost Drivers

- RDS is the primary always-on cost.
- ECS Fargate cost depends on CPU, memory, and desired task count.
- ALB has an hourly cost even with low traffic.
- CloudFront and S3 are usually low-cost for a small static frontend.

## Cost-Conscious Choices

- Start with one small Fargate service.
- Use a small RDS instance class for the dev case study.
- Keep CloudWatch retention at 14 days.
- Avoid NAT Gateway in the dev topology and document the tradeoff.
- Provide a clear `terraform destroy` path for demo environments.

## Cleanup

```sh
cd infra/terraform/environments/dev
terraform destroy
```

Before destroying, empty S3 buckets if AWS prevents bucket deletion.
