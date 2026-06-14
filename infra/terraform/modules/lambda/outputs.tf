output "api_gateway_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "The HTTP invoke URL of the API Gateway stage"
}

output "api_gateway_domain_name" {
  # Strip "https://" prefix for CloudFront distribution origin use
  value       = replace(aws_apigatewayv2_api.http_api.api_endpoint, "https://", "")
  description = "The domain name of the API Gateway endpoint"
}

output "api_lambda_arn" {
  value = aws_lambda_function.api.arn
}

output "migration_lambda_function_name" {
  value       = aws_lambda_function.migration.function_name
  description = "The function name of the Prisma migration Lambda"
}
