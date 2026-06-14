resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach standard AWSLambdaVPCAccessExecutionRole policy to allow VPC ENI creations
resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Policy allowing Lambda to write and upload to S3 exports bucket
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project_name}-lambda-s3"
  role = aws_iam_role.lambda.id

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

# Primary API backend Lambda
resource "aws_lambda_function" "api" {
  function_name = "${var.project_name}-api"
  package_type  = "Image"
  image_uri     = var.api_image
  role          = aws_iam_role.lambda.arn
  timeout       = 30
  memory_size   = 1024

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.service_sg_id]
  }

  environment {
    variables = {
      NODE_ENV             = "production"
      S3_EXPORT_BUCKET     = var.exports_bucket_name
      WEB_ORIGIN           = var.web_origin
      DATABASE_URL         = var.database_url
      ACCESS_TOKEN_SECRET  = var.jwt_secret
      REFRESH_TOKEN_SECRET = var.jwt_secret
    }
  }

  # Ensure VPC ENIs are cleaned up on delete
  depends_on = [aws_iam_role_policy_attachment.lambda_vpc_access]
}

# Dedicated database migration Lambda
resource "aws_lambda_function" "migration" {
  function_name = "${var.project_name}-migration"
  package_type  = "Image"
  image_uri     = var.api_image
  role          = aws_iam_role.lambda.arn
  timeout       = 300
  memory_size   = 1024

  image_config {
    command = ["npx", "prisma", "migrate", "deploy"]
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.service_sg_id]
  }

  environment {
    variables = {
      NODE_ENV     = "production"
      DATABASE_URL = var.database_url
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_vpc_access]
}

# HTTP API Gateway (v2)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-api-gateway"
  protocol_type = "HTTP"
}

# API Gateway default stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Lambda integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway wildcard proxy route (routes all paths like /v1/* to Lambda)
resource "aws_apigatewayv2_route" "any" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API Gateway root route (routes / to Lambda)
resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Permission for API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
