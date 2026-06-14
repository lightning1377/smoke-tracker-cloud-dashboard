data "aws_region" "current" {}

resource "aws_security_group" "endpoint" {
  name        = "${var.project_name}-endpoint-sg"
  description = "Allow ECS tasks to reach private interface VPC endpoints."
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.project_name}-endpoint-sg"
  }
}

resource "aws_security_group_rule" "endpoint_from_service_ingress" {
  type                     = "ingress"
  description              = "Allow HTTPS from ECS tasks to interface endpoints."
  security_group_id        = aws_security_group.endpoint.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = var.service_security_group_id
}

resource "aws_security_group_rule" "service_to_endpoints_egress" {
  type                     = "egress"
  description              = "Allow ECS tasks to reach private interface endpoints."
  security_group_id        = var.service_security_group_id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.endpoint.id
}

resource "aws_vpc_endpoint" "interface" {
  for_each = toset([
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager"
  ])

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.endpoint.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-${replace(each.key, ".", "-")}-endpoint"
  }
}
