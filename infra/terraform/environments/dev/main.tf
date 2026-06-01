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

module "ecs" {
  source                  = "../../modules/ecs"
  project_name            = var.project_name
  aws_region              = var.aws_region
  vpc_id                  = module.network.vpc_id
  public_subnet_ids       = module.network.public_subnet_ids
  service_sg_id           = module.security.service_sg_id
  alb_sg_id               = module.security.alb_sg_id
  api_image               = var.api_image
  api_port                = 4000
  database_url_secret_arn = module.secrets.database_url_secret_arn
  jwt_secret_arn          = module.secrets.jwt_secret_arn
  log_group_name          = module.monitoring.api_log_group_name
  web_origin              = "https://${module.frontend.cloudfront_domain_name}"
}

module "frontend" {
  source           = "../../modules/frontend"
  project_name     = var.project_name
  api_alb_dns_name = module.ecs.alb_dns_name
}
