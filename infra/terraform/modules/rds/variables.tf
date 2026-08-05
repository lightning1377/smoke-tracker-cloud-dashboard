variable "project_name" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "database_sg_id" {
  type = string
}

variable "database_name" {
  type = string
}

variable "database_username" {
  type = string
}

variable "database_password" {
  type      = string
  sensitive = true
}

variable "database_password_secret_arn" {
  type = string
}

variable "engine_version" {
  type        = string
  description = "MySQL engine version"
  default     = "8.4"
}

