resource "aws_dynamodb_table" "courses" {
  name         = "${local.resource_prefix}-courses"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "owner"
    type = "S"
  }

  attribute {
    name = "eventId"
    type = "S"
  }

  global_secondary_index {
    name            = "OwnerIndex"
    hash_key        = "owner"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "EventIdIndex"
    hash_key        = "eventId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${local.resource_prefix}-courses"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "venues" {
  name         = "${local.resource_prefix}-venues"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "owner"
    type = "S"
  }

  global_secondary_index {
    name            = "OwnerIndex"
    hash_key        = "owner"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${local.resource_prefix}-venues"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "events" {
  name         = "${local.resource_prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "owner"
    type = "S"
  }

  global_secondary_index {
    name            = "OwnerIndex"
    hash_key        = "owner"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${local.resource_prefix}-events"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "votes" {
  name         = "${local.resource_prefix}-votes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "courseId"
    type = "S"
  }

  global_secondary_index {
    name            = "CourseIdIndex"
    hash_key        = "courseId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${local.resource_prefix}-votes"
    Environment = var.environment
    Project     = var.project_name
  }
}
