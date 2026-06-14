variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "service_security_group_id" {
  type        = string
  description = "The security group ID of the ECS service to allow egress to endpoints."
}
