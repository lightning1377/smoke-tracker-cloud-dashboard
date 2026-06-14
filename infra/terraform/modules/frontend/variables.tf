variable "project_name" {
  type = string
}

variable "api_alb_dns_name" {
  type        = string
  description = "The DNS name of the API Application Load Balancer"
}

variable "api_origin_protocol_policy" {
  type        = string
  default     = "http-only"
  description = "The origin protocol policy for the API origin (http-only or https-only)"
}
