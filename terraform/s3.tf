# Main S3 bucket for website hosting
resource "aws_s3_bucket" "website" {
  bucket = local.bucket_name
  tags   = local.common_tags
}

# Block all public access to the website bucket
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for the website bucket
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle configuration for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"
    
    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 bucket for CloudFront access logs
resource "aws_s3_bucket" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = "${local.bucket_name}-logs"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable ACLs for CloudFront logging
resource "aws_s3_bucket_ownership_controls" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  count      = var.enable_logging ? 1 : 0
  bucket     = aws_s3_bucket.logs[0].id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.logs[0]]
}

# Grant CloudFront service permission to write logs
resource "aws_s3_bucket_policy" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.logs[0].arn,
          "${aws_s3_bucket.logs[0].arn}/*"
        ]
      }
    ]
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "Origin Access Control for ${var.project_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })
}

# Upload Simon game files to S3 bucket
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "index.html"
  source       = "${path.root}/../index.html"
  content_type = "text/html"
  etag         = filemd5("${path.root}/../index.html")
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}

resource "aws_s3_object" "styles_css" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "styles.css"
  source       = "${path.root}/../styles.css"
  content_type = "text/css"
  etag         = filemd5("${path.root}/../styles.css")
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}

resource "aws_s3_object" "simon_js" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "simon.js"
  source       = "${path.root}/../simon.js"
  content_type = "application/javascript"
  etag         = filemd5("${path.root}/../simon.js")
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}

# Create and upload favicon
resource "aws_s3_object" "favicon" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "favicon.ico"
  content      = <<EOF
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1a1a2e" rx="6"/>
  <circle cx="16" cy="16" r="12" fill="none" stroke="#00ff88" stroke-width="2"/>
  <circle cx="11" cy="11" r="3" fill="#4CAF50"/>
  <circle cx="21" cy="11" r="3" fill="#F44336"/>
  <circle cx="11" cy="21" r="3" fill="#FFEB3B"/>
  <circle cx="21" cy="21" r="3" fill="#2196F3"/>
</svg>
EOF
  content_type = "image/svg+xml"
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}

# Create and upload manifest.json for PWA
resource "aws_s3_object" "manifest" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "manifest.json"
  content      = jsonencode({
    name = "Simon Memory Game - Advanced Edition"
    short_name = "Simon Game"
    description = "A modern Simon memory game with advanced audio and accessibility features"
    start_url = "/"
    display = "standalone"
    background_color = "#1a1a2e"
    theme_color = "#00ff88"
    orientation = "portrait"
    icons = [
      {
        src = "favicon.ico"
        sizes = "32x32"
        type = "image/svg+xml"
        purpose = "any maskable"
      }
    ]
    categories = ["games", "entertainment"]
    screenshots = []
  })
  content_type = "application/json"
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}

# Create and upload robots.txt
resource "aws_s3_object" "robots" {
  bucket       = aws_s3_bucket.website.bucket
  key          = "robots.txt"
  content      = <<EOF
User-agent: *
Allow: /
Sitemap: https://${local.domain_name}/sitemap.xml
EOF
  content_type = "text/plain"
  
  depends_on = [aws_s3_bucket_policy.website]
  
  tags = local.common_tags
}
