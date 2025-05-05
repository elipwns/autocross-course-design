provider "aws" {
  region = var.aws_region
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  
  # Uncomment this block and update the bucket name when you're ready to use remote state
  # backend "s3" {
  #   bucket = "autocross-course-designer-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Create a random suffix for resource names to avoid conflicts
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  resource_prefix = "${var.project_name}-${var.environment}"
  resource_suffix = random_string.suffix.result
}
