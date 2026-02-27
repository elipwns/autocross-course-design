resource "aws_cognito_user_pool" "main" {
  name = "${local.resource_prefix}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  tags = {
    Name        = "${local.resource_prefix}-user-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                = "${local.resource_prefix}-client"
  user_pool_id        = aws_cognito_user_pool.main.id
  generate_secret     = false
  refresh_token_validity = 30
  access_token_validity = 1
  id_token_validity = 1
  
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}IdentityPool${var.environment}"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.client.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = {
    Name        = "${local.resource_prefix}-identity-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM roles are managed in the aws-iam-management repo.
# Role ARN is passed in via var.cognito_authenticated_role_arn.

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = var.cognito_authenticated_role_arn
  }
}

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users who can create events and venues"
}

resource "aws_cognito_user_group" "member" {
  name         = "Member"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Club members who can design courses and vote"
}
