data "aws_region" "current" {}

data "aws_prefix_list" "s3" {
  name = "com.amazonaws.${data.aws_region.current.name}.s3"
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Allow public HTTP ingress to the API load balancer."
  vpc_id      = var.vpc_id
}

resource "aws_security_group" "service" {
  name        = "${var.project_name}-service-sg"
  description = "Allow traffic from ALB to ECS tasks."
  vpc_id      = var.vpc_id
}

resource "aws_security_group" "database" {
  name        = "${var.project_name}-database-sg"
  description = "Allow MySQL from ECS tasks only."
  vpc_id      = var.vpc_id
}

resource "aws_security_group" "endpoint" {
  name        = "${var.project_name}-endpoint-sg"
  description = "Allow ECS tasks to reach private interface VPC endpoints."
  vpc_id      = var.vpc_id
}

resource "aws_security_group_rule" "alb_http_ingress" {
  type              = "ingress"
  description       = "Allow public HTTP traffic to the API load balancer."
  security_group_id = aws_security_group.alb.id
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_to_service_egress" {
  type                     = "egress"
  description              = "Allow ALB traffic to ECS tasks."
  security_group_id        = aws_security_group.alb.id
  from_port                = 4000
  to_port                  = 4000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.service.id
}

resource "aws_security_group_rule" "service_from_alb_ingress" {
  type                     = "ingress"
  description              = "Allow API traffic from the ALB."
  security_group_id        = aws_security_group.service.id
  from_port                = 4000
  to_port                  = 4000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "service_to_database_egress" {
  type                     = "egress"
  description              = "Allow ECS tasks to connect to MySQL."
  security_group_id        = aws_security_group.service.id
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.database.id
}

resource "aws_security_group_rule" "database_from_service_ingress" {
  type                     = "ingress"
  description              = "Allow MySQL from ECS tasks only."
  security_group_id        = aws_security_group.database.id
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.service.id
}

resource "aws_security_group_rule" "service_to_endpoints_egress" {
  type                     = "egress"
  description              = "Allow ECS tasks to reach private interface endpoints."
  security_group_id        = aws_security_group.service.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.endpoint.id
}

resource "aws_security_group_rule" "endpoint_from_service_ingress" {
  type                     = "ingress"
  description              = "Allow HTTPS from ECS tasks to interface endpoints."
  security_group_id        = aws_security_group.endpoint.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.service.id
}

resource "aws_security_group_rule" "service_to_s3_egress" {
  type              = "egress"
  description       = "Allow ECS tasks to reach S3 through the gateway endpoint."
  security_group_id = aws_security_group.service.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_prefix_list.s3.id]
}
