output "bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "exports_bucket_name" {
  value = aws_s3_bucket.exports.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}
