variable "project_name" {
  type    = string
  default = "smoke-tracker-cloud-dashboard"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.40.1.0/24", "10.40.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.40.11.0/24", "10.40.12.0/24"]
}

variable "database_name" {
  type    = string
  default = "smoke_tracker"
}

variable "database_username" {
  type    = string
  default = "smoke_admin"
}

variable "database_password" {
  type        = string
  description = "Initial RDS master password. Pass through TF_VAR_database_password, a local tfvars file, or CI secrets."
  sensitive   = true
}

variable "api_image" {
  type        = string
  description = "Full ECR image URI for the API Lambda definition."
}
