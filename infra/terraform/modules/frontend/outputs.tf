output "bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "exports_bucket_name" {
  value = aws_s3_bucket.exports.bucket
}

output "exports_bucket_arn" {
  value = aws_s3_bucket.exports.arn
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}
