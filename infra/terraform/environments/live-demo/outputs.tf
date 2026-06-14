output "api_url" {
  value = module.ecs.api_url
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

output "ecr_repository_url" {
  value = module.ecr.repository_url
}
