output "api_url" {
  value       = module.lambda.api_gateway_url
  description = "The HTTP invoke URL of the API Gateway"
}

output "frontend_bucket_name" {
  value = module.frontend.bucket_name
}

output "exports_bucket_name" {
  value = module.frontend.exports_bucket_name
}

output "cloudfront_distribution_id" {
  value = module.frontend.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  value = module.frontend.cloudfront_domain_name
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "migration_lambda_function_name" {
  value       = module.lambda.migration_lambda_function_name
  description = "The function name of the Prisma migration Lambda"
}
