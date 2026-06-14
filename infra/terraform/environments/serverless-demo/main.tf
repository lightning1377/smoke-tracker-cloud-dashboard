terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source               = "../../modules/network"
  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "security" {
  source       = "../../modules/security"
  project_name = var.project_name
  vpc_id       = module.network.vpc_id
}

module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
}

module "secrets" {
  source       = "../../modules/secrets"
  project_name = var.project_name
}

# Ensure database URL and JWT secrets have version placeholders so first apply doesn't fail.
# User updates these secrets in the AWS console afterward, and TF will ignore changes to these placeholders.
resource "aws_secretsmanager_secret_version" "database_url_placeholder" {
  secret_id     = module.secrets.database_url_secret_arn
  secret_string = "mysql://smoke_admin:PLACEHOLDER@localhost:3306/smoke_tracker"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_version" "jwt_placeholder" {
  secret_id     = module.secrets.jwt_secret_arn
  secret_string = "PLACEHOLDER_JWT_SECRET_KEY_MIN_32_CHARS_LONG"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Read the resolved secrets from Secrets Manager at deploy-time to inject into Lambda environment variables
data "aws_secretsmanager_secret_version" "database_url" {
  secret_id  = module.secrets.database_url_secret_arn
  depends_on = [aws_secretsmanager_secret_version.database_url_placeholder]
}

data "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id  = module.secrets.jwt_secret_arn
  depends_on = [aws_secretsmanager_secret_version.jwt_placeholder]
}

module "rds" {
  source                       = "../../modules/rds"
  project_name                 = var.project_name
  private_subnet_ids           = module.network.private_subnet_ids
  database_sg_id               = module.security.database_sg_id
  database_name                = var.database_name
  database_username            = var.database_username
  database_password            = var.database_password
  database_password_secret_arn = module.secrets.database_password_secret_arn
}

module "monitoring" {
  source       = "../../modules/monitoring"
  project_name = var.project_name
}

module "lambda" {
  source              = "../../modules/lambda"
  project_name        = var.project_name
  aws_region          = var.aws_region
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
  service_sg_id       = module.security.service_sg_id
  api_image           = var.api_image
  database_url        = data.aws_secretsmanager_secret_version.database_url.secret_string
  jwt_secret          = data.aws_secretsmanager_secret_version.jwt_secret.secret_string
  exports_bucket_name = module.frontend.exports_bucket_name
  exports_bucket_arn  = module.frontend.exports_bucket_arn
  web_origin          = "https://${module.frontend.cloudfront_domain_name}"
}

module "frontend" {
  source                     = "../../modules/frontend"
  project_name               = var.project_name
  api_alb_dns_name           = module.lambda.api_gateway_domain_name
  api_origin_protocol_policy = "https-only" # API Gateway is HTTPS only
}

# Allow outbound traffic from Lambda tasks in private subnets
resource "aws_security_group_rule" "service_internet_egress" {
  type              = "egress"
  description       = "Allow Lambda tasks to reach the internet for AWS API calls."
  security_group_id = module.security.service_sg_id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}
