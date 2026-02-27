resource "aws_s3_bucket" "venue_images" {
  bucket = "${local.resource_prefix}-venue-images-${local.resource_suffix}"

  tags = {
    Name        = "${local.resource_prefix}-venue-images"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_cors_configuration" "venue_images_cors" {
  bucket = aws_s3_bucket.venue_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]  # Restrict this in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "venue_images_public_access" {
  bucket = aws_s3_bucket.venue_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
