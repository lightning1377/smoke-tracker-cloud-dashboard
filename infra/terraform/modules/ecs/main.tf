locals {
  short_name = substr(var.project_name, 0, 24)
}

resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-cluster"
}

resource "aws_lb" "api" {
  name               = "${local.short_name}-api"
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids
}

resource "aws_lb_target_group" "api" {
  name        = "${local.short_name}-api"
  port        = var.api_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/health"
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_iam_role" "task_execution" {
  name = "${var.project_name}-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task" {
  name = "${var.project_name}-api-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "task_exports" {
  name = "${var.project_name}-api-exports"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Effect   = "Allow"
        Resource = "${var.exports_bucket_arn}/exports/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "${var.project_name}-task-execution-secrets"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Effect = "Allow"
      Resource = [
        var.database_url_secret_arn,
        var.jwt_secret_arn
      ]
    }]
  })
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.api_image
      essential = true
      command   = ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
      portMappings = [{
        containerPort = var.api_port
        hostPort      = var.api_port
        protocol      = "tcp"
      }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = var.log_group_name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "api"
        }
      }
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "S3_EXPORT_BUCKET", value = var.exports_bucket_name },
        { name = "WEB_ORIGIN", value = var.web_origin }
      ]
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arn },
        { name = "ACCESS_TOKEN_SECRET", valueFrom = var.jwt_secret_arn },
        { name = "REFRESH_TOKEN_SECRET", valueFrom = var.jwt_secret_arn }
      ]
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = var.use_fargate_spot ? null : "FARGATE"

  dynamic "capacity_provider_strategy" {
    for_each = var.use_fargate_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 1
    }
  }

  network_configuration {
    subnets          = var.assign_public_ip ? var.public_subnet_ids : var.private_subnet_ids
    security_groups  = [var.service_sg_id]
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_port
  }

  depends_on = [aws_lb_listener.http]
}
