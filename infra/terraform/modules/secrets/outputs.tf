output "database_password_secret_arn" {
  value = aws_secretsmanager_secret.database_password.arn
}

output "database_url_secret_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}

output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt_secret.arn
}
