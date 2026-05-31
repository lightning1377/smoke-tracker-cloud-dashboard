resource "aws_secretsmanager_secret" "database_password" {
  name = "${var.project_name}/database-password"
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${var.project_name}/database-url"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}/jwt-secret"
}
