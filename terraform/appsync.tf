resource "aws_appsync_graphql_api" "main" {
  name                = "${local.resource_prefix}-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  
  user_pool_config {
    aws_region     = var.aws_region
    default_action = "ALLOW"
    user_pool_id   = aws_cognito_user_pool.main.id
  }

  schema = file("${path.module}/schema.graphql")

  tags = {
    Name        = "${local.resource_prefix}-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create resolvers for each type and operation
resource "aws_appsync_datasource" "courses_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "CoursesTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.courses.name
  }
}

resource "aws_appsync_datasource" "venues_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "VenuesTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.venues.name
  }
}

# IAM role for AppSync to access DynamoDB
resource "aws_iam_role" "appsync_dynamodb_role" {
  name = "${local.resource_prefix}-appsync-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "appsync_dynamodb_policy" {
  name = "${local.resource_prefix}-appsync-dynamodb-policy"
  role = aws_iam_role.appsync_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.courses.arn,
          "${aws_dynamodb_table.courses.arn}/index/*",
          aws_dynamodb_table.venues.arn,
          "${aws_dynamodb_table.venues.arn}/index/*"
        ]
      }
    ]
  })
}

# Create resolvers for Courses
resource "aws_appsync_resolver" "get_course" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getCourse"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "list_courses" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listCourses"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "Scan",
  "limit": $util.defaultIfNull($ctx.args.limit, 20),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null))
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

# Create resolvers for Venues
resource "aws_appsync_resolver" "get_venue" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getVenue"
  data_source = aws_appsync_datasource.venues_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "list_venues" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listVenues"
  data_source = aws_appsync_datasource.venues_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "Scan",
  "limit": $util.defaultIfNull($ctx.args.limit, 20),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null))
}
EOF

  response_template = "$util.toJson($ctx.result)"
}
