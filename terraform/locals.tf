# Random suffix for unique resource naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local values
locals {
  common_tags = {
    Project     = "Simon Memory Game"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "Jason Diaz"
  }
  
  bucket_name = "${var.project_name}-${var.environment}-${random_string.suffix.result}"
  # Fix: Remove circular dependency - don't reference CloudFront domain here
  domain_name = var.domain_name != "" ? var.domain_name : "placeholder-domain"
  
  # Environment-specific configurations
  cache_ttl = {
    dev     = { min = 0, default = 300, max = 3600 }
    staging = { min = 0, default = 3600, max = 86400 }
    prod    = { min = 0, default = 86400, max = 31536000 }
  }
  
  lambda_config = {
    runtime     = "nodejs18.x"
    timeout     = 5
    memory_size = 128
  }
}

# Current AWS caller identity
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {}

# Route 53 hosted zone (if domain specified)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}
