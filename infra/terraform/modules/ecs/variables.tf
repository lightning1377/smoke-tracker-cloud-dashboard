variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "service_sg_id" {
  type = string
}

variable "alb_sg_id" {
  type = string
}

variable "api_image" {
  type = string
}

variable "api_port" {
  type = number
}

variable "database_url_secret_arn" {
  type = string
}

variable "jwt_secret_arn" {
  type = string
}

variable "exports_bucket_name" {
  type = string
}

variable "exports_bucket_arn" {
  type = string
}

variable "log_group_name" {
  type = string
}

variable "web_origin" {
  type        = string
  description = "The allowed CORS origin URL of the web frontend"
}

variable "assign_public_ip" {
  type        = bool
  default     = false
  description = "Whether to assign a public IP to the ECS tasks"
}

variable "use_fargate_spot" {
  type        = bool
  default     = false
  description = "Whether to use Fargate Spot capacity provider"
}
