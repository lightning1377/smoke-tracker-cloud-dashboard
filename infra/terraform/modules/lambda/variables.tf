variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "service_sg_id" {
  type = string
}

variable "api_image" {
  type        = string
  description = "The ECR container image URI for the API"
}

variable "database_url" {
  type        = string
  sensitive   = true
  description = "Resolved database connection URL string"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "Resolved JWT signing key secret string"
}

variable "exports_bucket_name" {
  type = string
}

variable "exports_bucket_arn" {
  type = string
}

variable "web_origin" {
  type        = string
  description = "The origin domain of the web frontend (CloudFront)"
}
