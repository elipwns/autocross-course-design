resource "aws_dynamodb_table" "courses" {
  name         = "${local.resource_prefix}-courses"
  billing_mode = "PAY_PER_REQUEST"  # On-demand pricing
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
    Name        = "${local.resource_prefix}-courses"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "venues" {
  name         = "${local.resource_prefix}-venues"
  billing_mode = "PAY_PER_REQUEST"  # On-demand pricing
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
