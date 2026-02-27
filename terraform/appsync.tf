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

# Datasources
resource "aws_appsync_datasource" "courses_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "CoursesTable"
  service_role_arn = var.appsync_dynamodb_role_arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.courses.name
  }
}

resource "aws_appsync_datasource" "venues_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "VenuesTable"
  service_role_arn = var.appsync_dynamodb_role_arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.venues.name
  }
}

resource "aws_appsync_datasource" "events_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "EventsTable"
  service_role_arn = var.appsync_dynamodb_role_arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.events.name
  }
}

resource "aws_appsync_datasource" "votes_table" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "VotesTable"
  service_role_arn = var.appsync_dynamodb_role_arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.votes.name
  }
}

# IAM roles are managed in the aws-iam-management repo.
# Role ARNs are passed in via var.appsync_dynamodb_role_arn.

# Course resolvers
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

resource "aws_appsync_resolver" "list_courses_by_event" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listCoursesByEvent"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "EventIdIndex",
  "query": {
    "expression": "eventId = :eventId",
    "expressionValues": {
      ":eventId": $util.dynamodb.toDynamoDBJson($ctx.args.eventId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 20),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null))
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "create_course" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createCourse"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input)
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "update_course" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateCourse"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  #set($input = $ctx.args.input)
  #set($expNames = {})
  #set($expValues = {})
  #set($expSet = [])
  #foreach($key in $input.keySet())
    #if($key != "id")
      #set($expNames["#$key"] = "$key")
      #set($expValues[":$key"] = $util.dynamodb.toDynamoDB($input[$key]))
      $util.qr($expSet.add("#$key = :$key"))
    #end
  #end
  "update": {
    "expression": "SET #expSet",
    "expressionNames": $util.toJson($expNames),
    "expressionValues": $util.toJson($expValues)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "delete_course" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteCourse"
  data_source = aws_appsync_datasource.courses_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

# Venue resolvers
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

resource "aws_appsync_resolver" "create_venue" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createVenue"
  data_source = aws_appsync_datasource.venues_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input)
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "update_venue" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateVenue"
  data_source = aws_appsync_datasource.venues_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  #set($input = $ctx.args.input)
  #set($expNames = {})
  #set($expValues = {})
  #set($expSet = [])
  #foreach($key in $input.keySet())
    #if($key != "id")
      #set($expNames["#$key"] = "$key")
      #set($expValues[":$key"] = $util.dynamodb.toDynamoDB($input[$key]))
      $util.qr($expSet.add("#$key = :$key"))
    #end
  #end
  "update": {
    "expression": "SET #expSet",
    "expressionNames": $util.toJson($expNames),
    "expressionValues": $util.toJson($expValues)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "delete_venue" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteVenue"
  data_source = aws_appsync_datasource.venues_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

# Event resolvers
resource "aws_appsync_resolver" "get_event" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getEvent"
  data_source = aws_appsync_datasource.events_table.name

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

resource "aws_appsync_resolver" "list_events" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listEvents"
  data_source = aws_appsync_datasource.events_table.name

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

resource "aws_appsync_resolver" "create_event" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createEvent"
  data_source = aws_appsync_datasource.events_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input)
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "delete_event" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteEvent"
  data_source = aws_appsync_datasource.events_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

# Vote resolvers
resource "aws_appsync_resolver" "create_vote" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createVote"
  data_source = aws_appsync_datasource.votes_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input)
}
EOF

  response_template = "$util.toJson($ctx.result)"
}

resource "aws_appsync_resolver" "delete_vote" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteVote"
  data_source = aws_appsync_datasource.votes_table.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  }
}
EOF

  response_template = "$util.toJson($ctx.result)"
}
