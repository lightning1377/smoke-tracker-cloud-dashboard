output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "service_sg_id" {
  value = aws_security_group.service.id
}

output "database_sg_id" {
  value = aws_security_group.database.id
}

output "endpoint_sg_id" {
  value = aws_security_group.endpoint.id
}
