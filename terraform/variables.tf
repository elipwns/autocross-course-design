variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  default     = "autocross-course-designer"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  default     = "dev"
}

variable "frontend_domain" {
  description = "Domain name for the frontend (leave empty if not using custom domain)"
  default     = ""
}

variable "enable_custom_domain" {
  description = "Whether to enable custom domain for CloudFront"
  type        = bool
  default     = false
}

variable "appsync_dynamodb_role_arn" {
  description = "ARN of the IAM role for AppSync to access DynamoDB (managed in aws-iam-management)"
  type        = string
  default     = "arn:aws:iam::772255980793:role/autocross-course-designer-dev-appsync-dynamodb-role"
}

variable "cognito_authenticated_role_arn" {
  description = "ARN of the IAM role for Cognito authenticated users (managed in aws-iam-management)"
  type        = string
  default     = "arn:aws:iam::772255980793:role/autocross-course-designer-dev-cognito-authenticated-role"
}
