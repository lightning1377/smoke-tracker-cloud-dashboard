output "api_url" {
  value = "http://${aws_lb.api.dns_name}"
}

output "alb_dns_name" {
  value = aws_lb.api.dns_name
}
