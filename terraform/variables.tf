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
