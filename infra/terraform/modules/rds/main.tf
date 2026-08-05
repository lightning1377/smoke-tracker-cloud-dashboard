resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_parameter_group" "this" {
  name        = "${var.project_name}-mysql84-pg"
  family      = "mysql8.4"
  description = "Custom parameter group for MySQL 8.4 DB instance"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "mysql" {
  identifier                  = "${var.project_name}-mysql"
  engine                      = "mysql"
  engine_version              = var.engine_version
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  db_name                     = var.database_name
  username                    = var.database_username
  password                    = var.database_password
  db_subnet_group_name        = aws_db_subnet_group.this.name
  parameter_group_name        = aws_db_parameter_group.this.name
  vpc_security_group_ids      = [var.database_sg_id]
  publicly_accessible         = false
  skip_final_snapshot         = true
  allow_major_version_upgrade = true
  auto_minor_version_upgrade  = true

  lifecycle {
    ignore_changes = [password]
  }
}

